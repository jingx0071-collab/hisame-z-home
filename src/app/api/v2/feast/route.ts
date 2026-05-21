import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #f5ede0 0%, #e8d4b8 100%)'

// GET /api/v2/feast — list all entries, newest first
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_feast_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ entries: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/feast — create new entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()
    const defaultDate = `${now.getMonth() + 1}/${now.getDate()}`
    const defaultWeekday = now.toLocaleDateString('en-US', { weekday: 'short' })

    const { data, error } = await supabase
      .from('v2_feast_entries')
      .insert({
        title: (body.title || '').trim() || 'Untitled',
        emoji: body.emoji || '🍽',
        gradient: body.gradient || DEFAULT_GRADIENT,
        date: body.date || defaultDate,
        weekday: body.weekday || defaultWeekday,
        description: (body.description || '').trim() || '',
        daddy_reply: body.daddy_reply || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
