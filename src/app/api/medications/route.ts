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

// GET: 拉所有 active 药物 + 指定日期的 logs（默认今天）
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date = url.searchParams.get('date') || todayPST();

    const { data: meds, error: medErr } = await supabase
      .from('medications')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });

    if (medErr) {
      return NextResponse.json({ error: medErr.message }, { status: 500 });
    }

    const { data: logs, error: logErr } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('log_date', date);

    if (logErr) {
      return NextResponse.json({ error: logErr.message }, { status: 500 });
    }

    return NextResponse.json({
      medications: meds || [],
      logs: logs || [],
      date,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: 新增药物
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.dose) {
      return NextResponse.json(
        { error: 'name and dose are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('medications')
      .insert({
        name: String(body.name).slice(0, 100),
        dose: String(body.dose).slice(0, 50),
        reminder_times: Array.isArray(body.reminder_times)
          ? body.reminder_times
          : [],
        frequency: ['daily', 'weekly', 'as_needed'].includes(body.frequency)
          ? body.frequency
          : 'daily',
        weekly_days: Array.isArray(body.weekly_days)
          ? body.weekly_days
          : null,
        notes: body.notes ? String(body.notes).slice(0, 500) : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medication: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT: 更新药物
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = String(body.name).slice(0, 100);
    if (body.dose !== undefined) updates.dose = String(body.dose).slice(0, 50);
    if (body.reminder_times !== undefined && Array.isArray(body.reminder_times))
      updates.reminder_times = body.reminder_times;
    if (body.frequency !== undefined &&
      ['daily', 'weekly', 'as_needed'].includes(body.frequency))
      updates.frequency = body.frequency;
    if (body.weekly_days !== undefined)
      updates.weekly_days = Array.isArray(body.weekly_days)
        ? body.weekly_days
        : null;
    if (body.notes !== undefined)
      updates.notes = body.notes ? String(body.notes).slice(0, 500) : null;

    const { data, error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ medication: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: 停用药物
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('medications')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', body.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
