import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #f5ede0 0%, #e8d4b8 100%)'

// PATCH /api/v2/feast/[id] — update entry
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }
    if ('title' in body) update.title = (body.title || '').trim() || 'Untitled'
    if ('emoji' in body) update.emoji = body.emoji || '🍽'
    if ('gradient' in body) update.gradient = body.gradient || DEFAULT_GRADIENT
    if ('date' in body) update.date = body.date
    if ('weekday' in body) update.weekday = body.weekday || ''
    if ('description' in body)
      update.description = (body.description || '').trim() || ''
    if ('daddy_reply' in body) update.daddy_reply = body.daddy_reply || null

    const { data, error } = await supabase
      .from('v2_feast_entries')
      .update(update)
      .eq('id', id)
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

// DELETE /api/v2/feast/[id] — delete entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('v2_feast_entries')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
