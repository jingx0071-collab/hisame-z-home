// GET /api/car/debug — 临时调试用，不鉴权。调完删掉这个路由。
import { NextResponse } from 'next/server'
import { getValidToken, getVehicleData, getTokenRow, listVehicles } from '@/lib/tesla'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    // 1. token 行状态
    const row = await getTokenRow()
    out.token_row = row ? {
      has_access_token: !!row.access_token,
      has_refresh_token: !!row.refresh_token,
      expires_at: row.expires_at,
      vehicle_id: row.vehicle_id,
      last_shift_state: row.last_shift_state,
      updated_at: row.updated_at,
    } : null

    // 2. 尝试刷 token
    const token = await getValidToken()
    out.got_valid_token = !!token
    if (!token) return NextResponse.json(out)

    // 3. 列车辆
    const vehicles = await listVehicles(token)
    out.vehicles = vehicles

    // 4. 拉当前车状态
    const vid = row?.vehicle_id || (vehicles?.[0]?.id_s)
    if (vid) {
      const data = await getVehicleData(token, vid)
      out.vehicle_data = data
      out.used_vehicle_id = vid
    }

    // 5. car entries 数量
    const { count } = await supabase.from('v2_car_entries').select('*', { count: 'exact', head: true })
    out.car_entries_count = count

    return NextResponse.json(out, { status: 200 })
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e)
    return NextResponse.json(out, { status: 500 })
  }
}
