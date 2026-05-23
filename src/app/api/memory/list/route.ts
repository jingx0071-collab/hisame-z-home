import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('memories')
      .select('id, timestamp_utc, role, source, content, tags, metadata', { count: 'exact' })
      .order('timestamp_utc', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike('content', `%${search}%`);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      memories: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
