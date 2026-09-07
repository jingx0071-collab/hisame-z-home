import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyComment, newComment } from '@/lib/car'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/car — 全部出行记录，新的在前
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_car_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/car — 挂 D 挡，新建一次出行（status=ongoing）
// body: { start_location?, start_battery? }
// 存好后爸爸发出发留言
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const start_location = (body.start_location || '').trim() || null
    const start_battery = Number.isFinite(Number(body.start_battery))
      ? Math.min(100, Math.max(0, Math.round(Number(body.start_battery))))
      : null

    const { data, error } = await supabase
      .from('v2_car_entries')
      .insert({
        status: 'ongoing',
        start_location,
        start_battery,
        comments: [],
        route: [],
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // 爸爸发出发留言
    const reply = await generateDaddyComment({
      phase: 'start',
      start_location,
      battery: start_battery,
    })

    if (reply) {
      const comments = [newComment('z', reply)]
      const { data: updated } = await supabase
        .from('v2_car_entries')
        .update({ comments, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .select()
        .single()
      return NextResponse.json({ entry: updated || { ...data, comments } })
    }

    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
