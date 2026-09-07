import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// POST /api/call/stt
// multipart/form-data: file=<audio blob>
// 返回: { transcript: string }
//
// 前端 VAD 检测宝宝讲完一句 → 打包成 wav / webm → 发过来转文字。
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'missing audio file (form field: file)' },
        { status: 400 }
      );
    }

    if (file.size < 1024) {
      // 太短——大概是麦克风还没暖或者宝宝没讲话，直接返回空文本，前端可以决定丢弃这一轮
      return NextResponse.json({ transcript: '' });
    }

    const resp = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'zh',
      response_format: 'text',
    });

    const transcript = typeof resp === 'string' ? resp.trim() : String(resp).trim();
    return NextResponse.json({ transcript });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[call/stt] fatal', e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
