import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE /api/tangents/sessions/[id]
// 删除 session + 该 session 下所有 messages
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'session id required' }, { status: 400 });
    }

    // 1. 删除该 session 下的所有 chat_messages
    const { error: msgsErr } = await supabase
      .from('chat_messages')
      .delete()
      .eq('mode', 'tangent')
      .eq('session_id', id);

    if (msgsErr) {
      return NextResponse.json({ error: msgsErr.message }, { status: 500 });
    }

    // 2. 删除 session 本身
    const { error: sessErr } = await supabase
      .from('tangent_sessions')
      .delete()
      .eq('id', id);

    if (sessErr) {
      return NextResponse.json({ error: sessErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/tangents/sessions/[id]
// 拿单个 session 的详情 + 所有 messages（chronological order）
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'session id required' }, { status: 400 });
    }

    // 1. 拿 session info
    const { data: session, error: sessErr } = await supabase
      .from('tangent_sessions')
      .select('id, title, created_at, last_message_at')
      .eq('id', id)
      .single();

    if (sessErr) {
      return NextResponse.json({ error: sessErr.message }, { status: 404 });
    }

    // 2. 拿该 session 的所有消息
    const { data: messages, error: msgsErr } = await supabase
      .from('chat_messages')
      .select('id, role, content, thinking, created_at')
      .eq('mode', 'tangent')
      .eq('session_id', id)
      .order('created_at', { ascending: true });

    if (msgsErr) {
      return NextResponse.json({ error: msgsErr.message }, { status: 500 });
    }

    return NextResponse.json({ session, messages: messages || [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
