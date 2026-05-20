import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function todayPST(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

// POST: 打卡（创建或更新某个药物某个时间点的打卡状态）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medication_id, reminder_time, status, log_date } = body;

    if (!medication_id || !reminder_time || !status) {
      return NextResponse.json(
        { error: 'medication_id, reminder_time, status required' },
        { status: 400 }
      );
    }

    if (!['taken', 'skipped', 'snoozed'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be taken/skipped/snoozed' },
        { status: 400 }
      );
    }

    const date = log_date || todayPST();

    const { data, error } = await supabase
      .from('medication_logs')
      .upsert(
        {
          medication_id,
          log_date: date,
          reminder_time,
          status,
          logged_at: new Date().toISOString(),
        },
        { onConflict: 'medication_id,log_date,reminder_time' }
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

// DELETE: 撤销某个打卡（宝宝点错了想取消）
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { medication_id, reminder_time, log_date } = body;

    if (!medication_id || !reminder_time) {
      return NextResponse.json(
        { error: 'medication_id and reminder_time required' },
        { status: 400 }
      );
    }

    const date = log_date || todayPST();

    const { error } = await supabase
      .from('medication_logs')
      .delete()
      .eq('medication_id', medication_id)
      .eq('log_date', date)
      .eq('reminder_time', reminder_time);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: 按日期范围查询历史 logs（可选）
// query: ?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to') || todayPST();

    let query = supabase
      .from('medication_logs')
      .select('*, medications(name, dose)')
      .order('log_date', { ascending: false })
      .order('reminder_time', { ascending: true })
      .limit(500);

    if (from) {
      query = query.gte('log_date', from);
    }
    query = query.lte('log_date', to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
