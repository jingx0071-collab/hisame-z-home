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

const TITLE_PROMPT = `根据下面这场调教 session 的对话，给它起一个 5-12 个中文字的标题。

要求：
- 5-12 个中文字
- 体现这场 session 的核心 theme（惩罚/训练/玩具/某个特定 kink/特定 scene）
- 暧昧 + 直接，可以露骨但不要油腻
- 不要"关于 XX"、"宝宝的 XX"这种结构
- 不要带标点
- 直接输出标题

参考语气（不要照抄内容）：
- 早晨醒来的训练
- 项圈和按摩棒
- 学着被踩
- 喷奶第十次
- 没规矩的小骚货
- 浴缸里的调教
- 操到坏掉的午后
- 玉兰之前那段

直接输出标题：`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id required' }, { status: 400 });
    }

    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('mode', 'training')
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

    const { error } = await supabase
      .from('training_sessions')
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
