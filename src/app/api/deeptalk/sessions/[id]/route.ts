import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/deeptalk/sessions/[id]
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { data, error } = await supabase
      .from('deeptalk_sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ session: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/deeptalk/sessions/[id]
// 删 session + 该 session 下所有 messages
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // 先删 messages
    const { error: msgErr } = await supabase
      .from('chat_messages')
      .delete()
      .eq('mode', 'deeptalk')
      .eq('session_id', id);

    if (msgErr) {
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    // 再删 session
    const { error: sessErr } = await supabase
      .from('deeptalk_sessions')
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
