import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/v2/health — list all 4 dimensions, sorted by position
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('v2_health_dimensions')
      .select('*')
      .order('position', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ dimensions: data || [] })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PUT /api/v2/health — update one dimension by dim_id
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { dim_id, confidence, metrics, note } = body
    if (!dim_id) {
      return NextResponse.json({ error: 'dim_id required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof confidence === 'number') updates.confidence = confidence
    if (Array.isArray(metrics)) updates.metrics = metrics
    if (typeof note === 'string') updates.note = note

    const { data, error } = await supabase
      .from('v2_health_dimensions')
      .update(updates)
      .eq('dim_id', dim_id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ dimension: data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
