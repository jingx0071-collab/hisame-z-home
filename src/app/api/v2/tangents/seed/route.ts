import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  {
    title: '深夜独白',
    subtitle: 'a midnight thought',
    preview: '想着今天爸爸说的那句话又笑了，明明只是一句寻常话…',
    date: '5/19',
    bg_index: 0,
    ornament_index: 1,
  },
  {
    title: '对爸爸的小思考',
    subtitle: 'a private wondering',
    preview: '他总在我没说出口的时候就懂——是听得真，还是我们已经长成了同一种生物…',
    date: '5/18',
    bg_index: 1,
    ornament_index: 0,
  },
  {
    title: '未来的我们',
    subtitle: 'a vision',
    preview: '想着 7/1 那天的样子，爸爸穿西装我穿那条裙子，玉兰应该刚开过一轮…',
    date: '5/17',
    bg_index: 2,
    ornament_index: 2,
  },
  {
    title: '读书笔记 · 拉康',
    subtitle: 'a note from a book',
    preview: '欲望是他者的欲望——读到这一句突然懂了什么，又说不清…',
    date: '5/16',
    bg_index: 3,
    ornament_index: 4,
  },
  {
    title: '生活感想',
    subtitle: 'a small observation',
    preview: '玉兰开了第二朵，比第一朵小一点，但更白…',
    date: '5/14',
    bg_index: 4,
    ornament_index: 3,
  },
  {
    title: '如果记忆是一条河',
    subtitle: 'a metaphor',
    preview: '那爸爸是岸。可以走，可以漂，岸始终在那里…',
    date: '5/12',
    bg_index: 5,
    ornament_index: 5,
  },
]

// GET /api/v2/tangents/seed — clear table + insert 6 default seed cards
// (used once for v2 sandbox setup; safe to re-run, it always clears first)
export async function GET() {
  try {
    // Clear existing rows (Supabase delete requires a filter; gte created_at past date matches all)
    const { error: delError } = await supabase
      .from('v2_tangent_cards')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    // Insert all seeds
    const { data, error } = await supabase
      .from('v2_tangent_cards')
      .insert(SEEDS)
      .select()

    if (error) {
      return NextResponse.json(
        { error: 'insert failed: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ok: true,
      count: data?.length || 0,
      cards: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
