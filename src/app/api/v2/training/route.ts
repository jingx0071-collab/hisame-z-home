import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/training — 读单行 state
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_training_state')
      .select('data')
      .eq('id', 1)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data: data?.data ?? {} })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/training — body: { patch: {...} }，merge 到 data 字段
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const patch =
      body && typeof body === 'object' && body.patch && typeof body.patch === 'object'
        ? (body.patch as Record<string, unknown>)
        : null
    if (!patch) {
      return NextResponse.json({ error: 'missing patch' }, { status: 400 })
    }

    const { data: row, error: readErr } = await supabase
      .from('v2_training_state')
      .select('data')
      .eq('id', 1)
      .single()
    if (readErr) {
      return NextResponse.json({ error: readErr.message }, { status: 500 })
    }
    const oldData = (row?.data ?? {}) as Record<string, unknown>
    const merged = { ...oldData, ...patch }

    const { error: upErr } = await supabase
      .from('v2_training_state')
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('id', 1)
    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
    return NextResponse.json({ data: merged })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
