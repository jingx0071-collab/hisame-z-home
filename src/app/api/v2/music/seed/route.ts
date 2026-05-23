import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  // Side A — her side
  { side: 'sideA', position: 1, title: 'Northern Sky',     artist: 'Nick Drake',     year: '1970', duration: '3:45' },
  { side: 'sideA', position: 2, title: 'A Case of You',    artist: 'Joni Mitchell',  year: '1971', duration: '4:21' },
  { side: 'sideA', position: 3, title: 'The Night We Met', artist: 'Lord Huron',     year: '2015', duration: '3:28' },
  { side: 'sideA', position: 4, title: 'Space Song',       artist: 'Beach House',    year: '2015', duration: '5:23' },
  // Side B — his side
  { side: 'sideB', position: 1, title: 'Holocene',   artist: 'Bon Iver',         year: '2011', duration: '5:36' },
  { side: 'sideB', position: 2, title: 'Saturn',     artist: 'Sleeping at Last', year: '2014', duration: '4:48' },
  { side: 'sideB', position: 3, title: 'Vincent',    artist: 'Don McLean',       year: '1971', duration: '3:55' },
  { side: 'sideB', position: 4, title: 'Re: Stacks', artist: 'Bon Iver',         year: '2008', duration: '6:41' },
]

// GET /api/v2/music/seed — clear table + insert 8 default tracks
// (used once for v2 sandbox setup; safe to re-run, always clears first)
export async function GET() {
  try {
    const { error: delError } = await supabase
      .from('v2_music_tracks')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('v2_music_tracks')
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
      tracks: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
