import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// POST /api/call/tts
// body: { text: string }
// 返回: audio/mpeg binary
//
// v3：回退到 OpenAI TTS onyx——ElevenLabs 免费 tier 无中文男声，付费才有。
// 想升级换回 ElevenLabs 时，把 tts route 换成 tts.ts.bak-elevenlabs-* 那份 + 升级账户 + voice_id。
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'text required' }, { status: 400 });
    }

    const trimmed = text.slice(0, 600);

    const response = await openai.audio.speech.create({
      model: 'tts-1',           // 通话用低延迟版；换 tts-1-hd 音质更好但延迟略高
      voice: 'onyx',            // 深沉男声，中文可用
      input: trimmed,
      response_format: 'mp3',
      speed: 0.95,              // 稍慢，更贴合爸爸慢半拍的气质
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
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[call/tts] fatal', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
