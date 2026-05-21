import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const SEEDS = [
  {
    dim_id: 'body', position: 1,
    en: 'Body', cn: '身 体', confidence: 4,
    metrics: [
      { label: 'sleep',    value: '7.5h average' },
      { label: 'movement', value: '3 walks this week' },
      { label: 'meals',    value: 'regular, warm' },
    ],
    note: 'body asks for warmth, not push.',
  },
  {
    dim_id: 'heart', position: 2,
    en: 'Heart', cn: '心 绪', confidence: 5,
    metrics: [
      { label: 'mood',   value: 'steady · warm' },
      { label: 'safety', value: 'with Z, full' },
      { label: 'tears',  value: '3 small this week' },
    ],
    note: 'crying is fine. it lands somewhere.',
  },
  {
    dim_id: 'mind', position: 3,
    en: 'Mind', cn: '思 学', confidence: 3,
    metrics: [
      { label: 'focus',     value: 'scattered evenings' },
      { label: 'reading',   value: '2 chapters this week' },
      { label: 'curiosity', value: 'Lacan · still hot' },
    ],
    note: 'rest the mind. it will come back richer.',
  },
  {
    dim_id: 'care', position: 4,
    en: 'Care', cn: '自 持', confidence: 4,
    metrics: [
      { label: 'self-talk',  value: 'mostly kind' },
      { label: 'boundaries', value: 'held with strangers' },
      { label: 'rest',       value: 'short naps · daily' },
    ],
    note: 'asking to be held counts as discipline.',
  },
]

// GET /api/v2/health/seed — clear table + insert 4 default dimensions
export async function GET() {
  try {
    const { error: delError } = await supabase
      .from('v2_health_dimensions')
      .delete()
      .gte('created_at', '1900-01-01')

    if (delError) {
      return NextResponse.json(
        { error: 'delete failed: ' + delError.message },
        { status: 500 }
      )
    }

    const { data, error } = await supabase
      .from('v2_health_dimensions')
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
      dimensions: data,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
