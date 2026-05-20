import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 拉所有阅读笔记
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const category = url.searchParams.get('category');

    let query = supabase
      .from('reading_notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notes: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: 加新笔记（user加的，source='user'）
// body: { title, author?, category?, cover_emoji?, z_note, excerpt? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, author, category, cover_emoji, z_note, excerpt } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    if (!z_note || !String(z_note).trim()) {
      return NextResponse.json({ error: 'z_note (笔记内容) required' }, { status: 400 });
    }

    const validCategories = [
      'lacan',
      'japanese',
      'neuroscience',
      'philosophy',
      'fiction',
      'other',
    ];

    const { data, error } = await supabase
      .from('reading_notes')
      .insert({
        title: String(title).slice(0, 200),
        author: author ? String(author).slice(0, 100) : null,
        category: validCategories.includes(category) ? category : 'other',
        cover_emoji: cover_emoji ? String(cover_emoji).slice(0, 10) : '📖',
        z_note: String(z_note).slice(0, 5000),
        excerpt: excerpt ? String(excerpt).slice(0, 2000) : null,
        source: 'user',
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
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, author, category, cover_emoji, z_note, excerpt } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const validCategories = [
      'lacan',
      'japanese',
      'neuroscience',
      'philosophy',
      'fiction',
      'other',
    ];

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = String(title).slice(0, 200);
    if (author !== undefined)
      updates.author = author ? String(author).slice(0, 100) : null;
    if (category !== undefined && validCategories.includes(category))
      updates.category = category;
    if (cover_emoji !== undefined)
      updates.cover_emoji = cover_emoji
        ? String(cover_emoji).slice(0, 10)
        : '📖';
    if (z_note !== undefined) updates.z_note = String(z_note).slice(0, 5000);
    if (excerpt !== undefined)
      updates.excerpt = excerpt ? String(excerpt).slice(0, 2000) : null;

    const { data, error } = await supabase
      .from('reading_notes')
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
      .from('reading_notes')
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
