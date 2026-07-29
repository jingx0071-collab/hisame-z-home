import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST：保存 / 更新 iOS 设备的 APNs device token
export async function POST(req: NextRequest) {
  try {
    const { deviceToken, environment, platform } = await req.json();
    if (!deviceToken) {
      return NextResponse.json({ error: 'No deviceToken' }, { status: 400 });
    }

    const { error } = await supabase
      .from('apns_tokens')
      .upsert(
        {
          device_token: deviceToken,
          environment: environment || 'sandbox',
          platform: platform || 'ios',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_token' }
      );

    if (error) {
      console.error('[apns-token] upsert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
