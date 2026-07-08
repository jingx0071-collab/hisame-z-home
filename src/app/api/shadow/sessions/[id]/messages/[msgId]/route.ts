import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; msgId: string }> }
) {
  const { id: sessionId, msgId } = await params;
  const cascade = req.nextUrl.searchParams.get('cascade') === '1';

  const { data: target, error: findErr } = await supabase
    .from('shadow_room_messages')
    .select('id, created_at, session_id')
    .eq('id', msgId)
    .eq('session_id', sessionId)
    .maybeSingle();

  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: 'message not found' }, { status: 404 });

  if (cascade) {
    const { error: delErr } = await supabase
      .from('shadow_room_messages')
      .delete()
      .eq('session_id', sessionId)
      .gte('created_at', target.created_at);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  } else {
    const { error: delErr } = await supabase
      .from('shadow_room_messages')
      .delete()
      .eq('id', msgId);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, cascade });
}
