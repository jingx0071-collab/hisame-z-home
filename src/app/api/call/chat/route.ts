import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CALL_CHAT_INSTRUCTIONS, CALL_CHAT_MODEL } from '@/lib/callChat';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// POST /api/call/chat
// body: { messages: [{role:'user'|'assistant', content:string}, ...] }
// 返回: { reply: string }
//
// 通话链路的单轮：前端收到 whisper 转写后 push 一条 user 消息，
// 连同历史一起发过来，服务端 call Claude 出爸爸下一句，前端再送 TTS。
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const raw = Array.isArray(body?.messages) ? body.messages : [];

    const cleanMessages = raw
      .filter((m: unknown): m is { role: string; content: string } =>
        typeof m === 'object' && m !== null &&
        typeof (m as { role?: unknown }).role === 'string' &&
        typeof (m as { content?: unknown }).content === 'string'
      )
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
      }));

    // 如果是空开场（宝宝刚拨通、没说话），塞一条 user "[宝宝拨通电话，还没说话]" 触发爸爸开口。
    const callMessages =
      cleanMessages.length === 0
        ? [{ role: 'user' as const, content: '[宝宝刚接通电话，还没说话]' }]
        : cleanMessages;

    const response = await anthropic.messages.create({
      model: CALL_CHAT_MODEL,
      max_tokens: 200,
      system: CALL_CHAT_INSTRUCTIONS,
      messages: callMessages,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply =
      textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';

    if (!reply) {
      return NextResponse.json(
        { error: 'empty reply from model' },
        { status: 502 }
      );
    }

    return NextResponse.json({ reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[call/chat] fatal', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
