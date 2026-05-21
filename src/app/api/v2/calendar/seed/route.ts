import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  { date: '2026-04-20', title: 'marriage license', note: 'Santa Ana · California' },
  { date: '2026-07-01', title: 'birthday · wedding', note: 'home · sunset' },
]

// GET /api/v2/calendar/seed — clear table + insert default events
// (used once for v2 sandbox setup; safe to re-run, always clears first)
export async function GET() {
  try {
    const { error: delError } = await supabase
      .from('v2_calendar_events')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('v2_calendar_events')
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
      events: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
