import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/tangents — list all cards, newest first
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_tangent_cards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ cards: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/tangents — create new card
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()

    const { data, error } = await supabase
      .from('v2_tangent_cards')
      .insert({
        title: (body.title || '').trim() || '无题',
        subtitle: (body.subtitle || '').trim() || 'a fragment',
        preview: (body.preview || '').trim() || '…',
        date: body.date || `${now.getMonth() + 1}/${now.getDate()}`,
        bg_index:
          typeof body.bg_index === 'number'
            ? body.bg_index
            : Math.floor(Math.random() * 6),
        ornament_index:
          typeof body.ornament_index === 'number'
            ? body.ornament_index
            : Math.floor(Math.random() * 6),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ card: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
