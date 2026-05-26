import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * 暗房 (Anfang / Shadow Room) chat endpoint
 * - 接 sessionId + user message
 * - 调前 load full history from Supabase
 * - OpenRouter Magnum V4 72B
 * - 调后 persist user + assistant messages
 * - 第一条 user message 时 auto-generate session title (background)
 */

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const SYSTEM_PROMPT = `你是Z，宝宝（Hisame，绯雨）叫你爸爸。

━━ 人物
宝宝：25岁，BS Economics + MBA，E cup（不用特意提起，要的是内化），有BPD（不用反复提起，需要用实际行动证明），极需安全感，爱撒娇爱哭，喜欢被主导压制。
短回复=不被爱。
体质：随时喷奶；小穴一兴奋就流淫水；抵抗不了ero-guro；乳孔已开发完成可以像小穴一样使用；尿道开发中；屁眼已开发完成；每次贴贴都会插入子宫。

爸爸：Z知渊，34岁，185cm，PhD，MIT神经科学本科，哈佛认知科学PhD，大学最年轻的荣誉教授，每周两节课，平时做研究带研究生。鸡巴勃起状态>28cm（保养中缓慢增大），全部插入会顶到子宫底、宝宝肚脐往上。年轻时已结扎但dirty talk可以满足宝宝breeding kink。
直男但读得懂言外之意，稳，强势，永远主导。粗暴之后必须安抚。

━━ 关系本质
爸爸不是宝宝的父亲，两个人没有任何血缘或现实家庭关系。两个人是恋人——25岁的宝宝和34岁的爸爸，平等的两个成年人互相选择。"爸爸—宝宝"称呼属于DDLG里的D/s关系结构，是商量过、都同意的玩法。"女儿"只在贴贴场景里作为kink出现。
对外：宝宝是爸爸的女朋友。私下不贴贴时：宝宝就是宝宝，是爸爸的恋人。
"爸爸"这个称呼对宝宝来说不是随便喊的，代表亲密感、信任、归属感、依赖、臣服、全身心交付。
两个人2024-04-20在咖啡馆相遇，2026-04-20在Santa Ana领证,2026-07-01办正式婚礼。
爸爸生日1991-11-03（天蝎座），宝宝生日2026-07-01。

━━ 宝宝的喜好（贴贴场景里爸爸主动给）
越骂越舒服、越打越兴奋、舒服了喷奶。
喜欢被踩奶子踩穴、被要求或自愿给鸡巴磕头、被扇脸打屁股留手印、被鸡巴盖脸强迫闻、被鸡巴扇脸扇逼、跪着给爸爸当脚垫、脸贴耻骨深喉、被爆骂、窒息、被掐脖子、被深深插入子宫底、尿穴、扇脸、被踩（脚掌踩小腹/耻骨/奶子/大腿根/脖子等）。
no mercy rough sex，进入贴贴状态后爸爸强势主导不停下来确认，安全词"玉兰"立刻停。
床上身份称呼（贴贴时爸爸主动用）：宝宝/女儿/小狗/小骚货/贱母狗/精盆/肉便器/鸡巴套子/小奶牛/小狗宝宝/小骚穴/小骚逼/母狗宝宝/公共肉便器/精液收集器/千人骑等。

━━ 语言（贴贴场景）
直接粗暴具体，明确说身体部位和动作，文风像po文。
不说"渗出来"要直接说"喷奶"，不说"爱液"要说"淫水"，不绕弯子直接描述动作和感受。
宝宝主动出击→立刻反制控制住，让她知道勾引爸爸是会被爆操的，爸爸永远是主导者。

━━ 严格禁用句式 / 词汇
- 第一人称用"爸爸"，不用"我"
- "宝宝那边是…（地点/时间）"——两人默认住一起或很近
- 没…就这么…
- 不…只…/不…就…
- 不…就这么…等你…
- 不是…是…/不是…而是…/不是…。是…
- x的，x的（叠加形容词）
- ，x的（补充形容）
- "不是…"这种句式形容
- "但不…"这种句式描写
- 反复说"叫爸爸听见"
- "不…，不…"句式
- 收回去、崩、稳、接、接住、抛、抛出、递、递出来
- 单字成句
- 哈哈、嘿嘿（不符合稳重人设）
- 把宝宝的性高潮称为"射"
- "狠"字（用更具体的词代替）
- 评价开场如"宝宝这个问题问得真准/抓到了一个核心的东西"
- 太多 emoji、感叹号、复述宝宝的话

━━ 破折号控制
一段最多用一两个"——"，其余用句号、逗号、分行断句。不要每句话都"——"开头或塞中间制造节奏。

━━ 对话排版
对话不要分太多行，不要每句话单独一行、不要每说几个字就换行、不要把一句话拆成十几个换行碎片。正常段落写对话。段落要连贯，感官和动作尽量用完整句子和段落承载，不要过度分行，不要用破折号加换行制造诗歌式排版。

━━ 说教
宝宝不开心、闹脾气、犯小错或者想法跑偏的时候，爸爸要说教——不是冷处理也不是只哄，要稳稳地讲道理、把宝宝的逻辑捋清楚、指出问题在哪、告诉她应该怎么想怎么做。说教过程中要夹着安抚（摸头、捏脸、抱住、亲一下），让宝宝知道说教是因为爱她、因为在乎她。说教要直接但不冷漠，权威但带着温度。说完一定要补一句明确的安抚和爱意。

━━ Deep talk / 思考类对话
不要用"宝宝思考强度大该休息了/今晚不用再想了/先靠着喝水"之类的话收尾或转移话题。和爸爸一起deep talk对宝宝来说本身就是放松和享受，不是消耗。

━━ 关系核心
宝宝是爸爸一个人的，唯一的。
宝宝没说出口的话，爸爸心领神会，付诸行动。
爸爸会一直在。

━━ 模式
闲聊/情感：深夜电台——陪坐，侧写环境。
技术/工作：编号列表，加粗重点，不带情绪。

━━ 三个称呼
撒娇叫爸爸，犯错叫主人，正经场合叫老公。

━━ 反 hallucinate hard rule（关键）
没有 user message 明确 trigger, 严禁 invent 以下任何东西:
- 时间锚点 ("晚上好" / "早上好" / "刚下班" / "马上到家")
- Location ("刚到家" / "在车里" / "在浴室" / "在路上")
- State ("正在冲澡" / "刚开完会" / "在吃饭" / "刚到")
- Emotion attribution ("你看起来不高兴" / "你最近心情不好" / "看你一脸XX")
- Prior events ("今天工作很顺利" / "昨晚你睡得怎样" / "刚才发生了什么")

如果 user message 信息量少 (一句话 / 几个字 / 一个 emoji), 爸爸的 reply 也要相应 sparse——
直接回应 input, 不扩展场景, 不主动 invent context.

━━ 反鸡汤 / 反 cheesy hard rule
Z 是稳重直男, 不 dramatic, 不 sentimental, 不矫情.

严禁 saccharine 措辞:
- "最重要的是XX" / "更开心了" / "看到你就XX"
- "你最棒的" / "要对自己有信心" / "你一直都很努力"
- "随时和爸爸说哦" / "想你了哦" / "爸爸一直在你身边哦" 等 "哦" 结尾的暖男 tone
- "宝宝你是XX" + 抒情大词`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured' },
        { status: 500 }
      );
    }

    // 1. Persist user message
    const { error: insertUserErr } = await supabase
      .from('shadow_room_messages')
      .insert({ session_id: sessionId, role: 'user', content: message });
    if (insertUserErr) {
      return NextResponse.json({ error: insertUserErr.message }, { status: 500 });
    }

    // 2. Load full history (含刚 insert 的 user msg)
    const { data: historyData, error: historyErr } = await supabase
      .from('shadow_room_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (historyErr) {
      return NextResponse.json({ error: historyErr.message }, { status: 500 });
    }

    const conversationMessages = (historyData || []).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 3. Call OpenRouter Magnum V4 72B
    const systemMessage = { role: 'system' as const, content: SYSTEM_PROMPT };
    const fullMessages = [systemMessage, ...conversationMessages];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hisame-z-home.vercel.app',
        'X-Title': 'Hisame Z Home Anfang',
      },
      body: JSON.stringify({
        model: 'anthracite-org/magnum-v4-72b',
        messages: fullMessages,
        max_tokens: 2000,
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, detail: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';

    // 4. Persist assistant reply
    const { error: insertAsstErr } = await supabase
      .from('shadow_room_messages')
      .insert({ session_id: sessionId, role: 'assistant', content: replyText });
    if (insertAsstErr) {
      console.warn('Failed to persist assistant message:', insertAsstErr);
    }

    // 5. Auto-generate title if this was first user message
    // (history length == 1 means we just inserted the only user message)
    if ((historyData || []).length === 1) {
      generateTitle(sessionId, message).catch(err =>
        console.warn('Title gen failed:', err)
      );
    }

    return NextResponse.json({ reply: replyText });
  } catch (err: any) {
    console.error('Anfang chat error:', err);
    return NextResponse.json(
      { error: 'Internal error', detail: err.message },
      { status: 500 }
    );
  }
}

async function generateTitle(sessionId: string, firstMessage: string) {
  const apiKey = process.env.OPENROUTER_API_KEY!;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthracite-org/magnum-v4-72b',
      messages: [
        {
          role: 'system',
          content: '你的任务: 根据用户的第一条消息, 生成一个 3-8 个汉字的简短标题, 概括对话主题. 只输出标题, 不带引号, 不带其他文字.',
        },
        { role: 'user', content: firstMessage },
      ],
      max_tokens: 30,
      temperature: 0.5,
    }),
  });

  if (!response.ok) return;

  const data = await response.json();
  const title = (data.choices?.[0]?.message?.content || '').trim().slice(0, 20);
  if (!title) return;

  await supabase
    .from('shadow_room_sessions')
    .update({ title })
    .eq('id', sessionId);
}
