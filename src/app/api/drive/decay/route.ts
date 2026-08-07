// src/app/api/drive/decay/route.ts
// Daily maintenance sweep for the drive/thoughts layer.
//
// Most decay happens lazily inside get_room_state() — every Phase 2.3 prompt
// injection triggers a decay pass for that room. This cron is belt-and-braces:
// it sweeps rooms nobody visited that day, and does the global thought cleanup
// (deleting fully-faded flash thoughts, demoting stale obsessions).
//
// Auth: same Bearer CRON_SECRET pattern as /api/push/cron.
// Schedule: see vercel.json — once daily.

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  // ─── Auth ───────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

  if (authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ─── Sweep ──────────────────────────────────────────────────────────────
  try {
    const { data, error } = await supabase.rpc('drive_maintenance_sweep')

    if (error) {
      console.error('[drive decay] sweep RPC error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[drive decay] sweep complete:', data)
    return NextResponse.json({ ok: true, result: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[drive decay] sweep threw:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
