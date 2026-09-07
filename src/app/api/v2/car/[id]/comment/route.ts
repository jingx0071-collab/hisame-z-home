import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyComment, newComment } from '@/lib/car'
import type { CarComment } from '@/lib/carTypes'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/v2/car/[id]/comment — 宝宝途中说话，爸爸跟着回
// body: { text: string, silent?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const text = (body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const { data: entry, error: readErr } = await supabase
      .from('v2_car_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (readErr || !entry) {
      return NextResponse.json({ error: readErr?.message || 'not found' }, { status: 404 })
    }

    const history: CarComment[] = Array.isArray(entry.comments) ? entry.comments : []
    const withHisame = [...history, newComment('h', text)]

    const reply = body.silent
      ? null
      : await generateDaddyComment({
          phase: entry.status === 'completed' ? 'end' : 'enroute',
          start_location: entry.start_location,
          end_location: entry.end_location,
          battery: entry.end_battery ?? entry.start_battery,
          start_battery: entry.start_battery,
          distance_km: entry.distance_km,
          duration_min: entry.duration_min,
          history: withHisame,
        })

    const comments = reply ? [...withHisame, newComment('z', reply)] : withHisame

    const { data: updated, error: writeErr } = await supabase
      .from('v2_car_entries')
      .update({ comments, updated_at: new Date().toISOString() })
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
