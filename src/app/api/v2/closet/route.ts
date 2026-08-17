import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyLook, newComment } from '@/lib/closet'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_LOOKS = 9

function cleanList(v: unknown, max = MAX_LOOKS): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()).map((x) => x.trim()).slice(0, max)
    : []
}

function cleanInt(v: unknown, min: number, max: number): number | null {
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const r = Math.round(n)
  return r >= min && r <= max ? r : null
}

// GET /api/v2/closet — 全部穿搭，新的在前
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_closet_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ entries: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/closet — 新穿搭
// body: { images, title, description, occasion, items, rating, weather, temp_c, mode }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()

    const images = cleanList(body.images)
    const items = cleanList(body.items, 20)
    const mode = body.mode === 'pick' ? 'pick' : 'log'
    const title = (body.title || '').trim() || 'Untitled'
    const description = (body.description || '').trim() || ''
    const occasion = (body.occasion || '').trim() || null
    const weather = (body.weather || '').trim() || null
    const rating = cleanInt(body.rating, 1, 5)
    const temp_c = cleanInt(body.temp_c, -60, 60)

    const { data, error } = await supabase
      .from('v2_closet_entries')
      .insert({
        title,
        date: body.date || `${now.getMonth() + 1}/${now.getDate()}`,
        weekday: body.weekday || now.toLocaleDateString('en-US', { weekday: 'short' }),
        description,
        images,
        comments: [],
        occasion,
        items,
        rating,
        weather,
        temp_c,
        mode,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const reply = await generateDaddyLook({
      images, title, description, occasion, items, rating, weather, temp_c, mode,
    })

    if (reply) {
      const patch: Record<string, unknown> = {
        comments: [newComment('z', reply.text)],
        updated_at: new Date().toISOString(),
      }
      if (mode === 'pick' && reply.pick !== null) {
        patch.pick_index = reply.pick
        patch.pick_reason = reply.text
      }
      const { data: updated } = await supabase
        .from('v2_closet_entries')
        .update(patch)
        .eq('id', data.id)
        .select()
        .single()
      return NextResponse.json({ entry: updated || { ...data, ...patch } })
    }

    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
