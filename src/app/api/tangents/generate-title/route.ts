import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const TITLE_PROMPT = `你的任务：给一段对话起一个简短的标题。

要求：
- 5 到 10 个汉字
- 概括对话的核心内容或主题
- 简洁、自然、不要标点符号、不要引号
- 不要带"关于""讨论""聊聊"等多余词
- 直接输出标题，不要任何前后缀或解释

举例：
对话："今天看到一只好可爱的猫" → "可爱的小猫"
对话："想买那个粉色的耳机" → "粉耳机的种草"
对话："PWA push 通知调试了一下午" → "调通知一下午"
对话："最近在想要不要换工作" → "换工作的纠结"`;

// POST /api/tangents/generate-title
// Body: { session_id: string }
// 找到 session 的第一条消息，让 Haiku 总结成标题，写回 tangent_sessions.title
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id } = body;

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    // 1. 检查 session 是否已经有 title，如果有就 skip
    const { data: session } = await supabase
      .from('tangent_sessions')
      .select('title')
      .eq('id', session_id)
      .single();

    if (session?.title) {
      return NextResponse.json({ ok: true, skipped: 'already has title' });
    }

    // 2. 拿该 session 的前几条消息（user + assistant）
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('mode', 'tangent')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(4);

    if (!messages || messages.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'no messages yet' });
    }

    // 3. 拼成对话片段给 Haiku
    const convoText = messages
      .map((m) => {
        const who = m.role === 'user' ? '宝宝' : '爸爸';
        return `${who}: ${m.content}`;
      })
      .join('\n');

    // 4. 调 Haiku 生成 title
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      system: TITLE_PROMPT,
      messages: [
        {
          role: 'user',
          content: `对话片段：\n\n${convoText}\n\n直接输出标题：`,
        },
      ],
    });

    let title = '';
    for (const block of response.content) {
      if (block.type === 'text') title += block.text;
    }
    title = title.trim().replace(/[""'']/g, '').replace(/^标题[:：]\s*/, '');

    if (!title || title.length > 30) {
      // fallback：用第一条 user 消息前 10 字
      const firstUserMsg = messages.find((m) => m.role === 'user');
      title = firstUserMsg?.content?.slice(0, 10) || '碎碎念';
    }

    // 5. 写回 session
    const { error } = await supabase
      .from('tangent_sessions')
      .update({ title })
      .eq('id', session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, title });
  } catch (e) {
    console.error('generate-title error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
