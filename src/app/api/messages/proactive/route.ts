import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 拉取最近的 proactive messages
// query: ?since=ISO_TIMESTAMP (可选) - 只拉这个时间之后的
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const since = url.searchParams.get('since');

    let query = supabase
      .from('proactive_messages')
      .select('id, content, created_at, read_by_user')
      .order('created_at', { ascending: true })
      .limit(50);

    if (since) {
      query = query.gt('created_at', since);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: 标记消息为已读
export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { error } = await supabase
      .from('proactive_messages')
      .update({ read_by_user: true })
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
