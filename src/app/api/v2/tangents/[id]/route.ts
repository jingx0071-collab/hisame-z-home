import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/v2/tangents/[id] — update card
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
    if ('title' in body) update.title = (body.title || '').trim() || '无题'
    if ('subtitle' in body)
      update.subtitle = (body.subtitle || '').trim() || 'a fragment'
    if ('preview' in body) update.preview = (body.preview || '').trim() || '…'
    if ('bg_index' in body && typeof body.bg_index === 'number')
      update.bg_index = body.bg_index
    if ('ornament_index' in body && typeof body.ornament_index === 'number')
      update.ornament_index = body.ornament_index

    const { data, error } = await supabase
      .from('v2_tangent_cards')
      .update(update)
      .eq('id', id)
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

// DELETE /api/v2/tangents/[id] — delete card
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('v2_tangent_cards')
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
