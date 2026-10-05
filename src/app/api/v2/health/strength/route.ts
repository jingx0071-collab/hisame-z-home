import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

// ---- 预设计划（表为空时写入一次）----
type SeedRow = [name: string, sets: number, reps: number, weight: number, target: string]

const SEED_PLANS: { name: string; rows: SeedRow[] }[] = [
  {
    name: 'Day A - 下肢+臀',
    rows: [
      ['Leg Press', 3, 12, 70, '腿/臀'],
      ['Hip Abductor', 3, 15, 40, '臀中肌'],
      ['Lying Leg Curl', 3, 12, 25, '腘绳肌'],
      ['Leg Extension', 2, 12, 20, '股四头肌'],
      ['Hip Adductor', 2, 15, 40, '大腿内侧'],
    ],
  },
  {
    name: 'Day B - 上肢+核心',
    rows: [
      ['Lat Pulldown', 3, 12, 30, '背'],
      ['Seated Row', 3, 12, 30, '背'],
      ['Chest Press', 3, 10, 20, '胸'],
      ['Dual Pectoral Fly', 3, 12, 25, '胸'],
      ['Tricep Press', 2, 12, 20, '肱三头肌'],
      ['Bicep Curl', 2, 12, 15, '肱二头肌'],
    ],
  },
  {
    name: 'Day C - 全身',
    rows: [
      ['Leg Press', 3, 12, 70, '腿/臀'],
      ['Lying Leg Curl', 3, 12, 25, '腘绳肌'],
      ['Hip Abductor', 3, 15, 40, '臀中肌'],
      ['Lat Pulldown', 3, 12, 30, '背'],
      ['Chest Press', 3, 10, 20, '胸'],
      ['Dual Pulley Pushdown', 2, 12, 15, '肱三头肌'],
    ],
  },
]

const SEED_IDS = [
  '5a1e0000-0000-4000-8000-00000000000a',
  '5a1e0000-0000-4000-8000-00000000000b',
  '5a1e0000-0000-4000-8000-00000000000c',
]

function buildSeedExercises(rows: SeedRow[]) {
  return rows.map(([name, sets, reps, weight, target]) => ({
    id: randomUUID(),
    name,
    category: 'Strength',
    targetMuscle: target,
    note: '',
    sets: Array.from({ length: sets }, () => ({
      id: randomUUID(),
      weight,
      reps,
      rpe: null,
      completed: false,
    })),
  }))
}

async function loadPlans() {
  return supabase
    .from('v2_workout_plans')
    .select('id, name, exercises, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
}

function fail(msg: string, status = 500) {
  return NextResponse.json({ error: msg }, { status })
}

// GET: { plans, logs }；plans 表为空时先写入三个预设
export async function GET() {
  try {
    const first = await loadPlans()
    if (first.error) return fail(first.error.message)
    let plans = first.data

    if (!plans || plans.length === 0) {
      // 固定 id + 忽略冲突：两个请求同时撞进来也只会写入一份
      const { error: seedErr } = await supabase.from('v2_workout_plans').upsert(
        SEED_PLANS.map((p, i) => ({
          id: SEED_IDS[i],
          name: p.name,
          sort_order: i,
          exercises: buildSeedExercises(p.rows),
        })),
        { onConflict: 'id', ignoreDuplicates: true }
      )
      if (seedErr) return fail(seedErr.message)
      const again = await loadPlans()
      if (again.error) return fail(again.error.message)
      plans = again.data
    }

    const { data: logs, error: logErr } = await supabase
      .from('v2_workout_logs')
      .select('id, date, plan_id, exercises, duration, note')
      .order('date', { ascending: false })
      .limit(200)
    if (logErr) return fail(logErr.message)

    return NextResponse.json({ plans: plans || [], logs: logs || [] })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Unknown error')
  }
}

function logFields(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  if (body.date !== undefined) out.date = body.date || new Date().toISOString()
  if (body.plan_id !== undefined) out.plan_id = body.plan_id || null
  if (body.exercises !== undefined) {
    if (!Array.isArray(body.exercises)) throw new Error('exercises must be an array')
    out.exercises = body.exercises
  }
  if (body.duration !== undefined) {
    const n = Number(body.duration)
    out.duration = body.duration === null || body.duration === '' || !Number.isFinite(n) ? null : Math.round(n)
  }
  if (body.note !== undefined) out.note = body.note ? String(body.note).slice(0, 2000) : null
  return out
}

// POST: 新建一条训练记录
// body: { date?, plan_id?, exercises, duration?, note? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!Array.isArray(body.exercises)) return fail('exercises required', 400)
    const { data, error } = await supabase
      .from('v2_workout_logs')
      .insert({ date: new Date().toISOString(), ...logFields(body) })
      .select('id, date, plan_id, exercises, duration, note')
      .single()
    if (error) return fail(error.message)
    return NextResponse.json({ log: data })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Unknown error')
  }
}

// PUT: 更新计划模板或训练记录
// body: { kind: 'plan' | 'log', id, ...fields }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return fail('id required', 400)

    if (body.kind === 'plan') {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
      if (body.name !== undefined) updates.name = String(body.name).slice(0, 100)
      if (body.exercises !== undefined) {
        if (!Array.isArray(body.exercises)) return fail('exercises must be an array', 400)
        updates.exercises = body.exercises
      }
      const { data, error } = await supabase
        .from('v2_workout_plans')
        .update(updates)
        .eq('id', body.id)
        .select('id, name, exercises, sort_order')
        .single()
      if (error) return fail(error.message)
      return NextResponse.json({ plan: data })
    }

    if (body.kind === 'log') {
      const { data, error } = await supabase
        .from('v2_workout_logs')
        .update({ ...logFields(body), updated_at: new Date().toISOString() })
        .eq('id', body.id)
        .select('id, date, plan_id, exercises, duration, note')
        .single()
      if (error) return fail(error.message)
      return NextResponse.json({ log: data })
    }

    return fail('kind must be plan or log', 400)
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Unknown error')
  }
}

// DELETE: 删除一条训练记录
// body: { id }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return fail('id required', 400)
    const { error } = await supabase.from('v2_workout_logs').delete().eq('id', body.id)
    if (error) return fail(error.message)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Unknown error')
  }
}
