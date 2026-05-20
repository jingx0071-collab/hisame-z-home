import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 生成短 session id（8 字符 base36）
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// GET /api/tangents/sessions
// 列出所有碎碎念 session，按 last_message_at 倒序
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('tangent_sessions')
      .select('id, title, created_at, last_message_at')
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

// POST /api/tangents/sessions
// 创建新 session，返回 id（title 暂时 null，等第一条消息后异步生成）
export async function POST() {
  try {
    const id = generateSessionId();
    const { data, error } = await supabase
      .from('tangent_sessions')
      .insert({ id, title: null })
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
