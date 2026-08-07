// src/app/api/drive/state/route.ts
// Read drive state for one room or all rooms.
//
// GET /api/drive/state              → all drive-enabled rooms
// GET /api/drive/state?room=daily   → just that room
//
// Note: reading triggers lazy decay inside get_room_state(), so hitting this
// endpoint keeps the mood honest even if nobody's been chatting.

import { NextRequest, NextResponse } from 'next/server'
import { getRoomState } from '@/lib/drive/state'
import { listDriveRooms, getRoomConfig } from '@/lib/drive/types'

export const dynamic = 'force-dynamic'

interface DimensionOut {
  dimension: string
  weight: number
  meaning: string
}

interface ThoughtOut {
  content: string
  dimension: string | null
  weight: number
  count: number
  promoted: boolean
  last_touched: string
}

interface RoomOut {
  room: string
  displayName: string
  drives: DimensionOut[]
  obsessions: ThoughtOut[]
  topDimension: string | null
}

async function buildRoomOut(room: string): Promise<RoomOut | null> {
  const cfg = getRoomConfig(room)
  if (!cfg) return null

  // Ask for every dimension, not just the notable ones — the panel shows all
  const snapshot = await getRoomState(room, {
    topDrives: cfg.dimensions.length,
    maxObsessions: 8,
  })

  const meaningOf = new Map(cfg.dimensions.map(d => [d.key, d.meaning]))
  const weightOf = new Map(
    (snapshot?.drives ?? []).map(d => [d.dimension, d.weight])
  )

  // Emit every configured dimension, defaulting to baseline when unseen,
  // so the panel always renders the full space rather than a ragged subset.
  const drives: DimensionOut[] = cfg.dimensions
    .map(d => ({
      dimension: d.key,
      weight: weightOf.get(d.key) ?? 0.3,
      meaning: d.meaning,
    }))
    .sort((a, b) => b.weight - a.weight)

  const obsessions: ThoughtOut[] = (snapshot?.obsessions ?? []).map(o => ({
    content: o.content,
    dimension: o.dimension ?? null,
    weight: o.weight,
    count: o.count,
    promoted: true,
    last_touched: o.last_touched,
  }))

  const top = drives[0]
  return {
    room,
    displayName: cfg.displayName,
    drives,
    obsessions,
    topDimension: top && top.weight > 0.3 ? top.dimension : null,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const requested = searchParams.get('room')

  try {
    if (requested) {
      const out = await buildRoomOut(requested)
      if (!out) {
        return NextResponse.json(
          { error: `room "${requested}" is not drive-enabled` },
          { status: 404 }
        )
      }
      return NextResponse.json({ rooms: [out] })
    }

    const rooms = listDriveRooms()
    const results = await Promise.all(rooms.map(buildRoomOut))
    return NextResponse.json({
      rooms: results.filter((r): r is RoomOut => r !== null),
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[drive state API] threw:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
