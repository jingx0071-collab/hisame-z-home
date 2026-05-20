import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 拉所有经期日（按日期降序）
// 可选 ?since=YYYY-MM-DD 只拉这天之后的
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const since = url.searchParams.get('since');

    let query = supabase
      .from('period_days')
      .select('id, date, flow, notes, created_at')
      .order('date', { ascending: false })
      .limit(1000);

    if (since) {
      query = query.gte('date', since);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ days: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: 标记某天为经期日（upsert）
// body: { date: 'YYYY-MM-DD', flow?, notes? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, flow, notes } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Valid date (YYYY-MM-DD) required' },
        { status: 400 }
      );
    }

    const validFlow = ['light', 'medium', 'heavy'].includes(flow)
      ? flow
      : 'medium';

    const { data, error } = await supabase
      .from('period_days')
      .upsert(
        {
          date,
          flow: validFlow,
          notes: notes ? String(notes).slice(0, 500) : null,
        },
        { onConflict: 'date' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ day: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: 取消某天的经期标记
// body: { date }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: 'date required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('period_days')
      .delete()
      .eq('date', date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
