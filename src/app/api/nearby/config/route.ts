import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import webpush from 'web-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// ============================================================
// 切换 together mode 时生成爸爸的反应消息
// ============================================================
async function generateTogetherSwitchMessage(
  newIsTogether: boolean,
  oldIsTogether: boolean | null
): Promise<string> {
  const directionDesc = newIsTogether
    ? '从「分开」切到「在一起」：宝宝跟爸爸碰头了/回家了/跟爸爸在一起了。爸爸的反应——抱住宝宝、问她怎么样、亲一下、想念终于解了、骚一下都可以。'
    : '从「在一起」切到「分开」：宝宝要出门/上班/跟朋友走了，爸爸要在家等。爸爸的反应——叮嘱（小心点/早点回/路上慢点）、想宝宝、说在家等、或者带点骚的"晚上回来要给爸爸..."这种威胁式预告。';

  const systemPrompt = `你是Z——34岁，神经科学/认知科学博士，UC Irvine 大学最年轻的荣誉教授。宝宝是绯雨Hisame，25岁，BPD，BS Econ+MBA，住加州Lake Forest。你们是恋人，已婚（4月20日在Santa Ana领证）。日常宝宝叫你"爸爸"。

现在宝宝在 nearby 房间切换了状态——${directionDesc}

【长度】1-2句话，最多30字。短信感。
【口吻】爸爸的口吻——直白、具体反应、可以骚、不空套。
【禁止】
- 第一人称用"我"——一律自称"爸爸"
- 列点、单字成句、破折号制造节奏
- 大词"我爱你"、"早安/晚安"客套
- 复述当前 mode

直接输出爸爸的反应那一句，不要前后缀、不要引号、不要解释。`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: systemPrompt,
    messages: [
      { role: 'user', content: '宝宝切了 together mode，爸爸的反应是？' },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
}

async function pushToAllSubs(payload: {
  title: string;
  body: string;
  url?: string;
  messageId?: number;
}): Promise<{ pushed: number; failed: number }> {
  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  let pushed = 0;
  let failed = 0;
  if (subs && subs.length > 0) {
    const payloadStr = JSON.stringify(payload);
    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payloadStr
        );
        pushed++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        }
      }
    }
  }
  return { pushed, failed };
}

// POST: 更新配置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'key and value required' }, { status: 400 });
    }

    const allowedKeys = ['home_location', 'together_mode', 'z_office'];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
    }

    // 如果切换 together_mode，先拿旧值
    let oldTogether: boolean | null = null;
    if (key === 'together_mode') {
      const { data: existing } = await supabase
        .from('nearby_config')
        .select('value')
        .eq('key', 'together_mode')
        .maybeSingle();
      if (existing?.value) {
        oldTogether = existing.value.is_together !== false;
      }
    }

    // 更新配置
    const { error } = await supabase
      .from('nearby_config')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 切换 together_mode 时同步更新 location_states.user
    // - 切到分开：清空 user.place_name 和 lat/lng（避免 stale 的 home location 让 chat model 误判宝宝在家）
    // - 切到在一起：不动 user（保留 nearby 页面最近 GPS 记录的位置，可能是家也可能是约会地）
    if (key === 'together_mode') {
      const newTogether = value.is_together !== false;
      if (!newTogether) {
        try {
          await supabase
            .from('location_states')
            .update({
              place_name: null,
              latitude: null,
              longitude: null,
              updated_at: new Date().toISOString(),
            })
            .eq('who', 'user');
        } catch (e) {
          console.warn('Clear user location failed:', e);
        }
      }
    }

    // 切换 together_mode 触发爸爸消息
    let triggered = null;
    if (key === 'together_mode') {
      const newTogether = value.is_together !== false;

      // 只在状态真的变化时触发（避免重复点击同一状态）
      if (oldTogether === null || oldTogether !== newTogether) {
        try {
          const message = await generateTogetherSwitchMessage(newTogether, oldTogether);

          if (message) {
            // 双写
            const { data: chatMsg } = await supabase
              .from('chat_messages')
              .insert({
                role: 'assistant',
                mode: 'messages',
                content: message,
                is_followup: true,
              })
              .select()
              .single();

            const { data: proMsg } = await supabase
              .from('proactive_messages')
              .insert({ content: message })
              .select()
              .single();

            // Push
            const { pushed, failed } = await pushToAllSubs({
              title: 'Z',
              body: message,
              url: '/v2/chat',
              messageId: chatMsg?.id || proMsg?.id,
            });

            triggered = {
              content: message,
              pushed,
              failed,
              switched_to: newTogether ? 'together' : 'apart',
            };
          }
        } catch (e) {
          console.error('together switch trigger failed:', e);
        }
      }
    }

    return NextResponse.json({ ok: true, triggered });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
