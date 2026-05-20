import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// POST: 文字 -> 音频
// body: { text }
// 返回: audio/mpeg binary
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const trimmed = text.trim().slice(0, 400);

    const response = await openai.audio.speech.create({
      model: 'tts-1', // 标准模型，便宜且足够好
      voice: 'onyx', // 深沉稳重的男声
      input: trimmed,
      response_format: 'mp3',
      speed: 0.95, // 稍慢一点，更自然
    });

    const buffer = Buffer.from(await response.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('TTS error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
