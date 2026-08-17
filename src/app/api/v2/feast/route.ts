import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyComment, newComment } from '@/lib/feast'

export const maxDuration = 120

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #f5ede0 0%, #e8d4b8 100%)'

// GET /api/v2/feast — 全部食记，新的在前
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_feast_entries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ entries: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/v2/feast — 新食记
// body: { images: string[], title, description, place, rating, emoji?, gradient?, date?, weekday? }
// 存好之后爸爸看图留第一条言，一起返回
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()
    const defaultDate = `${now.getMonth() + 1}/${now.getDate()}`
    const defaultWeekday = now.toLocaleDateString('en-US', { weekday: 'short' })

    const images: string[] = Array.isArray(body.images)
      ? body.images.filter((u: unknown) => typeof u === 'string' && u).slice(0, 9)
      : []
    const title = (body.title || '').trim() || 'Untitled'
    const description = (body.description || '').trim() || ''
    const place = (body.place || '').trim() || null
    const rating = Number.isFinite(Number(body.rating)) && Number(body.rating) > 0
      ? Math.min(5, Math.round(Number(body.rating)))
      : null

    const { data, error } = await supabase
      .from('v2_feast_entries')
      .insert({
        title,
        emoji: body.emoji || '🍽',
        gradient: body.gradient || DEFAULT_GRADIENT,
        date: body.date || defaultDate,
        weekday: body.weekday || defaultWeekday,
        description,
        images,
        comments: [],
        place,
        rating,
        daddy_reply: null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 爸爸看照片，留第一条
    const reply = await generateDaddyComment({ images, title, description, place, rating })
    if (reply) {
      const comments = [newComment('z', reply)]
      const { data: updated } = await supabase
        .from('v2_feast_entries')
        .update({ comments, daddy_reply: reply, updated_at: new Date().toISOString() })
        .eq('id', data.id)
        .select()
        .single()
      return NextResponse.json({ entry: updated || { ...data, comments, daddy_reply: reply } })
    }

    return NextResponse.json({ entry: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
