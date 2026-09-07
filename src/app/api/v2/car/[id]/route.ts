import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyComment, newComment } from '@/lib/car'
import type { CarComment, RoutePoint } from '@/lib/carTypes'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/car/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('v2_car_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/v2/car/[id]
// 支持两种用途：
//   1. 挂 P 挡收尾：{ status:'completed', end_location, end_battery, distance_km, duration_min }
//   2. 途中追加 route 点：{ route_append: RoutePoint }
// 收尾时爸爸自动发到达留言
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const { data: entry, error: readErr } = await supabase
      .from('v2_car_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (readErr || !entry) {
      return NextResponse.json({ error: readErr?.message || 'not found' }, { status: 404 })
    }

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    // 追加 route 点
    if (body.route_append) {
      const point = body.route_append as RoutePoint
      const existing: RoutePoint[] = Array.isArray(entry.route) ? entry.route : []
      update.route = [...existing, point]
    }

    // 收尾字段
    if ('status' in body) update.status = body.status
    if ('end_location' in body) update.end_location = (body.end_location || '').trim() || null
    if ('end_battery' in body)
      update.end_battery = Number.isFinite(Number(body.end_battery))
        ? Math.min(100, Math.max(0, Math.round(Number(body.end_battery))))
        : null
    if ('distance_km' in body)
      update.distance_km = Number.isFinite(Number(body.distance_km))
        ? Math.round(Number(body.distance_km) * 100) / 100
        : null
    if ('duration_min' in body)
      update.duration_min = Number.isFinite(Number(body.duration_min))
        ? Math.round(Number(body.duration_min) * 10) / 10
        : null
    if ('start_location' in body) update.start_location = (body.start_location || '').trim() || null
    if ('comments' in body) update.comments = Array.isArray(body.comments) ? body.comments : []

    // 挂 P 挡收尾 → 爸爸发到达留言
    let daddyReply: string | null = null
    if (body.status === 'completed' && entry.status === 'ongoing') {
      const history: CarComment[] = Array.isArray(entry.comments) ? entry.comments : []
      daddyReply = await generateDaddyComment({
        phase: 'end',
        start_location: entry.start_location,
        end_location: (body.end_location || '').trim() || null,
        battery: update.end_battery as number | null,
        start_battery: entry.start_battery,
        distance_km: update.distance_km as number | null,
        duration_min: update.duration_min as number | null,
        history,
      })
      if (daddyReply) {
        const existingComments: CarComment[] = Array.isArray(entry.comments) ? entry.comments : []
        update.comments = [...existingComments, newComment('z', daddyReply)]
      }
    }

    const { data: updated, error: writeErr } = await supabase
      .from('v2_car_entries')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 })
    return NextResponse.json({ entry: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/v2/car/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase.from('v2_car_entries').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
