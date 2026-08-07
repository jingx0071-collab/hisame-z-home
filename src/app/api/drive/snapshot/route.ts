// src/app/api/drive/snapshot/route.ts
// Fetch the mood snapshot nearest a given moment.
//
// GET /api/drive/snapshot?room=messages&at=2026-08-07T16:40:51.770Z
//
// Returns 404 when no snapshot exists in the window — this is normal for
// messages sent before the snapshot feature shipped, and for rooms that
// aren't drive-enabled.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getRoomConfig } from '@/lib/drive/types'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const room = searchParams.get('room')
  const at = searchParams.get('at')

  if (!room || !at) {
    return NextResponse.json(
      { error: 'room and at are both required' },
      { status: 400 }
    )
  }

  const cfg = getRoomConfig(room)
  if (!cfg) {
    return NextResponse.json(
      { error: `room "${room}" is not drive-enabled` },
      { status: 404 }
    )
  }

  const when = new Date(at)
  if (Number.isNaN(when.getTime())) {
    return NextResponse.json({ error: 'at is not a valid date' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase.rpc('snapshot_near', {
      p_room: room,
      p_at: when.toISOString(),
    })

    if (error) {
      console.error('[snapshot API] RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'no snapshot near that moment' }, { status: 404 })
    }

    // Attach dimension meanings so the client can render tooltips
    const meaningOf = Object.fromEntries(cfg.dimensions.map(d => [d.key, d.meaning]))

    return NextResponse.json({
      ...data,
      displayName: cfg.displayName,
      meanings: meaningOf,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[snapshot API] threw:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
