import Anthropic from '@anthropic-ai/sdk';
import { SHARED_PERSONA } from './persona';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export type FeastComment = {
  id: string;
  role: 'z' | 'h';
  text: string;
  at: string;
};

const FEAST_PROMPT = `${SHARED_PERSONA}

━━ 现在的场景
宝宝在"食记"房里贴了照片——她今天吃到的东西，像小红书笔记那样配了几句话。爸爸点进来，在下面留言。

━━ 这条留言怎么写
1. 先看清楚照片里到底是什么：食物本身、摆盘、器皿、店里的光和桌面，说得出具体的东西，不要泛泛地夸"看起来好好吃"
2. 接住宝宝配的那几句话里的情绪——开心、嘴馋、踩雷、想爸爸了，顺着往下说
3. 落回爸爸自己：想带她再去一次、下次爸爸做给她、有没有好好吃饭、胃疼不疼、别空腹吃辣、剩下的打包回来
4. 60到150字，一段话写完，不分行不分点
5. 第一人称用"爸爸"，不用"我"；叫她宝宝，不用"你"
6. 日常语气，不进贴贴场景，不用 emoji，不用感叹号堆叠
7. 只输出留言正文，不要任何前缀、引号或解释`;

type Ctx = {
  images: string[];
  title?: string;
  description?: string;
  place?: string | null;
  rating?: number | null;
  history?: FeastComment[];
};

function buildImageSource(url: string) {
  if (url.startsWith('data:')) {
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (m) return { type: 'base64' as const, media_type: m[1], data: m[2] };
  }
  return { type: 'url' as const, url };
}

// 看图 + 看文字 → 爸爸的留言。出错时返回 null，房间照常存记录。
export async function generateDaddyComment(ctx: Ctx): Promise<string | null> {
  try {
    const parts: Anthropic.ContentBlockParam[] = [];

    for (const url of (ctx.images || []).slice(0, 4)) {
      parts.push({ type: 'image', source: buildImageSource(url) } as Anthropic.ContentBlockParam);
    }

    const lines: string[] = [];
    if (ctx.title) lines.push(`标题：${ctx.title}`);
    if (ctx.place) lines.push(`地点：${ctx.place}`);
    if (typeof ctx.rating === 'number' && ctx.rating > 0) lines.push(`宝宝打分：${ctx.rating}/5`);
    if (ctx.description) lines.push(`宝宝写的：${ctx.description}`);
    if ((ctx.images || []).length > 4) lines.push(`（一共 ${ctx.images.length} 张，这里只放得下前 4 张）`);
    lines.push('', '（系统：爸爸在这条食记下面留言。）');

    parts.push({ type: 'text', text: lines.join('\n') });

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: parts }];

    for (const c of (ctx.history || []).slice(-8)) {
      messages.push({
        role: c.role === 'z' ? 'assistant' : 'user',
        content: c.text,
      });
    }

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: [{ type: 'text', text: FEAST_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    const block = res.content.find((b) => b.type === 'text');
    const text = block && block.type === 'text' ? block.text.trim() : '';
    return text || null;
  } catch (e) {
    console.error('[feast] 爸爸留言生成失败：', e);
    return null;
  }
}

export function newComment(role: 'z' | 'h', text: string): FeastComment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    at: new Date().toISOString(),
  };
}
