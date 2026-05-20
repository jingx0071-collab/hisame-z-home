import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST: 更新宝宝的位置/活动
// body: { lat?, lng?, place_name?, activity? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng, place_name, activity } = body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (lat !== undefined && lng !== undefined) {
      updates.latitude = lat;
      updates.longitude = lng;
    }
    if (place_name !== undefined) {
      updates.place_name = place_name ? String(place_name).slice(0, 200) : null;
    }
    if (activity !== undefined) {
      updates.activity = activity ? String(activity).slice(0, 200) : null;
    }

    const { error } = await supabase
      .from('location_states')
      .update(updates)
      .eq('who', 'user');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
