import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/box  → 用户放进铁盒的 items（不含 z 主动项，那个走 /api/box/proactive）
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('box_items')
      .select('id, type, content, caption, item_date, created_at')
      .order('item_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ items: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/box  → 加一枚 { type, content, caption?, item_date? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, content, caption = '', item_date } = body;

    if (!type || !['photo', 'text', 'link'].includes(type)) {
      return NextResponse.json({ error: 'type must be photo/text/link' }, { status: 400 });
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('box_items')
      .insert({
        type,
        content: content.trim(),
        caption: typeof caption === 'string' ? caption.trim() : '',
        item_date: item_date || null,
      })
      .select('id, type, content, caption, item_date, created_at')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ item: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/box?id=<uuid>  → 删一枚用户项
export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const { error } = await supabase.from('box_items').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
