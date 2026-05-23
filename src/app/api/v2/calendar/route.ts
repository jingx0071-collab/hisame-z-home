import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/calendar — list all events, sorted by date ascending
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_calendar_events')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ events: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/calendar — create new event
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('v2_calendar_events')
      .insert({
        date: body.date,
        title: (body.title || '').trim() || 'untitled',
        note: (body.note || '').trim() || '',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ event: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
