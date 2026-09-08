// Tesla Fleet API — token 管理 + 车辆数据
// 环境变量：
//   TESLA_CLIENT_ID      = d9e7a82f-767f-46c9-8d44-a372f5d4f708
//   TESLA_CLIENT_SECRET  = (从 developer.tesla.com 复制)
//   TESLA_REDIRECT_URI   = https://hisame-z-home.vercel.app/api/auth/tesla/callback

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CLIENT_ID = process.env.TESLA_CLIENT_ID!
const CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET!
const REDIRECT_URI = process.env.TESLA_REDIRECT_URI || 'https://hisame-z-home.vercel.app/api/auth/tesla/callback'
const TOKEN_URL = 'https://auth.tesla.com/oauth2/v3/token'
const API_BASE = 'https://fleet-api.prd.na.vn.cloud.tesla.com'  // 北美区；欧洲换 eu

// ── Supabase 存取 token（tesla_tokens 表，单行 singleton）

export type TeslaTokenRow = {
  id: string
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  vehicle_id: string | null
  last_shift_state: string | null
  updated_at: string
}

export async function getTokenRow(): Promise<TeslaTokenRow | null> {
  const { data } = await supabase
    .from('tesla_tokens')
    .select('*')
    .eq('id', 'singleton')
    .maybeSingle()
  return data as TeslaTokenRow | null
}

export async function saveTokenRow(patch: Partial<TeslaTokenRow>) {
  await supabase.from('tesla_tokens').upsert({
    id: 'singleton',
    updated_at: new Date().toISOString(),
    ...patch,
  })
}

// ── 保证拿到有效 access_token（过期自动刷新）

export async function getValidToken(): Promise<string | null> {
  const row = await getTokenRow()
  if (!row?.refresh_token) return null

  const expiresAt = row.expires_at ? new Date(row.expires_at).getTime() : 0
  const needsRefresh = Date.now() > expiresAt - 5 * 60 * 1000  // 5 分钟提前刷

  if (!needsRefresh && row.access_token) return row.access_token

  // 刷新
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: row.refresh_token,
      }),
    })
    if (!res.ok) {
      console.error('[tesla] refresh failed', await res.text())
      return null
    }
    const json = await res.json() as { access_token: string; refresh_token?: string; expires_in: number }
    const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString()
    await saveTokenRow({
      access_token: json.access_token,
      refresh_token: json.refresh_token || row.refresh_token,
      expires_at: expiresAt,
    })
    return json.access_token
  } catch (e) {
    console.error('[tesla] refresh error', e)
    return null
  }
}

// ── OAuth URL 构造（一次性，用于 /api/auth/tesla）

export function buildAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: 'openid vehicle_device_data offline_access',
    state,
  })
  return `https://auth.tesla.com/oauth2/v3/authorize?${params}`
}

// ── 用 code 换 token（callback 里调）

export async function exchangeCode(code: string): Promise<boolean> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    })
    if (!res.ok) {
      console.error('[tesla] exchange failed', await res.text())
      return false
    }
    const json = await res.json() as { access_token: string; refresh_token: string; expires_in: number }
    const expiresAt = new Date(Date.now() + json.expires_in * 1000).toISOString()
    await saveTokenRow({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: expiresAt,
    })
    return true
  } catch (e) {
    console.error('[tesla] exchange error', e)
    return false
  }
}

// ── 车辆列表（第一次获取 vehicle_id）

export async function listVehicles(token: string) {
  const res = await fetch(`${API_BASE}/api/1/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json() as { response: { id_s: string; display_name: string; state: string }[] }
  return json.response ?? null
}

// ── 车辆实时状态（drive_state 含 shift_state、battery_level、lat、lng）

export type VehicleData = {
  state: string  // 'online' | 'asleep' | 'offline'
  shift_state: string | null  // 'D' | 'R' | 'N' | 'P' | null
  battery_level: number | null
  latitude: number | null
  longitude: number | null
  speed: number | null  // mph
}

export async function getVehicleData(token: string, vehicleId: string): Promise<VehicleData | null> {
  try {
    // endpoints 参数只拉 drive_state + charge_state，减少数据量
    const res = await fetch(
      `${API_BASE}/api/1/vehicles/${vehicleId}/vehicle_data?endpoints=drive_state%3Bcharge_state`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      // 诊断：把 Tesla 返回的 status + body 打出来，Vercel logs 里能看到到底是啥错
      const errBody = await res.text().catch(() => '')
      console.error('[tesla] vehicle_data non-2xx', res.status, errBody.slice(0, 300))
      return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json = await res.json() as { response: any }
    const r = json.response
    if (!r) return null
    return {
      state: r.state ?? 'unknown',
      shift_state: r.drive_state?.shift_state ?? null,
      battery_level: r.charge_state?.battery_level ?? null,
      latitude: r.drive_state?.latitude ?? null,
      longitude: r.drive_state?.longitude ?? null,
      speed: r.drive_state?.speed ?? null,
    }
  } catch (e) {
    console.error('[tesla] vehicle data error', e)
    return null
  }
}
