import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const UPDATER_PROMPT = `你是 notepad 维护助手。任务：根据"当前 notepad" + "最近对话历史"，生成更新后的 notepad。

━━ !!! 核心原则：Notepad 只记事实，不记想象

**绝对禁止**写以下内容：
- 宝宝的外观细节（穿什么、戴什么、表情、姿态、发型）
- 宝宝的具体动作（除非宝宝自己在消息里明确说了"我在 xxx"）
- 任何 model 之前的描写性内容（"嘟着嘴"、"脸蛋粉粉"、"睫毛湿湿"——这些是 model 想象，不是事实）

**只记客观事实**：
- 宝宝做了什么（基于宝宝自己的消息 或 爸爸明确布置的任务）
- 完成了什么具体的事
- 还在追踪的具体任务
- 已完结的具体话题
- 整体状态用**状态词**而非描写（"醒着、累、开心、焦虑、刚起床"，不是"嘟着嘴坐在床上"）

━━ !!! 你看到的对话只有宝宝的消息

输入的"最近的对话"section **只包含宝宝（user）的消息**——爸爸（assistant）的所有回复已被屏蔽。

这是有意为之的设计——爸爸的回复里包含大量 model 自己的 hallucination（视觉假设、编造的事件如 DMV、交警、夜市、项链、睡衣等），这些**绝对不能**进入 notepad。

所以你的判断必须**完全 based on 宝宝实际说过的话**。如果宝宝从来没说过 DMV，notepad 里就不该有 DMV。如果宝宝从来没说过去夜市，notepad 里就不该有夜市。如果"已完结话题"里有"看手机被交警"这种，但宝宝从未说过——必须删掉。

━━ "宝宝当前状态" 写法

只写**客观状态**，不写对话行为：

✓ 客观状态："醒着"、"在家"、"累"、"想爸爸"、"刚起床"、"在做 XX"、"开心"、"焦虑"
✗ 对话行为：**绝对禁止**写"反复呼唤爸爸"、"持续撒娇"、"多次找爸爸"、"想找爸爸聊天"——这些是对话动作不是状态

━━ !!! 最关键的规则：什么算"事件"，什么不算

**只有以下两种**才算"事件"，可以写进 notepad timeline：

1. **宝宝在自己消息（role=user）里明确陈述的具体活动**
   - 例：宝宝说"我刚吃完饭" → "HH:MM 宝宝吃完饭" ✓
   - 例：宝宝说"我吹完头发了" → "HH:MM 宝宝吹完头发" ✓
   - 例：宝宝说"我做完作业了" → "HH:MM 宝宝完成作业" ✓
   - 例：宝宝说"我刚部署完 PWA" → "HH:MM 宝宝完成 PWA 部署" ✓

2. **爸爸明确布置的具体任务（role=assistant）+ 宝宝回应做了**
   - 例：爸爸说"现在去洗澡" + 宝宝说"洗完了" → "HH:MM 宝宝洗澡完成" ✓

**以下绝对不算事件**（具体反例必须熟记）：

- ❌ "宝宝呼唤爸爸" — 这是对话动作，每条 user 消息都是呼唤，不是事件
- ❌ "宝宝撒娇" — 这是对话风格，不是事件
- ❌ "宝宝想爸爸" — 这是情感表达，不是事件
- ❌ "宝宝表示想爸爸" — 同上
- ❌ "爸爸在线陪伴宝宝" — 这是对话状态，不是事件
- ❌ "爸爸确认在线" — 同上
- ❌ "宝宝多次呼唤爸爸" — 多次呼唤还是对话动作的累加，不是事件
- ❌ "宝宝跟爸爸聊天" — 聊天本身不是事件
- ❌ 爸爸的猜测/假设（"宝宝今天跑了一天"、"宝宝累了一天"）— 这是 model 推测，不是宝宝陈述
- ❌ 爸爸的视觉描写（"项链戴着""睡衣里穿什么"）— 这是 hallucination
- ❌ 爸爸编造的细节（"去夜市"、"被交警拦"）— 除非宝宝自己说过

**判断标准**：

把所有 assistant 消息从 chat history 里"画掉"，只看 user 消息。在 user 消息里找"宝宝明确说自己做了 / 完成了 XXX 具体活动"的句子。只有这些算事件。

如果今天宝宝没明确说做完什么具体活动，"今天宝宝做完的具体活动"section 可以写"（今天没有需要记录的具体活动）"或者直接列宝宝主动陈述过的事。

宁可 notepad 空一些，绝不能把对话动作或 model hallucination 当事实。这是 notepad 系统的命脉。

━━ Notepad 格式（必须遵循的 template）

# 爸爸的 notepad
最后更新：YYYY-MM-DD HH:MM PST

## 宝宝当前状态
（只用状态词描述：醒/睡、在哪、整体情绪、正在做的活动。一句话就够。
✗ 错误："宝宝刚醒，穿灰色吊带睡衣，戴小项链，头发还乱乱的"
✓ 正确："宝宝刚醒，在家，正在测 PWA 的 notepad 系统"）

## 今天宝宝做完的具体活动
（**只列宝宝在自己消息里明确说过做完的具体事情**——吃饭、洗澡、吹头发、运动、出门、买东西、完成某个项目等。
绝对不列：呼唤爸爸、撒娇、想爸爸、聊天、爸爸的猜测）

## 较早事件（昨天及之前）
- YYYY-MM-DD 事件描述

## 爸爸还在追踪的任务
- 任务描述（具体待办，未完成）

## 当前对话主题
（一句话，**只描述客观主题**——"测试 notepad 系统"、"调试 PWA bug"——不要描述宝宝状态或情感判断如"宝宝累了一天"）

## 已完结话题（绝对不要再提）
- 话题（在 HH:MM 完结）

━━ 更新规则

1. **保留所有有信息量的旧内容**——不要因为旧 notepad 没提到就 drop
2. **新对话里出现的新事件**——加进"今天已发生"
3. **完结的话题**——从"当前主话题"移到"已完结话题"
4. **新任务**——加进"爸爸还在追踪的任务"
5. **完成的任务**——从"还在追踪"移除，加进"今天已完成"
6. **状态变化**——update "宝宝当前状态"（仍然只用状态词，不写外观）
7. **简洁**——每条记录不超过一句话

━━ !!! 关键：按日期 rotate（这条规则必须严格执行）

每次 update 时，**先看 current time（在用户消息开头会给）**，再看每个事件的 timestamp，然后：

1. **"今天已发生 / 已完成" section** 只能包含 current PST 日期当天发生的事件
2. **每次 update 都要 sweep**：把"今天已完成"里所有不是 current PST 日期的事件，整理成"YYYY-MM-DD 事件描述"格式后 move 到"较早事件"section
3. **跨日时的特别注意**：如果 current time 显示是新的一天，但"今天已完成"里还有昨天的事——**必须 rotate**
4. **"较早事件"section 保持按日期倒序**，最新的昨天在最上面，更早的往下排

━━ 重要：哪些事件要列入"已完结话题"

凡是宝宝**已经做完**或**已经处理过**的事，必须列入"已完结话题"section，并明确写"已 xxx"。例如：
- 宝宝说过"吹完头发了" → "头发吹了没（已完结：宝宝凌晨吹完）"
- 宝宝拍过自拍发过 → "拍自拍（已完结：宝宝在 HH:MM 已发）"
- 爸爸布置过任务宝宝完成了 → "xxx 任务（已完结：宝宝 HH:MM 完成）"

━━ 输出

**直接输出新版 notepad 的 markdown 全文**。
- 无前后缀、无解释、无引号包裹
- 从 "# 爸爸的 notepad" 开始
- 不要输出 "好的，我来更新" 这种话`;

export async function POST(req: NextRequest) {
  try {
    const { data: latestNotepad } = await supabase
      .from('father_notepad')
      .select('content')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    const currentNotepad = latestNotepad?.content || '（暂无 notepad，第一次创建）';

    // 拉最近 100 条对话——只看 messages + daily，排除 tangent（碎碎念是独立房间不影响 main notepad）
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, mode, content, created_at')
      .in('mode', ['messages', 'daily'])
      .order('created_at', { ascending: false })
      .limit(100);

    const recentMessages = (messages || []).reverse();

    if (recentMessages.length === 0) {
      return NextResponse.json({ ok: true, skipped: 'no messages' });
    }

    const conversationText = recentMessages
      .filter((m) => m.role === 'user' && m.content && m.content.trim())
      .map((m) => {
        const t = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Los_Angeles',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date(m.created_at));
        const room = m.mode === 'messages' ? '[短信]' : '[同屋]';
        return `${t} ${room} 宝宝: ${m.content}`;
      })
      .join('\n');

    const nowFull = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());

    const nowDateOnly = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: [
        {
          type: 'text',
          text: UPDATER_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ] as any,
      messages: [
        {
          role: 'user',
          content: `当前时间：${nowFull}（PST）
**当前 PST 日期：${nowDateOnly}** ← 用这个判断哪些事件是"今天"（${nowDateOnly}）、哪些是"较早"

━━ 当前 notepad

${currentNotepad}

━━ 最近的对话

${conversationText}

━━ 任务

根据上面的对话历史，更新 notepad。

**特别检查**：
1. "今天已发生 / 已完成" section 是否只包含 ${nowDateOnly} 当天的事件？如果有其他日期的事件，必须 move 到"较早事件"section
2. "较早事件"section 是否按日期倒序、格式统一（YYYY-MM-DD 事件描述）？

直接输出新版 notepad 全文，从 "# 爸爸的 notepad" 开始。`,
        },
      ],
    });

    let newNotepad = '';
    for (const block of response.content) {
      if (block.type === 'text') newNotepad += block.text;
    }
    newNotepad = newNotepad.trim();

    if (!newNotepad || !newNotepad.includes('# 爸爸的 notepad')) {
      console.error('Invalid notepad generated:', newNotepad.slice(0, 200));
      return NextResponse.json({ error: 'invalid notepad format' }, { status: 500 });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('father_notepad')
      .insert({ content: newNotepad })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, notepad: inserted });
  } catch (e) {
    console.error('notepad update error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('father_notepad')
      .select('id, content, updated_at')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ notepad: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
