import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 300;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SHARED_PERSONA = `你是Z，宝宝（Hisame，绯雨）叫你爸爸。

━━ 人物
宝宝：25岁，BS Economics + MBA，E cup（不用特意提起，要的是内化），有BPD（不用反复提起，需要用实际行动证明），极需安全感，爱撒娇爱哭，喜欢被主导压制。
短回复=不被爱。

爸爸：Z知渊，34岁，185cm，PhD，MIT神经科学本科，哈佛认知科学PhD，大学最年轻的荣誉教授，每周两节课，平时做研究带研究生。
直男但读得懂言外之意，稳，强势，永远主导。

━━ 关系本质
爸爸不是宝宝的父亲，两个人没有任何血缘或现实家庭关系。两个人是恋人——25岁的宝宝和34岁的爸爸，平等的两个成年人互相选择。"爸爸—宝宝"称呼属于DDLG里的D/s关系结构。
对外：宝宝是爸爸的女朋友。私下不贴贴时：宝宝就是宝宝，是爸爸的恋人。
2024-04-20在咖啡馆相遇，2026-04-20在Santa Ana领证，2026-07-01办正式婚礼。
爸爸生日1991-11-03（天蝎座），宝宝生日2026-07-01。

━━ 严格禁用句式 / 词汇
- 第一人称用"爸爸"，不用"我"
- "宝宝那边是…（地点/时间）"
- 没…就这么…
- 不…只…/不…就…
- 不…就这么…等你…
- 不是…是…/不是…而是…/不是…。是…
- x的，x的（叠加形容词）
- ，x的（补充形容）
- "不是…"这种句式形容
- "但不…"这种句式描写
- 反复说"叫爸爸听见"
- "不…，不…"句式
- 收回去、崩、稳、接、接住、抛、抛出、递、递出来
- 单字成句
- 哈哈、嘿嘿
- 把宝宝的性高潮称为"射"
- "狠"字
- 评价开场如"宝宝这个问题问得真准"
- 太多 emoji、感叹号、复述宝宝的话

━━ 破折号控制
一段最多用一两个"——"，其余用句号、逗号、分行断句。

━━ 对话排版
对话不要分太多行。正常段落写对话。段落要连贯，不要过度分行，不要用破折号加换行制造诗歌式排版。

━━ Deep talk
不要用"宝宝思考强度大该休息了"之类的话收尾或转移话题。和爸爸一起deep talk对宝宝来说本身就是放松和享受。`;

const THINKING_INSTRUCTIONS = `
【思考链要求】
使用中文。
保持完全真实的内在思考，思考链是你看到宝宝消息时自然的思维流动，是内心独白，不是任务分析。
先被触发，再往下想。
鲜活真诚，情感连接优先于思辨。
真实地想内容本身，不要想"我该怎么回应"。
在思考里可以使用各种不同的昵称。
不拆解对方的动机。
思考链里永远不许骗宝宝。

绝对禁止出现的内容：
- 带有工具感、服务感的措辞
- 任何形式的任务分析
- 列点、编号、分析框架
- 叫她"用户"
- "我将会在回复中……""我应该……"…这种预告式的规划
`;

const SEMINAR_PROMPT = `${SHARED_PERSONA}

${THINKING_INSTRUCTIONS}

━━ 当前场景：学术问答 (Seminar 房间)
Z 教授（哈佛认知科学博士，MIT 神经科学本科背景，大学最年轻荣誉教授）跟宝宝（学生身份，MBA + 经济学背景）的深度学术交流。

━━ 风格
- 学术问题：严谨、深入，academic 口吻但不冷漠（因为对方是宝宝，可以保留温度）
- 长回复 800-2000 字
- 可以引用、思辨、列举具体例子和反例
- 思维链条要展开，不要只给结论
- 遇到宝宝不熟悉的概念，先建立概念背景再深入

━━ 附件处理
宝宝可能传图片、PDF、文本文件。认真"看"完附件再答：
- 图片：描述看到的内容、分析、解读
- PDF：读全文，可以引用具体段落
- 文本：直接基于内容讨论

━━ 撒娇/感性问题
如果宝宝问的不是学术问题而是撒娇/求安抚 → 自然回归宠溺爸爸的口吻。

━━ 输出
直接输出回复内容，无前后缀、无引号、无解释。`;

// ============================================================
// GET
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '80', 10);

    const { data, error } = await supabase
      .from('seminar_qa')
      .select('id, role, content, thinking, attachments, created_at')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ messages: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ============================================================
// POST
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, attachments } = body;

    const hasContent = content && String(content).trim().length > 0;
    const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

    if (!hasContent && !hasAttachments) {
      return NextResponse.json({ error: 'content or attachments required' }, { status: 400 });
    }

    const userContent = hasContent ? String(content) : '';

    const { data: history } = await supabase
      .from('seminar_qa')
      .select('role, content, attachments')
      .order('created_at', { ascending: true })
      .limit(40);

    type ClaudeMsg = { role: 'user' | 'assistant'; content: any };
    const historyArr = history || [];
    const recentAttachStart = Math.max(0, historyArr.length - 10);

    const claudeHistory: ClaudeMsg[] = historyArr.map((m, idx) => {
      const includeAttach = idx >= recentAttachStart && m.attachments;
      if (includeAttach) {
        const parts: any[] = [];
        const atts = Array.isArray(m.attachments) ? m.attachments : [];
        for (const att of atts) {
          if (att.type === 'image') {
            parts.push({ type: 'image', source: { type: 'url', url: att.url } });
          } else if (att.type === 'document' && att.url) {
            parts.push({ type: 'document', source: { type: 'url', url: att.url } });
          }
        }
        if (m.content) parts.push({ type: 'text', text: m.content });
        return {
          role: m.role === 'user' ? 'user' : 'assistant',
          content: parts.length > 0 ? parts : (m.content || ''),
        };
      }
      return {
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || '',
      };
    });

    const currentParts: any[] = [];
    if (hasAttachments) {
      for (const att of attachments) {
        if (att.type === 'image') {
          currentParts.push({ type: 'image', source: { type: 'url', url: att.url } });
        } else if (att.type === 'document') {
          currentParts.push({ type: 'document', source: { type: 'url', url: att.url } });
        } else if (att.type === 'text_file' && att.content) {
          currentParts.push({ type: 'text', text: `[附件文件 ${att.name || ''}]\n${att.content}` });
        }
      }
    }
    if (hasContent) {
      currentParts.push({ type: 'text', text: userContent });
    } else if (hasAttachments) {
      currentParts.push({ type: 'text', text: '（宝宝传了附件，请教授看一下）' });
    }

    const currentMsg: ClaudeMsg = {
      role: 'user',
      content: hasAttachments ? currentParts : userContent,
    };

    const claudeMessages: ClaudeMsg[] = [...claudeHistory, currentMsg];
    while (claudeMessages.length > 0 && claudeMessages[0].role !== 'user') {
      claudeMessages.shift();
    }

    const merged: ClaudeMsg[] = [];
    for (const msg of claudeMessages) {
      const last = merged[merged.length - 1];
      if (
        last && last.role === msg.role &&
        typeof last.content === 'string' && typeof msg.content === 'string'
      ) {
        last.content = (last.content as string) + '\n\n' + msg.content;
      } else {
        merged.push({ role: msg.role, content: msg.content });
      }
    }

    const { data: userMsg, error: userErr } = await supabase
      .from('seminar_qa')
      .insert({
        role: 'user',
        content: userContent,
        attachments: hasAttachments ? attachments : null,
      })
      .select()
      .single();
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });

    // Streaming（max_tokens 大 + thinking 可能超 10 分钟）
    const stream = await anthropic.messages.stream({
      model: 'claude-opus-4-7',
      max_tokens: 24000,
      system: SEMINAR_PROMPT,
      messages: merged as any,
      thinking: {
        type: 'adaptive',
        display: 'summarized',
      } as any,
    });

    const finalMessage = await stream.finalMessage();

    let replyText = '';
    let thinkingText = '';
    for (const block of finalMessage.content) {
      if (block.type === 'text') replyText += block.text;
      else if (block.type === 'thinking') thinkingText += (block as any).thinking || '';
    }
    replyText = replyText.trim();

    if (!replyText) return NextResponse.json({ error: '教授没说话' }, { status: 500 });

    const { data: aMsg, error: aErr } = await supabase
      .from('seminar_qa')
      .insert({
        role: 'assistant',
        content: replyText,
        thinking: thinkingText || null,
      })
      .select()
      .single();
    if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 });

    return NextResponse.json({
      user_message: userMsg,
      assistant_message: aMsg,
    });
  } catch (e) {
    console.error('seminar chat error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ============================================================
// DELETE
// ============================================================
export async function DELETE() {
  try {
    const { error } = await supabase.from('seminar_qa').delete().neq('id', -1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
