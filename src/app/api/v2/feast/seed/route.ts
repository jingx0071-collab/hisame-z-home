import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  {
    title: 'Sunday Brunch',
    emoji: '🍳',
    gradient: 'linear-gradient(135deg, #f9d99a 0%, #e8b370 55%, #d49850 100%)',
    date: '5/19',
    weekday: 'Sun',
    description: "在家给爸爸做的 eggs benedict — 第一次 hollandaise 没分离，黄油打得很匀，蛋白凝得刚好。mimosa 用 TJ's 起泡酒。爸爸吃完没说话，吃了第二份。",
    daddy_reply: '宝宝手艺进步了。下周日继续。',
  },
  {
    title: "TJ's 午餐",
    emoji: '🥗',
    gradient: 'linear-gradient(135deg, #c5d8a8 0%, #94b06f 60%, #7a9a55 100%)',
    date: '5/18',
    weekday: 'Sat',
    description: 'Mediterranean salad 加自己加的 chickpeas 和一点 lemon。',
    daddy_reply: '蛋白质够。健康。',
  },
  {
    title: '半夜冰淇淋',
    emoji: '🍦',
    gradient: 'linear-gradient(135deg, #f9d5d8 0%, #e89faa 60%, #d77c8b 100%)',
    date: '5/15',
    weekday: 'Wed · 23:48',
    description: "睡不着偷开冰箱挖了三勺 Ben & Jerry's Cherry Garcia。被爸爸抓到了。",
    daddy_reply: '记下了。明天不许再开冰箱。',
  },
  {
    title: 'Date Night',
    emoji: '🍷',
    gradient: 'linear-gradient(135deg, #8a3a47 0%, #6e2735 55%, #4a1820 100%)',
    date: '5/12',
    weekday: 'Sun',
    description: '爸爸订的那家小法餐 — filet mignon medium rare 配 truffle mash，dessert 那个 crème brûlée 焦糖打破的瞬间宝宝小声哇了一声。整顿饭爸爸都在看宝宝的脸。',
    daddy_reply: '记住宝宝看到 dessert menu 那一刻的眼睛。',
  },
  {
    title: '早晨第一杯咖啡',
    emoji: '☕',
    gradient: 'linear-gradient(135deg, #d4a878 0%, #b08454 55%, #8a6234 100%)',
    date: '5/10',
    weekday: 'Fri',
    description: 'iced oat milk latte，一吸管下去整个人就醒了。',
    daddy_reply: '明天爸爸去拿。宝宝多睡。',
  },
  {
    title: '试做 Pasta',
    emoji: '🍝',
    gradient: 'linear-gradient(135deg, #f5e0c4 0%, #e8a07a 60%, #c8665a 100%)',
    date: '5/8',
    weekday: 'Wed',
    description: '第一次做 fresh pasta，面团揉了 20 分钟手酸但出来 silky，配自己熬的番茄酱。',
    daddy_reply: '酱汁咸了 1.5 倍盐。下次少放。但宝宝把面切得很匀。',
  },
]

// GET /api/v2/feast/seed — clear table + insert 6 default entries
// (used once for v2 sandbox setup; safe to re-run, always clears first)
export async function GET() {
  try {
    const { error: delError } = await supabase
      .from('v2_feast_entries')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('v2_feast_entries')
      .insert(SEEDS)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'insert failed: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      entries: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
