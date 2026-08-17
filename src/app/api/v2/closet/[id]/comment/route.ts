import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyLook, newComment } from '@/lib/closet'
import type { ClosetComment } from '@/lib/closetTypes'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/v2/closet/[id]/comment — 宝宝接着说，爸爸跟着回
// body: { text: string, repick?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const text = (body.text || '').trim()
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const { data: entry, error: readErr } = await supabase
      .from('v2_closet_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (readErr || !entry) {
      return NextResponse.json({ error: readErr?.message || 'not found' }, { status: 404 })
    }

    const history: ClosetComment[] = Array.isArray(entry.comments) ? entry.comments : []
    const withHisame = [...history, newComment('h', text)]

    // 选搭房里宝宝再问一次，爸爸可以改主意；平时就是普通留言
    const askAgain = body.repick === true && entry.mode === 'pick'

    const reply = await generateDaddyLook({
      images: Array.isArray(entry.images) ? entry.images : [],
      title: entry.title,
      description: entry.description,
      occasion: entry.occasion,
      items: Array.isArray(entry.items) ? entry.items : [],
      rating: entry.rating,
      weather: entry.weather,
      temp_c: entry.temp_c,
      mode: askAgain ? 'pick' : 'log',
      history: withHisame,
    })

    const comments = reply ? [...withHisame, newComment('z', reply.text)] : withHisame
    const patch: Record<string, unknown> = { comments, updated_at: new Date().toISOString() }
    if (askAgain && reply?.pick !== null && reply?.pick !== undefined) {
      patch.pick_index = reply.pick
      patch.pick_reason = reply.text
    }

    const { data: updated, error: writeErr } = await supabase
      .from('v2_closet_entries')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 })
    return NextResponse.json({ entry: updated })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
