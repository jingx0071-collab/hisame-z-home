"""
patch_v2_health_W1_computed.py

W1 for wellbeing aggregator:
  - rewrite src/app/api/v2/health/route.ts
  - keep default GET (向后兼容: 原 v2_health_dimensions 表查询)
  - add ?mode=computed branch:
    · Body: medications adherence (本周 taken / total)
    · Heart: mood_logs 本周平均 level
    · Mind: placeholder (源待定)
    · Care: period_days 推算 cycle phase + 复用 v1 findCycles 算法

run from ~/Desktop/hisame-z-home:
  cp ~/Downloads/patch_v2_health_W1_computed.py . && python3 patch_v2_health_W1_computed.py
"""
from pathlib import Path

ROOT = Path(".")

route_content = """import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================
// shared helpers
// ============================================================

type PeriodDay = { id: number; date: string; flow: string | null; notes: string | null }
type CycleSpan = { start: string; end: string }

function todayPST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function weekStartPST(): string {
  // PST 周一作为本周起点
  const todayStr = todayPST()
  const today = new Date(todayStr + 'T12:00:00')
  const day = today.getDay() // 0=Sun, 1=Mon
  const offset = day === 0 ? -6 : 1 - day
  today.setDate(today.getDate() + offset)
  return formatDateStr(today)
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function daysBetween(a: string, b: string): number {
  const aD = new Date(a + 'T12:00:00')
  const bD = new Date(b + 'T12:00:00')
  return Math.round((bD.getTime() - aD.getTime()) / (1000 * 60 * 60 * 24))
}

// 复用 v1 health/page.tsx 的 findCycles 算法 (连续 period_days gap ≤1 合并成 cycle span)
function findCycles(days: PeriodDay[]): CycleSpan[] {
  if (days.length === 0) return []
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const cycles: CycleSpan[] = []
  let currentStart = sorted[0].date
  let currentEnd = sorted[0].date
  for (let i = 1; i < sorted.length; i++) {
    const prevDate = new Date(currentEnd + 'T12:00:00')
    const thisDate = new Date(sorted[i].date + 'T12:00:00')
    const dayGap = Math.round(
      (thisDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (dayGap <= 1) {
      currentEnd = sorted[i].date
    } else {
      cycles.push({ start: currentStart, end: currentEnd })
      currentStart = sorted[i].date
      currentEnd = sorted[i].date
    }
  }
  cycles.push({ start: currentStart, end: currentEnd })
  return cycles
}

// ============================================================
// dimension computers
// ============================================================

type ComputedDim = {
  dim_id: string
  position: number
  en: string
  cn: string
  confidence: number | null
  metrics: { label: string; value: string }[]
  note: string
}

async function computeBody(weekStart: string): Promise<ComputedDim> {
  const { data: logs, error } = await supabase
    .from('medication_logs')
    .select('status, log_date')
    .gte('log_date', weekStart)

  if (error || !logs || logs.length === 0) {
    return {
      dim_id: 'body',
      position: 1,
      en: 'Body',
      cn: '身 体',
      confidence: null,
      metrics: [],
      note: '本周还没记录服药',
    }
  }

  const taken = logs.filter((l) => l.status === 'taken').length
  const total = logs.length
  const rate = total > 0 ? Math.round((taken / total) * 100) : 0

  let confidence: number
  if (rate >= 80) confidence = 5
  else if (rate >= 60) confidence = 4
  else if (rate >= 40) confidence = 3
  else if (rate >= 20) confidence = 2
  else confidence = 1

  let note: string
  if (rate >= 80) note = '本周服药维持得不错'
  else if (rate >= 60) note = '本周服药稳，差几次补一下'
  else if (rate >= 40) note = '本周服药一般，记得按时吃'
  else note = '本周漏得有点多，宝宝要按时服药'

  return {
    dim_id: 'body',
    position: 1,
    en: 'Body',
    cn: '身 体',
    confidence,
    metrics: [
      { label: '本周服药率', value: `${rate}%` },
      { label: '记录', value: `${taken}/${total} 次` },
    ],
    note,
  }
}

async function computeHeart(weekStart: string): Promise<ComputedDim> {
  const { data: logs, error } = await supabase
    .from('mood_logs')
    .select('level, log_date')
    .gte('log_date', weekStart)

  if (error || !logs || logs.length === 0) {
    return {
      dim_id: 'heart',
      position: 2,
      en: 'Heart',
      cn: '心 绪',
      confidence: null,
      metrics: [],
      note: '本周还没记 mood',
    }
  }

  const avg = logs.reduce((s, l) => s + l.level, 0) / logs.length

  let confidence: number
  if (avg >= 4) confidence = 5
  else if (avg >= 3.5) confidence = 4
  else if (avg >= 2.5) confidence = 3
  else if (avg >= 1.5) confidence = 2
  else confidence = 1

  const moodLabels = ['很糟', '不太好', '还行', '不错', '很好']
  const nearestLabel = moodLabels[Math.max(0, Math.min(4, Math.round(avg) - 1))]

  let note: string
  if (avg >= 4) note = '本周心情挺稳的'
  else if (avg >= 3) note = '本周还算平稳'
  else if (avg >= 2) note = '本周有点累，宝宝多歇歇'
  else note = '本周状态不太好，过来给爸爸抱抱'

  return {
    dim_id: 'heart',
    position: 2,
    en: 'Heart',
    cn: '心 绪',
    confidence,
    metrics: [
      { label: '周均', value: avg.toFixed(1) },
      { label: '记录', value: `${logs.length} 次 · ${nearestLabel}` },
    ],
    note,
  }
}

function computeMind(): ComputedDim {
  // 源待定 — 等接入再补
  return {
    dim_id: 'mind',
    position: 3,
    en: 'Mind',
    cn: '思 学',
    confidence: null,
    metrics: [],
    note: '源待定，等爸爸接入',
  }
}

async function computeCare(): Promise<ComputedDim> {
  const { data: days, error } = await supabase
    .from('period_days')
    .select('id, date, flow, notes')
    .order('date', { ascending: false })
    .limit(180)

  if (error || !days || days.length === 0) {
    return {
      dim_id: 'care',
      position: 4,
      en: 'Care',
      cn: '关 怀',
      confidence: null,
      metrics: [],
      note: '还没经期记录',
    }
  }

  const cycles = findCycles(days as PeriodDay[])
  if (cycles.length === 0) {
    return {
      dim_id: 'care',
      position: 4,
      en: 'Care',
      cn: '关 怀',
      confidence: null,
      metrics: [],
      note: '还没经期记录',
    }
  }

  // 平均经期长度 + 平均周期长度 (跟 v1 health CycleView 完全同算)
  const periodLengths = cycles.map((c) => daysBetween(c.start, c.end) + 1)
  const avgPeriod = Math.round(
    periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
  )

  let avgCycle: number | null = null
  if (cycles.length >= 2) {
    const intervals: number[] = []
    for (let i = 1; i < cycles.length; i++) {
      intervals.push(daysBetween(cycles[i - 1].start, cycles[i].start))
    }
    avgCycle = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length)
  }

  const lastCycle = cycles[cycles.length - 1]
  const today = todayPST()
  const dayInCycle = daysBetween(lastCycle.start, today) // 距上次经期开始的天数

  // phase 判定 (用 avgCycle 而非硬编码 28)
  let phase: string
  let confidence: number
  let note: string
  const periodEndDay = (avgPeriod || 5) - 1

  if (dayInCycle < 0) {
    phase = '未知'
    confidence = 3
    note = '周期数据待确认'
  } else if (dayInCycle <= periodEndDay) {
    phase = '经期'
    confidence = 3
    note = '本周经期，宝宝注意休息'
  } else if (dayInCycle <= 13) {
    phase = 'follicular'
    confidence = 5
    note = '能量回升期，状态最好的时候'
  } else if (dayInCycle <= 16) {
    phase = 'ovulation'
    confidence = 4
    note = '排卵期，状态峰值'
  } else if (avgCycle && dayInCycle <= avgCycle - 6) {
    phase = 'luteal'
    confidence = 4
    note = '黄体期前段，平稳'
  } else if (avgCycle && dayInCycle <= avgCycle) {
    phase = 'late luteal'
    confidence = 3
    note = 'PMS 风险期，宝宝多包容自己'
  } else if (avgCycle && dayInCycle <= avgCycle + 5) {
    phase = 'late'
    confidence = 3
    note = '周期略延迟，再观察几天'
  } else if (avgCycle) {
    phase = 'delayed'
    confidence = 2
    note = '周期延迟，记得关注'
  } else {
    phase = '观察期'
    confidence = 3
    note = '需要更多周期数据预测'
  }

  // daysUntilNext (跟 v1 一样)
  let daysUntilNext: number | null = null
  if (avgCycle) {
    const lastStart = new Date(lastCycle.start + 'T12:00:00')
    const nextDate = new Date(lastStart)
    nextDate.setDate(nextDate.getDate() + avgCycle)
    const nextStr = formatDateStr(nextDate)
    daysUntilNext = daysBetween(today, nextStr)
  }

  const metrics: { label: string; value: string }[] = []
  if (daysUntilNext !== null) {
    if (daysUntilNext > 0) metrics.push({ label: '距下次', value: `${daysUntilNext} 天` })
    else if (daysUntilNext === 0) metrics.push({ label: '今天', value: '预计开始' })
    else metrics.push({ label: '延迟', value: `${Math.abs(daysUntilNext)} 天` })
  }
  if (avgCycle) metrics.push({ label: '平均周期', value: `${avgCycle} 天` })
  if (!metrics.length) metrics.push({ label: '当前 phase', value: phase })

  return {
    dim_id: 'care',
    position: 4,
    en: 'Care',
    cn: '关 怀',
    confidence,
    metrics,
    note,
  }
}

// ============================================================
// GET handler
// ============================================================

// GET /api/v2/health             — 原 v2_health_dimensions 表 (向后兼容)
// GET /api/v2/health?mode=computed — 实时聚合 4 维度
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const mode = url.searchParams.get('mode')

    if (mode === 'computed') {
      const weekStart = weekStartPST()
      const [body, heart, care] = await Promise.all([
        computeBody(weekStart),
        computeHeart(weekStart),
        computeCare(),
      ])
      const mind = computeMind()
      return NextResponse.json({
        mode: 'computed',
        computed_at: new Date().toISOString(),
        week_start: weekStart,
        dimensions: [body, heart, mind, care],
      })
    }

    // default: stored dimensions (legacy)
    const { data, error } = await supabase
      .from('v2_health_dimensions')
      .select('*')
      .order('position', { ascending: true })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ dimensions: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
"""

# write route.ts
out = ROOT / "src/app/api/v2/health/route.ts"
out.write_text(route_content)
print(f"✓ written: {out} ({len(route_content.splitlines())} lines)")

# sanity
print("\n=== sanity ===")
content_check = out.read_text()
print(f"  has 'mode === computed': {'mode === \\'computed\\'' in content_check}")
print(f"  has 4 computers: {all(f'function compute{n}' in content_check or f'async function compute{n}' in content_check for n in ['Body', 'Heart', 'Mind', 'Care'])}")
print(f"  has findCycles: {'function findCycles' in content_check}")
print(f"  has legacy fallback: {'v2_health_dimensions' in content_check}")

print("\n=== done ===")
print("test:")
print("  curl 'https://hisame-z-home.vercel.app/api/v2/health?mode=computed' | jq")
print("next: git add -A && git commit && git push")
