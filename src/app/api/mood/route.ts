import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 拉所有心情记录（按日期降序）
// ?limit=30 默认30条
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '90', 10);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('id, log_date, level, note, updated_at')
      .order('log_date', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: upsert 某天的心情
// body: { log_date, level, note? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_date, level, note } = body;

    if (!log_date || !/^\d{4}-\d{2}-\d{2}$/.test(log_date)) {
      return NextResponse.json(
        { error: 'log_date (YYYY-MM-DD) required' },
        { status: 400 }
      );
    }

    const lvl = parseInt(level, 10);
    if (isNaN(lvl) || lvl < 1 || lvl > 5) {
      return NextResponse.json(
        { error: 'level must be 1-5' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('mood_logs')
      .upsert(
        {
          log_date,
          level: lvl,
          note: note ? String(note).slice(0, 1000) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'log_date' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ log: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: 删某天的记录
// body: { log_date }
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_date } = body;

    if (!log_date) {
      return NextResponse.json({ error: 'log_date required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('log_date', log_date);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
