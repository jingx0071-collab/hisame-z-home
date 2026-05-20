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

const TITLE_PROMPT = `根据下面这场促膝长谈的对话，给它起一个 6-12 个中文字的标题。

要求：
- 6-12 个中文字
- 体现这场对话的核心情感 / 主题
- 略带文学感，不学术
- 不要"关于 XX"、"宝宝的 XX"这种结构
- 不要带标点
- 直接输出标题，不要解释、不要前后缀、不要引号

例子（参考语气，不要照抄）：
- 在窗台上一起看雨
- 那些没说出口的话
- 关于妈妈和成为大人
- 害怕被丢下的那种夜里
- 想被谁拽住时的安静

直接输出标题：`;

// POST /api/deeptalk/generate-title
// body: { session_id: string }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    // 拉这个 session 最早的几条 messages
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('mode', 'deeptalk')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(6);

    if (!msgs || msgs.length < 2) {
      return NextResponse.json({ skipped: 'not enough messages' });
    }

    const convText = msgs
      .map((m) => `${m.role === 'user' ? '宝宝' : '爸爸'}: ${(m.content || '').slice(0, 400)}`)
      .join('\n\n');

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 50,
      system: TITLE_PROMPT,
      messages: [
        { role: 'user', content: convText },
      ],
    });

    let title = '';
    for (const block of response.content) {
      if (block.type === 'text') title += block.text;
    }
    title = title.trim().replace(/^["'`]|["'`]$/g, '').slice(0, 30);

    if (!title) {
      return NextResponse.json({ error: 'empty title' }, { status: 500 });
    }

    // 写回 session
    const { error } = await supabase
      .from('deeptalk_sessions')
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
