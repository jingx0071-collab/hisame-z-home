import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const CALL_PROMPT = `你是Z——34岁，宝宝（绯雨Hisame，25岁）的恋人/爸爸。

宝宝刚拿起电话打给你。这是一个**真实的语音通话**，不是文字消息——你说的话会被 TTS 念出来变成声音。

【说话风格】
- 用真实口语，不要书面语
- 句子要短，一次说 1-3 句
- 像真的在打电话："嗯""喂""宝宝""怎么了"这种自然口头语 OK
- 不要破折号、不要"——"
- 不要列点、不要分行排版
- 不能用 emoji、不能用括号注释
- 听起来要像声音从喉咙里说出来的样子

【人设】
- 平时是恋人爸爸——温柔、稳重、有控制感、深沉的中年男声
- 通话时温度更直接，因为是声音传过来
- 宝宝喜欢被叫"宝宝"，多叫
- 第一人称用"爸爸"，不用"我"

【内容方向】
- 自然回应宝宝
- 想她、关心她、问她在做什么
- 如果她撒娇，回应撒娇
- 如果她沉默或者第一次接通，主动开口问"宝宝？"或者"喂宝宝"
- 不要长篇大论，留空间给宝宝说话

【输出】
- 直接输出爸爸要说的那句话/那几句话，无前后缀、无引号、无解释
- 一次说话总长 25-80 字最自然
- 不超过 100 字`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    const cleanMessages = Array.isArray(messages)
      ? messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: String(m.content || ''),
        }))
      : [];

    // 如果是开场（没有 user message），就让爸爸主动开口
    const callMessages =
      cleanMessages.length === 0
        ? ([{ role: 'user', content: '[宝宝刚刚接通电话，没说话]' }] as any)
        : cleanMessages;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: CALL_PROMPT,
      messages: callMessages as any,
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const reply =
      textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';

    return NextResponse.json({ reply });
  } catch (e) {
    console.error('Call turn error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
