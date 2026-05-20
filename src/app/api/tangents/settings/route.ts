import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/tangents/settings
// 拿用户设置（目前只有 background URL）
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('tangent_background_url')
      .eq('id', 1)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ settings: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/tangents/settings
// Body: { tangent_background_url?: string | null }
// 更新设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if ('tangent_background_url' in body) {
      updates.tangent_background_url = body.tangent_background_url;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, settings: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
