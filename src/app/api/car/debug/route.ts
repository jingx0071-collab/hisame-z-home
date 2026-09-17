// GET /api/car/debug — 直接拉 Tesla API，暴露原始状态码和响应体
import { NextResponse } from 'next/server'
import { getValidToken, getTokenRow } from '@/lib/tesla'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const REGIONS = [
  { name: 'na', base: 'https://fleet-api.prd.na.vn.cloud.tesla.com' },
  { name: 'eu', base: 'https://fleet-api.prd.eu.vn.cloud.tesla.com' },
]

export async function GET() {
  const out: Record<string, unknown> = {}
  try {
    const row = await getTokenRow()
    out.token_row = row ? {
      has_access_token: !!row.access_token,
      expires_at: row.expires_at,
      vehicle_id: row.vehicle_id,
      last_shift_state: row.last_shift_state,
    } : null

    const token = await getValidToken()
    out.got_valid_token = !!token
    if (!token) return NextResponse.json(out)

    // 尝试两个区域的 /vehicles 端点
    const vehiclesResults: Record<string, unknown> = {}
    for (const r of REGIONS) {
      try {
        const res = await fetch(`${r.base}/api/1/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const body = await res.text()
        vehiclesResults[r.name] = { status: res.status, body: body.substring(0, 800) }
      } catch (e) {
        vehiclesResults[r.name] = { error: String(e) }
      }
    }
    out.vehicles_by_region = vehiclesResults

    // 拉当前存的 vehicle_id 的 vehicle_data
    if (row?.vehicle_id) {
      const vdResults: Record<string, unknown> = {}
      for (const r of REGIONS) {
        try {
          const res = await fetch(
            `${r.base}/api/1/vehicles/${row.vehicle_id}/vehicle_data?endpoints=drive_state%3Bcharge_state`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          const body = await res.text()
          vdResults[r.name] = { status: res.status, body: body.substring(0, 800) }
        } catch (e) {
          vdResults[r.name] = { error: String(e) }
        }
      }
      out.vehicle_data_by_region = vdResults
    }

    const { count } = await supabase.from('v2_car_entries').select('*', { count: 'exact', head: true })
    out.car_entries_count = count

    return NextResponse.json(out, { status: 200 })
  } catch (e) {
    out.error = e instanceof Error ? e.message : String(e)
    return NextResponse.json(out, { status: 500 })
  }
}
