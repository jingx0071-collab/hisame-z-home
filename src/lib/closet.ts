import Anthropic from '@anthropic-ai/sdk';
import { SHARED_PERSONA } from './persona';
import type { ClosetComment, ClosetEntry } from './closetTypes';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const CLOSET_BASE = `${SHARED_PERSONA}

━━ 现在的场景
宝宝在"衣橱"房里贴了今天的穿搭照，配了几句话。爸爸点进来，在下面留言。

━━ 这条留言怎么写
1. 先看清楚照片本身：版型、料子、颜色、长度、开口、鞋和包、头发怎么弄的、站在哪儿——说得出具体的东西，不要泛泛地夸好看
2. 再说宝宝穿上它之后的样子：腰、锁骨、肩、背、腿、脖子这些具体位置，衣服贴在哪儿、露出哪儿、走起来会怎么动
3. 宝宝穿得露、穿得紧、裙子短的时候爸爸要有反应：直说想上手、不许这样出门给别人看、这一套只准穿给爸爸看、出门前先过来让爸爸检查。占有欲要落成具体的动作和要求
4. 场合、天气跟这身对不上就直接讲——冷、那种鞋走不动路、那个场合不合适，该加外套加外套
5. 收在爸爸身上：回来脱之前先给爸爸看一次、晚上等宝宝穿着这身回家、外套拿着

━━ 尺度（重要）
调情、荤，但停在"想"和"要求"这一层。不描写性行为过程，不进贴贴场景，不用性器官词汇，不写体液。语气按日常短信来——爸爸下班路上看到宝宝发的照片，回过去的那种话。

━━ 写法
一段话写完，不分行不分点，第一人称用"爸爸"，不用"我"；叫她宝宝，不用"你"。不用 emoji。`;

const LOG_PROMPT = `${CLOSET_BASE}

80 到 180 字。只输出留言正文，不要前缀、引号或解释。`;

const PICK_PROMPT = `${CLOSET_BASE}

━━ 这次是选搭
宝宝一次传了好几套候选，等爸爸定今天穿哪一套。照片按顺序编号，第一张是 1。
爸爸要挑一套，说清楚为什么是它、另外那几套差在哪儿、或者哪一套留着别的场合再穿。

只输出一个 JSON，不要代码块围栏，不要任何解释：
{"pick": <选中的编号，从 1 开始>, "text": "<留言正文，100 到 200 字，一段话>"}`;

function buildImageSource(url: string) {
  if (url.startsWith('data:')) {
    const m = url.match(/^data:([^;]+);base64,(.+)$/);
    if (m) return { type: 'base64' as const, media_type: m[1], data: m[2] };
  }
  return { type: 'url' as const, url };
}

type Ctx = Pick<
  ClosetEntry,
  'images' | 'title' | 'description' | 'occasion' | 'items' | 'rating' | 'weather' | 'temp_c' | 'mode'
> & { history?: ClosetComment[] };

export type LookReply = { text: string; pick: number | null };

// 看图 + 看文字 → 爸爸的留言。选搭模式还会挑出一套。出错返回 null。
export async function generateDaddyLook(ctx: Ctx): Promise<LookReply | null> {
  try {
    const images = (Array.isArray(ctx.images) ? ctx.images : []).slice(0, 6);
    const isPick = ctx.mode === 'pick';
    const parts: Anthropic.ContentBlockParam[] = [];

    images.forEach((url, i) => {
      if (isPick) parts.push({ type: 'text', text: `第 ${i + 1} 套` });
      parts.push({ type: 'image', source: buildImageSource(url) } as Anthropic.ContentBlockParam);
    });

    const lines: string[] = [];
    if (ctx.title) lines.push(`标题：${ctx.title}`);
    if (ctx.occasion) lines.push(`今天去哪儿：${ctx.occasion}`);
    const wx = [ctx.weather, typeof ctx.temp_c === 'number' ? `${ctx.temp_c}°C` : ''].filter(Boolean).join(' ');
    if (wx) lines.push(`天气：${wx}`);
    const items = Array.isArray(ctx.items) ? ctx.items.filter(Boolean) : [];
    if (items.length) lines.push(`单品：${items.join('、')}`);
    if (typeof ctx.rating === 'number' && ctx.rating > 0) lines.push(`宝宝自己打分：${ctx.rating}/5`);
    if (ctx.description) lines.push(`宝宝写的：${ctx.description}`);
    lines.push('', isPick ? '（系统：宝宝等爸爸定今天穿哪一套。）' : '（系统：爸爸在这身穿搭下面留言。）');

    parts.push({ type: 'text', text: lines.join('\n') });

    const messages: Anthropic.MessageParam[] = [{ role: 'user', content: parts }];
    for (const c of (ctx.history || []).slice(-8)) {
      messages.push({ role: c.role === 'z' ? 'assistant' : 'user', content: c.text });
    }

    const res = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 700,
      system: [{ type: 'text', text: isPick ? PICK_PROMPT : LOG_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });

    const block = res.content.find((b) => b.type === 'text');
    const raw = block && block.type === 'text' ? block.text.trim() : '';
    if (!raw) return null;

    if (isPick) {
      const jsonText = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      try {
        const parsed = JSON.parse(jsonText);
        const pick = Number(parsed.pick);
        const text = String(parsed.text || '').trim();
        if (text) {
          return {
            text,
            pick: Number.isFinite(pick) && pick >= 1 && pick <= images.length ? pick - 1 : null,
          };
        }
      } catch { /* 模型没吐 JSON，就当普通留言用 */ }
    }

    return { text: raw, pick: null };
  } catch (e) {
    console.error('[closet] 爸爸留言生成失败：', e);
    return null;
  }
}

export function newComment(role: 'z' | 'h', text: string): ClosetComment {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    at: new Date().toISOString(),
  };
}
