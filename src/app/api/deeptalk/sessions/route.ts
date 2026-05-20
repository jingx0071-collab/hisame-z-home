import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/deeptalk/sessions
// 返回按 last_message_at desc 排序的全部 session
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('deeptalk_sessions')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ sessions: data || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/deeptalk/sessions
// 新建一个 session，返回 id
export async function POST(req: NextRequest) {
  try {
    // 生成 8 char base36 id (跟 tangent 一致)
    const id = Math.random().toString(36).slice(2, 10);

    const { data, error } = await supabase
      .from('deeptalk_sessions')
      .insert({ id })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ session: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
