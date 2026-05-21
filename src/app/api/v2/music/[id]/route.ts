import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH /api/v2/music/[id] — update track (any subset of fields, incl. position for reorder)
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
    if ('title' in body) update.title = (body.title || '').trim() || 'untitled'
    if ('artist' in body) update.artist = (body.artist || '').trim() || 'unknown'
    if ('year' in body) update.year = (body.year || '').trim() || '----'
    if ('duration' in body) update.duration = (body.duration || '').trim() || '0:00'
    if ('side' in body && (body.side === 'sideA' || body.side === 'sideB')) {
      update.side = body.side
    }
    if ('position' in body && typeof body.position === 'number') {
      update.position = body.position
    }

    const { data, error } = await supabase
      .from('v2_music_tracks')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ track: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/v2/music/[id] — delete track
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { error } = await supabase
      .from('v2_music_tracks')
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
