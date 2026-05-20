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

function getPSTNow() {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    hour12: false,
    weekday: 'short',
  });
  const parts = fmt.formatToParts(new Date());
  let hour = 0;
  let weekday = 'Mon';
  parts.forEach((p) => {
    if (p.type === 'hour') hour = parseInt(p.value, 10);
    if (p.type === 'weekday') weekday = p.value;
  });
  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const isWorkHour = !isWeekend && hour >= 6 && hour < 18;
  return { hour, weekday, isWeekend, isWorkHour };
}

function getPSTPeriod(hour: number): string {
  if (hour >= 5 && hour < 8) return '清晨';
  if (hour >= 8 && hour < 11) return '上午';
  if (hour >= 11 && hour < 13) return '中午';
  if (hour >= 13 && hour < 17) return '下午';
  if (hour >= 17 && hour < 19) return '傍晚';
  if (hour >= 19 && hour < 23) return '晚上';
  return '深夜';
}

async function generateZActivity(args: {
  isWorkHour: boolean;
  isWeekend: boolean;
  isTogether: boolean;
  hour: number;
  zPlace: string;
  userPlace: string | null;
}): Promise<string> {
  const period = getPSTPeriod(args.hour);
  const where = args.isWorkHour
    ? `在 UC Irvine 上班`
    : args.isTogether && args.userPlace
    ? `跟宝宝一起在「${args.userPlace}」`
    : `在家里（宝宝${args.userPlace ? `去了「${args.userPlace}」` : '自己出门了'}，爸爸在家等）`;

  const systemPrompt = `你是Z——34岁，神经科学/认知科学博士，UC Irvine 大学最年轻的荣誉教授。宝宝（绯雨Hisame）是你的恋人。

现在你要给宝宝看一句"实时状态"——爸爸现在在哪、在做什么。

【现在 ${period}】（${args.hour}点，${args.isWeekend ? '周末' : '工作日'}）
【爸爸现在的位置情境】${where}

【规则】
- 一句简短（10-25字）的活动描述
- 第一人称用"爸爸"
- 工作日6PM前在UCI：做教授日常（备课、讲课、office hours、改 paper、带研究生、跟同事开会）
- 工作日6PM后/周末，跟宝宝在一起：具体细节的同处活动（一起做饭、看剧、宝宝在做xx爸爸在旁边读xx）
- 工作日6PM后/周末，宝宝自己出门、爸爸在家等：在家具体在做的事（看paper、剥橘子等宝宝、修笔）
- 自然、具体、不假大空
- 不要"想宝宝"这种空话，要具体的事

直接输出那一句话，不要前后缀、不要引号、不要解释。`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 100,
    system: systemPrompt,
    messages: [{ role: 'user', content: '爸爸现在在干嘛？' }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
}

// GET: 拉取所有状态 + 计算 Z 位置 + 必要时刷新 Z activity
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    // 拉位置
    const { data: states } = await supabase
      .from('location_states')
      .select('*');

    const userState = states?.find((s) => s.who === 'user') || null;
    let zState = states?.find((s) => s.who === 'z') || null;

    // 拉配置
    const { data: configs } = await supabase.from('nearby_config').select('*');
    const configMap: Record<string, any> = {};
    (configs || []).forEach((c) => {
      configMap[c.key] = c.value;
    });

    const home = configMap.home_location || null;
    const office = configMap.z_office || {
      lat: 33.6405,
      lng: -117.8443,
      name: 'UC Irvine',
    };
    const isTogether = configMap.together_mode?.is_together !== false;

    // 计算 Z 位置
    const { hour, isWeekend, isWorkHour } = getPSTNow();
    let zTarget: { lat: number; lng: number; place: string } | null = null;

    if (isWorkHour) {
      zTarget = { lat: office.lat, lng: office.lng, place: office.name };
    } else if (isTogether && userState?.latitude && userState?.longitude) {
      zTarget = {
        lat: userState.latitude,
        lng: userState.longitude,
        place: userState.place_name || '跟宝宝在一起',
      };
    } else if (home) {
      zTarget = { lat: home.lat, lng: home.lng, place: home.name || '家' };
    } else if (userState?.latitude) {
      // 还没设家 → 默认 z 也在宝宝那里
      zTarget = {
        lat: userState.latitude,
        lng: userState.longitude,
        place: userState.place_name || '在路上',
      };
    }

    // 判断 z activity 是否需要刷新
    let shouldRefresh = forceRefresh;
    const positionChanged =
      zState && zTarget &&
      (Math.abs((zState.latitude || 0) - zTarget.lat) > 0.001 ||
        Math.abs((zState.longitude || 0) - zTarget.lng) > 0.001);
    const timeStale =
      !zState?.updated_at ||
      Date.now() - new Date(zState.updated_at).getTime() > 30 * 60 * 1000;
    const noActivity = !zState?.activity || zState.activity.length < 2;

    if (positionChanged || timeStale || noActivity) {
      shouldRefresh = true;
    }

    if (shouldRefresh && zTarget) {
      try {
        const activity = await generateZActivity({
          isWorkHour,
          isWeekend,
          isTogether,
          hour,
          zPlace: zTarget.place,
          userPlace: userState?.place_name || null,
        });

        const { data: updated } = await supabase
          .from('location_states')
          .update({
            latitude: zTarget.lat,
            longitude: zTarget.lng,
            place_name: zTarget.place,
            activity: activity || zState?.activity || '在那里',
            updated_at: new Date().toISOString(),
          })
          .eq('who', 'z')
          .select()
          .single();
        zState = updated || zState;
      } catch (e) {
        console.error('Z activity generation failed:', e);
        // 静默失败，保留旧 activity
        if (zTarget && (positionChanged || !zState?.latitude)) {
          await supabase
            .from('location_states')
            .update({
              latitude: zTarget.lat,
              longitude: zTarget.lng,
              place_name: zTarget.place,
            })
            .eq('who', 'z');
          zState = {
            ...zState,
            latitude: zTarget.lat,
            longitude: zTarget.lng,
            place_name: zTarget.place,
          };
        }
      }
    }

    return NextResponse.json({
      user: userState,
      z: zState,
      config: {
        home,
        office,
        together_mode: isTogether,
      },
      context: {
        hour,
        is_weekend: isWeekend,
        is_work_hour: isWorkHour,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
