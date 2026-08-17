import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/closet/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await supabase
      .from('v2_closet_entries')
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

// PATCH /api/v2/closet/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if ('title' in body) update.title = (body.title || '').trim() || 'Untitled'
    if ('description' in body) update.description = (body.description || '').trim() || ''
    if ('occasion' in body) update.occasion = (body.occasion || '').trim() || null
    if ('weather' in body) update.weather = (body.weather || '').trim() || null
    if ('items' in body)
      update.items = Array.isArray(body.items)
        ? body.items.filter((x: unknown) => typeof x === 'string' && x).slice(0, 20)
        : []
    if ('images' in body)
      update.images = Array.isArray(body.images)
        ? body.images.filter((x: unknown) => typeof x === 'string' && x).slice(0, 9)
        : []
    if ('comments' in body) update.comments = Array.isArray(body.comments) ? body.comments : []
    if ('rating' in body) {
      const n = Number(body.rating)
      update.rating = Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null
    }
    if ('temp_c' in body) {
      const n = Number(body.temp_c)
      update.temp_c = Number.isFinite(n) ? Math.round(n) : null
    }

    const { data, error } = await supabase
      .from('v2_closet_entries')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/v2/closet/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase.from('v2_closet_entries').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
