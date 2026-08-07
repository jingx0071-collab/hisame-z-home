// src/lib/drive/context.ts
// Phase 2.3 — render a room's current drive state into a system-prompt block.
//
// This is the piece that closes the loop: the mood the judge has been
// collecting since Phase 2.2 now flows back into how Z actually responds.
//
// Design principles:
//   - Soft guidance, not hard instruction. The block describes 心境, never
//     dictates what to say.
//   - Returns '' on any failure or when there's nothing notable — callers
//     append unconditionally and a blank string is a no-op.
//   - Only surfaces drives meaningfully above baseline, so a freshly-seeded
//     room contributes nothing until real conversation moves it.

import { getRoomState } from './state'
import { getRoomConfig } from './types'

/** Drives below this are considered "at rest" and not worth mentioning. */
const NOTABLE_THRESHOLD = 0.36

/** Map a 0..1 weight onto a short Chinese intensity word. */
function intensityWord(w: number): string {
  if (w >= 0.85) return '压不住'
  if (w >= 0.70) return '很浓'
  if (w >= 0.55) return '明显'
  if (w >= 0.45) return '有一点'
  return '淡淡的'
}

export interface DriveContextOptions {
  /** How many top drives to surface. Default 4. */
  topDrives?: number
  /** How many obsessions to surface. Default 4. */
  maxObsessions?: number
}

/**
 * Build the drive/thoughts prompt block for a room.
 * Returns '' if the room isn't drive-enabled, the fetch fails, or nothing
 * is above baseline.
 */
export async function buildDriveContext(
  room: string,
  opts: DriveContextOptions = {}
): Promise<string> {
  const cfg = getRoomConfig(room)
  if (!cfg) return ''

  const snapshot = await getRoomState(room, {
    topDrives: opts.topDrives ?? 4,
    maxObsessions: opts.maxObsessions ?? 4,
  })
  if (!snapshot) return ''

  const drives = (snapshot.drives ?? []).filter(d => d.weight >= NOTABLE_THRESHOLD)
  const obsessions = snapshot.obsessions ?? []

  if (drives.length === 0 && obsessions.length === 0) return ''

  // Build a lookup so we can pair each dimension with its meaning.
  const meaningOf = new Map(cfg.dimensions.map(d => [d.key, d.meaning]))

  const parts: string[] = []
  parts.push('\n━━ 你此刻的心境（这是你自己的内在状态，不是要你说出来的话）\n')

  if (drives.length > 0) {
    const top = drives[0]
    const topMeaning = meaningOf.get(top.dimension) ?? ''
    parts.push(`此刻最想的：**${top.dimension}**——${topMeaning}\n`)

    if (drives.length > 1) {
      const rest = drives
        .slice(1)
        .map(d => `${d.dimension}（${intensityWord(d.weight)}）`)
        .join('、')
      parts.push(`同时在的：${rest}\n`)
    }
  }

  if (obsessions.length > 0) {
    const lines = obsessions
      .map(o => `- ${o.content}`)
      .join('\n')
    parts.push(`\n心里反复转着的几件事：\n${lines}\n`)
  }

  parts.push(
    '\n这一层是氛围，不是台词。回话时让它染在语气、注意力落点、主动做的事情上——' +
    '不要把这些维度名字或念头原样说出来，也不要因为它们改变房间本来的说话方式。' +
    '语气、长度、格式仍按当前房间人物 prompt 走，保持 in-character。\n'
  )

  return parts.join('')
}

/**
 * Same as buildDriveContext but never throws — returns '' on any error.
 * Use this from route handlers so the mood layer can never break chat.
 */
export async function safeBuildDriveContext(
  room: string,
  opts: DriveContextOptions = {}
): Promise<string> {
  try {
    return await buildDriveContext(room, opts)
  } catch (err) {
    console.warn('[drive] buildDriveContext failed:', err)
    return ''
  }
}
