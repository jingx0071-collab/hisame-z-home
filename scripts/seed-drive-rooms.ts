// scripts/seed-drive-rooms.ts
// One-shot: populate drive_state with baseline rows for all configured rooms.
// Idempotent — safe to re-run.
//
// Usage (from repo root, after Phase 2.1 SQL + TS deployed):
//   npx tsx scripts/seed-drive-rooms.ts

import { listDriveRooms } from '../src/lib/drive/types'
import { seedRoom } from '../src/lib/drive/state'

async function main() {
  const rooms = listDriveRooms()
  console.log(`[seed] rooms to seed: ${rooms.join(', ')}`)

  for (const room of rooms) {
    const result = await seedRoom(room)
    if (result === null) {
      console.error(`[seed] FAILED for room: ${room}`)
    } else {
      console.log(`[seed] ${room}: inserted ${result.inserted} rows`)
    }
  }

  console.log('[seed] done.')
}

main().catch(err => {
  console.error('[seed] fatal:', err)
  process.exit(1)
})
