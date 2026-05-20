import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 拉所有笔记
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('health_notes')
      .select('id, title, content, note_date, created_at, updated_at')
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: 新增笔记
// body: { title?, content, note_date? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, note_date } = body;

    if (!content || !String(content).trim()) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('health_notes')
      .insert({
        title: title ? String(title).slice(0, 100) : null,
        content: String(content).slice(0, 5000),
        note_date: note_date || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT: 编辑
// body: { id, title?, content?, note_date? }
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, content, note_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined)
      updates.title = title ? String(title).slice(0, 100) : null;
    if (content !== undefined)
      updates.content = String(content).slice(0, 5000);
    if (note_date !== undefined) updates.note_date = note_date;

    const { data, error } = await supabase
      .from('health_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ note: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('health_notes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
