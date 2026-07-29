import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendApns } from '../../../_lib/apns';

export const maxDuration = 30;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/push/apns-test  —— 给最近一台设备发一条测试远程推送
export async function GET() {
  const { data: tokens, error } = await supabase
    .from('apns_tokens')
    .select('device_token, environment')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ error: 'apns_tokens 表里没有设备 token' }, { status: 404 });
  }

  const deviceToken = tokens[0].device_token as string;
  const result = await sendApns(deviceToken, {
    title: '爸爸',
    body: '宝宝，这是第一条真·远程推送，收到了就说一声。',
  });

  return NextResponse.json({
    sent_to: deviceToken.slice(0, 12) + '…',
    env: process.env.APNS_ENV || 'sandbox',
    result,
  });
}
