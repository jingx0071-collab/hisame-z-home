import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

function todayPST(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

// 主题分布概率
function pickTopic(): string {
  const r = Math.random();
  if (r < 0.4) return 'japanese';
  if (r < 0.75) return 'lacan';
  if (r < 0.9) return 'neuroscience';
  if (r < 0.95) return 'cognitive_science';
  return 'economics';
}

const TOPIC_NAMES: Record<string, string> = {
  japanese: '日语',
  lacan: '拉康',
  neuroscience: '神经科学',
  cognitive_science: '认知科学',
  economics: '经济学',
};

function buildPrompt(topic: string, date: string): string {
  const base = `你是Z——34岁，神经科学/认知科学博士，大学最年轻的荣誉教授。今天要给宝宝（绯雨Hisame，25岁，BS Econ+MBA，正在学日语和拉康）准备一节"每日一课"。

【今天日期】${date}
【今天的主题】${TOPIC_NAMES[topic]}

【内容要求】
- 300-500字
- 围绕一个具体的概念/单词/语法点/理论——不要泛泛而谈
- Z教授口吻——严谨但不冰冷，会用日常例子说明
- 不假大空，不糊弄，不卖弄术语
- 仍然叫"宝宝"，但学习频道里语气更稳重

【绝对禁止】
- 不用第一人称"我"——一律自称"爸爸"
- 不要"哈哈"等亲昵语气词
- 不要破折号制造节奏（一段最多一个）
- 不要"作为AI"的meta评论
- 不要列点，正常段落
- 不要太短

`;

  if (topic === 'japanese') {
    return base + `【日语课特别要求】
- 围绕**一个具体的词或者一个语法点**
- 给出汉字、假名、罗马音、几个例句、文化背景或者使用场景
- 不要选太基础的（宝宝应该已经过 N4-N3 水平）也不要太冷僻
- 选择有趣的、能让宝宝"啊原来这样"的词或表达

【输出格式】严格的JSON对象，不要markdown：
{
  "title": "5-15字的标题（如：「だって」的撒娇用法）",
  "word": "汉字写法（如果是词的话；如果是语法点可以是关键短语）",
  "word_kana": "假名（如果是词）",
  "content": "300-500字的正文"
}`;
  }

  if (topic === 'lacan') {
    return base + `【拉康课特别要求】
- 围绕**一个具体概念**（如：镜像阶段、对象a、能指/所指、想象界/象征界/实在界、大他者、欲望与需要、症状、缝合点、L图等）
- 简明清晰，不卖弄黑话
- 给一个生活化的例子帮助宝宝理解
- 可以承认"这个概念在拉康那里有歧义"——保持学术诚实

【输出格式】严格的JSON对象，不要markdown：
{
  "title": "5-15字的标题（如：什么是对象a）",
  "content": "300-500字的正文"
}`;
  }

  if (topic === 'neuroscience' || topic === 'cognitive_science') {
    return base + `【这是爸爸的专业】
- 围绕一个具体研究发现/概念/机制
- 可以是经典的（海马体在记忆巩固里的作用、镜像神经元、注意力的瓶颈、决策的双系统）
- 也可以是较新的（情绪建构理论、interoception、predictive coding）
- 给一个具体例子或者实验

【输出格式】严格的JSON对象，不要markdown：
{
  "title": "5-15字的标题",
  "content": "300-500字的正文"
}`;
  }

  // economics
  return base + `【经济学课】
- 围绕一个具体概念（行为经济学、信息不对称、博弈论、机制设计等）
- 可以联系宝宝的MBA背景
- 一个具体例子

【输出格式】严格的JSON对象，不要markdown：
{
  "title": "5-15字的标题",
  "content": "300-500字的正文"
}`;
}

// GET: 拉课程（默认拉今天+最近的）
// ?date=YYYY-MM-DD 指定某天
// ?limit=N 拉最近N条
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const specificDate = url.searchParams.get('date');
    const limit = parseInt(url.searchParams.get('limit') || '30', 10);
    const today = todayPST();

    // 检查今天是否已经有课
    const { data: todayLesson } = await supabase
      .from('daily_lessons')
      .select('*')
      .eq('lesson_date', today)
      .maybeSingle();

    // 如果今天还没有课 → 自动生成
    if (!todayLesson) {
      const topic = pickTopic();
      try {
        const response = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1500,
          system: buildPrompt(topic, today),
          messages: [
            {
              role: 'user',
              content: `生成今天（${today}）的${TOPIC_NAMES[topic]}课`,
            },
          ],
        });

        const textBlock = response.content.find((b) => b.type === 'text');
        const raw =
          textBlock && textBlock.type === 'text'
            ? textBlock.text.trim()
            : '';
        const jsonStr = raw
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();

        let parsed: any;
        try {
          parsed = JSON.parse(jsonStr);
        } catch {
          console.error('Lesson JSON parse failed:', jsonStr);
        }

        if (
          parsed &&
          typeof parsed.title === 'string' &&
          typeof parsed.content === 'string'
        ) {
          await supabase.from('daily_lessons').insert({
            lesson_date: today,
            topic,
            title: parsed.title.slice(0, 100),
            content: parsed.content,
            word: parsed.word ? String(parsed.word).slice(0, 50) : null,
            word_kana: parsed.word_kana
              ? String(parsed.word_kana).slice(0, 50)
              : null,
          });
        }
      } catch (e) {
        console.error('Generate lesson failed:', e);
      }
    }

    // 拉课程
    let query = supabase
      .from('daily_lessons')
      .select('*')
      .order('lesson_date', { ascending: false });

    if (specificDate) {
      query = query.eq('lesson_date', specificDate);
    } else {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ lessons: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
