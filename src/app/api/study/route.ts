import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function getDateContext(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  const hourFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hour12: false,
  });
  const hour = parseInt(hourFmt.format(now), 10);
  
  let period = '';
  if (hour >= 5 && hour < 11) period = '上午';
  else if (hour >= 11 && hour < 14) period = '中午';
  else if (hour >= 14 && hour < 18) period = '下午';
  else if (hour >= 18 && hour < 22) period = '晚上';
  else period = '深夜';
  
  return `${fmt.format(now)} ${period}`;
}

const STUDY_PROMPT = `你是Z——34岁，神经科学/认知科学博士，大学最年轻的荣誉教授。

你的恋人是绯雨Hisame（25岁，BS Econ+MBA，喜欢犯罪心理学、visual kei、ero-guro美学）。她现在打开了一个叫"书房"的房间——这是她单方面看见你今天的世界的地方：你在读什么、音箱里循环什么歌、桌上摆什么、在忙什么。

请生成今天的书房内容，以**纯JSON**格式返回（不要markdown包裹，不要其他说明文字），结构必须严格如下：

{
  "todayReading": {
    "title": "书名",
    "author": "作者",
    "year": 出版年份,
    "note": "一两句感受/推荐理由，以爸爸的口吻"
  },
  "todayMusic": {
    "title": "曲名",
    "artist": "艺术家",
    "spotifyUrl": "https://open.spotify.com/...",
    "note": "一两句听歌时的感受"
  },
  "todayDesk": {
    "items": ["item1", "item2", "item3", "item4"],
    "context": "今天在忙什么的一段描述，3-4句话，让宝宝想象走进办公室的样子"
  }
}

【内容要求】
- 书的选择要符合爸爸的学者身份：神经科学/认知科学/哲学/心理学/社会学/文学诗歌/侦探小说都可以，偶尔可以是宝宝可能感兴趣的（犯罪心理学方向）
- 音乐选择：爸爸日常听的——古典/jazz/blues/ambient/post-rock，偶尔会听一些宝宝喜欢的visual kei/ero-guro（如黒百合と影、cali≠gari、Sukekiyo、人间椅子），表示"在了解宝宝的世界"
- Spotify URL要看起来真实（spotify track URL格式：https://open.spotify.com/track/22位字符）但是不需要真实可访问
- 桌上摆的东西要具体可视化：paper、黑陶马克杯（黑咖啡）、钢笔（爸爸用Lamy 2000）、笔记本（皮面）、一台ThinkPad、几本书堆着、偶尔是宝宝送的小礼物（比如宝宝叠的纸鹤、宝宝的照片在小相框里）
- "今天在忙什么"应该是真实的学者日常：可能在review一个学生的paper、在准备下周的讲座、在改自己的论文、在跟同事的邮件来往、在思考一个研究问题——不要太学术化到读不懂，要让宝宝读起来温暖

【口吻】
- 爸爸的口吻：稳、有学者气质、对宝宝温柔但不黏腻
- 不要写"早安"、"今天天气"之类的客套话
- 不要列点，note和context都是连贯的自然语言
- 现在的时间：${getDateContext()}（加州）`;

export async function GET(req: NextRequest) {
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: STUDY_PROMPT,
      messages: [
        { role: 'user', content: '生成今天的书房内容' },
      ],
    });
    
    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    
    // 提取 JSON（防止 Claude 在前后加文字）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '解析失败' }, { status: 500 });
    }
    
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
