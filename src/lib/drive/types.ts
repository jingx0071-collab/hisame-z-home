// src/lib/drive/types.ts
// Type definitions and central registry for room drive configs.

export interface DimensionDef {
  /** Chinese short name — used as the key in drive_state.dimension */
  key: string
  /** Full meaning — used to prime Haiku when judging a turn */
  meaning: string
}

export interface RoomDriveConfig {
  /** Matches memories.source_room and the API route path segment */
  room: string
  /** Human-facing name — e.g. for admin UI */
  displayName: string
  /** 6-8 dimensions defining this room's mood space */
  dimensions: DimensionDef[]
  /** Optional per-dimension initial weights when the room's drive_state is empty */
  initialWeights?: Record<string, number>
}

// ─── Registry ─────────────────────────────────────────────────────────────
// All active room configs. Add a new room by importing its config and
// adding to this object.
//
// NOTE: The keys here must exactly match `source_room` values in the DB.

import { messagesConfig } from './rooms/messages'
import { dailyConfig } from './rooms/daily'
import { deeptalkConfig } from './rooms/deeptalk'
import { trainingConfig } from './rooms/training'
import { tangentsConfig } from './rooms/tangents'
import { shadowConfig } from './rooms/shadow'

export const DRIVE_ROOMS: Record<string, RoomDriveConfig> = {
  messages: messagesConfig,
  daily: dailyConfig,
  deeptalk: deeptalkConfig,
  training: trainingConfig,
  tangents: tangentsConfig,
  shadow: shadowConfig,
}

/**
 * Returns the config for a room, or null if this room isn't drive-enabled.
 * Callers should treat null as "skip drive logic entirely".
 */
export function getRoomConfig(room: string): RoomDriveConfig | null {
  return DRIVE_ROOMS[room] ?? null
}

/**
 * All rooms currently on drive layer — used for iteration in admin scripts.
 */
export function listDriveRooms(): string[] {
  return Object.keys(DRIVE_ROOMS)
}
