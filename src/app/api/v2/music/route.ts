import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/music — list all tracks, sorted by side then position
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_music_tracks')
      .select('*')
      .order('side', { ascending: true })
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ tracks: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/music — create new track, auto-assigns position = max(position in side) + 1
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.side || (body.side !== 'sideA' && body.side !== 'sideB')) {
      return NextResponse.json(
        { error: 'side required (sideA or sideB)' },
        { status: 400 }
      )
    }

    // Find next position for this side
    const { data: maxData } = await supabase
      .from('v2_music_tracks')
      .select('position')
      .eq('side', body.side)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition =
      maxData && maxData.length > 0 ? maxData[0].position + 1 : 1

    const { data, error } = await supabase
      .from('v2_music_tracks')
      .insert({
        side: body.side,
        position: nextPosition,
        title: (body.title || '').trim() || 'untitled',
        artist: (body.artist || '').trim() || 'unknown',
        year: (body.year || '').trim() || '----',
        duration: (body.duration || '').trim() || '0:00',
      })
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
