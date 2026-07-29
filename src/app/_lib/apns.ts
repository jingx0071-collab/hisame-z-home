import http2 from 'http2';
import jwt from 'jsonwebtoken';

// APNs provider JWT，有效期最长 1 小时，缓存约 50 分钟复用
let cachedToken: { value: string; iat: number } | null = null;

function getProviderToken(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.iat < 3000) {
    return cachedToken.value;
  }
  const keyId = process.env.APNS_KEY_ID!;
  const teamId = process.env.APNS_TEAM_ID!;
  const p8 = process.env.APNS_P8!.replace(/\\n/g, '\n');
  const value = jwt.sign({ iss: teamId, iat: now }, p8, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: keyId },
  });
  cachedToken = { value, iat: now };
  return value;
}

export interface ApnsPayload {
  title?: string;
  body: string;
  badge?: number;
  sound?: string;
  data?: Record<string, unknown>;
}

export interface ApnsResult {
  ok: boolean;
  status: number;
  reason?: string;
}

export async function sendApns(deviceToken: string, payload: ApnsPayload): Promise<ApnsResult> {
  const host = process.env.APNS_ENV === 'production' ? 'api.push.apple.com' : 'api.sandbox.push.apple.com';
  const bundleId = process.env.APNS_BUNDLE_ID!;
  const providerToken = getProviderToken();

  const bodyObj: Record<string, unknown> = {
    aps: {
      alert: payload.title ? { title: payload.title, body: payload.body } : { body: payload.body },
      sound: payload.sound || 'default',
      ...(payload.badge !== undefined ? { badge: payload.badge } : {}),
    },
    ...(payload.data || {}),
  };
  const body = JSON.stringify(bodyObj);

  return new Promise<ApnsResult>((resolve) => {
    const client = http2.connect(`https://${host}`);
    client.on('error', (err) => resolve({ ok: false, status: 0, reason: String(err) }));

    const req = client.request({
      ':method': 'POST',
      ':path': `/3/device/${deviceToken}`,
      authorization: `bearer ${providerToken}`,
      'apns-topic': bundleId,
      'apns-push-type': 'alert',
      'content-type': 'application/json',
    });

    let status = 0;
    let data = '';
    req.on('response', (headers) => { status = Number(headers[':status']) || 0; });
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      client.close();
      if (status === 200) {
        resolve({ ok: true, status });
      } else {
        let reason = data;
        try { reason = JSON.parse(data).reason; } catch { /* keep raw */ }
        resolve({ ok: false, status, reason });
      }
    });
    req.on('error', (err) => resolve({ ok: false, status: 0, reason: String(err) }));

    req.write(body);
    req.end();
  });
}
