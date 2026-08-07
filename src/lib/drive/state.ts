// src/lib/drive/state.ts
// Helpers for reading and writing drive_state / thoughts.
// Fire-and-forget on writes — never break chat if drive layer fails.
//
// PHASE 2.1 SCOPE:
//   These functions are DEFINED but NOT YET CALLED anywhere in the app.
//   Phase 2.2 wires them into judgeAndWriteMemory.
//   Phase 2.3 wires them into main chat prompt injection.

import { createClient } from '@supabase/supabase-js'
import { getRoomConfig } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// ─── Types matching DB rows ──────────────────────────────────────────────

export interface DriveRow {
  dimension: string
  weight: number
}

export interface ThoughtRow {
  id: string
  source_room: string
  content: string
  dimension: string | null
  weight: number
  count: number
  promoted: boolean
  created_at: string
  last_touched: string
  metadata: Record<string, unknown> | null
}

export interface RoomStateSnapshot {
  room: string
  drives: DriveRow[]         // top-N drives above baseline
  obsessions: ThoughtRow[]   // promoted thoughts
  fetched_at: string
}

// ─── Read: snapshot of a room's current state ────────────────────────────

export async function getRoomState(
  room: string,
  opts: { topDrives?: number; maxObsessions?: number } = {}
): Promise<RoomStateSnapshot | null> {
  try {
    const { data, error } = await supabase.rpc('get_room_state', {
      p_room: room,
      p_top_drives: opts.topDrives ?? 4,
      p_max_obsessions: opts.maxObsessions ?? 5,
    })
    if (error) {
      console.error('[drive] getRoomState error:', error)
      return null
    }
    return data as RoomStateSnapshot
  } catch (err) {
    console.error('[drive] getRoomState threw:', err)
    return null
  }
}

// ─── Write: adjust a dimension's weight by delta ─────────────────────────

export async function updateDrive(
  room: string,
  dimension: string,
  delta: number
): Promise<{ newWeight: number; wasCreated: boolean } | null> {
  // Validate: is this room drive-enabled and is dimension in its config?
  const cfg = getRoomConfig(room)
  if (!cfg) {
    console.warn(`[drive] updateDrive: room "${room}" not in DRIVE_ROOMS`)
    return null
  }
  const knownDim = cfg.dimensions.some(d => d.key === dimension)
  if (!knownDim) {
    console.warn(`[drive] updateDrive: unknown dimension "${dimension}" for room "${room}"`)
    return null
  }

  try {
    const { data, error } = await supabase.rpc('update_drive', {
      p_room: room,
      p_dimension: dimension,
      p_delta: delta,
    })
    if (error) {
      console.error('[drive] updateDrive error:', error)
      return null
    }
    const row = Array.isArray(data) ? data[0] : data
    return {
      newWeight: row?.new_weight ?? 0.3,
      wasCreated: !!row?.was_created,
    }
  } catch (err) {
    console.error('[drive] updateDrive threw:', err)
    return null
  }
}

// ─── Write: add or bump a thought ────────────────────────────────────────

export interface BumpThoughtResult {
  id: string
  isNew: boolean
  justPromoted: boolean
  finalCount: number
  finalWeight: number
}

export async function bumpThought(
  room: string,
  content: string,
  opts: {
    dimension?: string
    weight?: number
    metadata?: Record<string, unknown>
  } = {}
): Promise<BumpThoughtResult | null> {
  const trimmed = content?.trim()
  if (!trimmed) return null

  try {
    const { data, error } = await supabase.rpc('bump_thought', {
      p_room: room,
      p_content: trimmed,
      p_dimension: opts.dimension ?? null,
      p_weight: opts.weight ?? 0.3,
      p_metadata: opts.metadata ?? {},
    })
    if (error) {
      console.error('[drive] bumpThought error:', error)
      return null
    }
    const row = Array.isArray(data) ? data[0] : data
    if (!row) return null
    return {
      id: row.id,
      isNew: !!row.is_new,
      justPromoted: !!row.just_promoted,
      finalCount: row.final_count,
      finalWeight: row.final_weight,
    }
  } catch (err) {
    console.error('[drive] bumpThought threw:', err)
    return null
  }
}

// ─── Snapshot: freeze the current mood ───────────────────────────────────
// Called by the judge before applying this turn's updates, so the stored
// snapshot reflects the mood that shaped the reply.

export async function captureSnapshot(
  room: string,
  metadata: Record<string, unknown> = {},
): Promise<{ id: string } | null> {
  try {
    // Read raw rows rather than get_room_state, so we capture the full
    // dimension space (including at-rest ones) without triggering decay.
    const [{ data: driveRows }, { data: thoughtRows }] = await Promise.all([
      supabase
        .from('drive_state')
        .select('dimension, weight')
        .eq('source_room', room)
        .order('weight', { ascending: false }),
      supabase
        .from('thoughts')
        .select('content, dimension, weight, count, promoted')
        .eq('source_room', room)
        .gt('weight', 0.1)
        .order('last_touched', { ascending: false })
        .limit(6),
    ])

    const drives = driveRows ?? []
    const thoughts = thoughtRows ?? []
    const top = drives.find(d => d.weight > 0.3)

    const { data, error } = await supabase
      .from('drive_snapshots')
      .insert({
        source_room: room,
        top_dimension: top?.dimension ?? null,
        drives,
        thoughts,
        metadata,
      })
      .select('id')
      .single()

    if (error) {
      console.warn('[drive] captureSnapshot error:', error)
      return null
    }
    return { id: data.id as string }
  } catch (err) {
    console.warn('[drive] captureSnapshot threw:', err)
    return null
  }
}

// ─── Maintenance: time-based decay ───────────────────────────────────────

export async function decayRoom(room: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('decay_room', { p_room: room })
    if (error) {
      console.error('[drive] decayRoom error:', error)
      return 0
    }
    return typeof data === 'number' ? data : 0
  } catch (err) {
    console.error('[drive] decayRoom threw:', err)
    return 0
  }
}

// ─── Initialization: seed a room's drive_state with initialWeights ───────
// Idempotent — safe to call from admin script. Won't overwrite existing rows.

export async function seedRoom(room: string): Promise<{ inserted: number } | null> {
  const cfg = getRoomConfig(room)
  if (!cfg) return null

  const rows = cfg.dimensions.map(d => ({
    source_room: room,
    dimension: d.key,
    weight: cfg.initialWeights?.[d.key] ?? 0.3,
  }))

  try {
    // Use upsert with ignoreDuplicates via ON CONFLICT DO NOTHING equivalent
    const { data, error } = await supabase
      .from('drive_state')
      .upsert(rows, {
        onConflict: 'source_room,dimension',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      console.error('[drive] seedRoom error:', error)
      return null
    }
    return { inserted: data?.length ?? 0 }
  } catch (err) {
    console.error('[drive] seedRoom threw:', err)
    return null
  }
}
