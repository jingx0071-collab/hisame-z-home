import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateDaddyComment, newComment } from '@/lib/car'
import type { CarComment, RoutePoint } from '@/lib/carTypes'

// ━━ Teslemetry Webhook
//
// 配置方法：
//   Teslemetry Dashboard → Fleet → Webhooks → 添加 URL: https://<domain>/api/car/webhook
//   选择推送字段：shift_state, battery_level, latitude, longitude, speed, odometer
//   Secret → 填进 TESLEMETRY_WEBHOOK_SECRET 环境变量
//
// Payload 格式（Teslemetry 推过来的）：
//   { vin, data: { shift_state, battery_level, latitude, longitude, speed, ... }, timestamp }
//
// shift_state: 'D'|'R'|'N'|'P'|null
//   D/R → 挂上驾驶挡 → 如果没有 ongoing 就新建
//   P   → 停车 → 把 ongoing 标记 completed，写收尾数据
//
// 如果 Teslemetry 不支持 webhook 推 shift_state，
// 改用 api/cron/car-poll/route.ts 轮询（每分钟 GET /api/v1/vehicles/{vin}/state）

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WEBHOOK_SECRET = process.env.TESLEMETRY_WEBHOOK_SECRET || ''

function verifySecret(req: NextRequest): boolean {
  if (!WEBHOOK_SECRET) return true // 没配就先放行（dev 阶段）
  const sig = req.headers.get('x-teslemetry-signature') || req.headers.get('x-webhook-secret') || ''
  return sig === WEBHOOK_SECRET
}

// 根据坐标反查地名（用 Nominatim，免费，限速 1rps）
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'hisame-z-home/1.0 (jingx0071@gmail.com)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json() as { display_name?: string; address?: { road?: string; suburb?: string; city?: string; town?: string } }
    const a = json.address
    if (!a) return json.display_name?.split(',')[0] || null
    return (a.road ? `${a.road}` : null) ?? a.suburb ?? a.city ?? a.town ?? null
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifySecret(req)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = (body.data || body) as Record<string, any>

    const shiftState: string | null = d.shift_state ?? null
    const battery: number | null = d.battery_level != null ? Math.round(Number(d.battery_level)) : null
    const lat: number | null = d.latitude != null ? Number(d.latitude) : null
    const lng: number | null = d.longitude != null ? Number(d.longitude) : null
    const speedKmh: number | null = d.speed != null ? Number(d.speed) : null
    const tsNow = new Date().toISOString()

    // 当前地名（异步，允许失败）
    const location = lat != null && lng != null ? await reverseGeocode(lat, lng) : null

    // ── D/R 挂驾驶挡 → 新建 ongoing（如果已有就跳过）
    if (shiftState === 'D' || shiftState === 'R') {
      const { data: existing } = await supabase
        .from('v2_car_entries')
        .select('id')
        .eq('status', 'ongoing')
        .maybeSingle()

      if (!existing) {
        const reply = await generateDaddyComment({
          phase: 'start',
          start_location: location,
          battery,
        })
        const comments = reply ? [newComment('z', reply)] : []

        const routePoint: RoutePoint = {
          lat: lat ?? 0, lng: lng ?? 0, at: tsNow,
          ...(battery != null && { battery }),
          ...(speedKmh != null && { speed_kmh: speedKmh }),
        }

        await supabase.from('v2_car_entries').insert({
          status: 'ongoing',
          start_location: location,
          start_battery: battery,
          comments,
          route: lat != null && lng != null ? [routePoint] : [],
        })
      } else {
        // 已有 ongoing → 追加 route 点
        if (lat != null && lng != null) {
          const { data: cur } = await supabase
            .from('v2_car_entries')
            .select('route')
            .eq('id', existing.id)
            .single()
          const existing_route: RoutePoint[] = Array.isArray(cur?.route) ? cur!.route : []
          const point: RoutePoint = {
            lat, lng, at: tsNow,
            ...(battery != null && { battery }),
            ...(speedKmh != null && { speed_kmh: speedKmh }),
          }
          await supabase
            .from('v2_car_entries')
            .update({ route: [...existing_route, point], updated_at: tsNow })
            .eq('id', existing.id)
        }
      }

      return NextResponse.json({ ok: true, action: 'driving' })
    }

    // ── P 挂停车挡 → 收尾 ongoing
    if (shiftState === 'P') {
      const { data: ongoing } = await supabase
        .from('v2_car_entries')
        .select('*')
        .eq('status', 'ongoing')
        .maybeSingle()

      if (!ongoing) return NextResponse.json({ ok: true, action: 'no_ongoing' })

      // 算行驶时长和里程
      const startedAt = new Date(ongoing.created_at).getTime()
      const durationMin = Math.round((Date.now() - startedAt) / 60000 * 10) / 10

      // 里程：从 route 点估算（直线距离累加，粗略）
      let distanceKm: number | null = null
      const route: RoutePoint[] = Array.isArray(ongoing.route) ? ongoing.route : []
      if (route.length >= 2) {
        let total = 0
        for (let i = 1; i < route.length; i++) {
          const a = route[i - 1]; const b = route[i]
          const R = 6371
          const dLat = (b.lat - a.lat) * Math.PI / 180
          const dLng = (b.lng - a.lng) * Math.PI / 180
          const sinA = Math.sin(dLat / 2)
          const sinB = Math.sin(dLng / 2)
          const c = 2 * Math.asin(Math.sqrt(sinA * sinA + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinB * sinB))
          total += R * c
        }
        distanceKm = Math.round(total * 100) / 100
      }

      // 到达留言
      const history: CarComment[] = Array.isArray(ongoing.comments) ? ongoing.comments : []
      const reply = await generateDaddyComment({
        phase: 'end',
        start_location: ongoing.start_location,
        end_location: location,
        battery,
        start_battery: ongoing.start_battery,
        distance_km: distanceKm,
        duration_min: durationMin,
        history,
      })
      const comments = reply ? [...history, newComment('z', reply)] : history

      // 最后一个 route 点
      const finalRoute = lat != null && lng != null
        ? [...route, { lat, lng, at: tsNow, ...(battery != null && { battery }) }]
        : route

      await supabase.from('v2_car_entries').update({
        status: 'completed',
        end_location: location,
        end_battery: battery,
        distance_km: distanceKm,
        duration_min: durationMin,
        route: finalRoute,
        comments,
        updated_at: tsNow,
      }).eq('id', ongoing.id)

      return NextResponse.json({ ok: true, action: 'completed' })
    }

    // N 档或其他 → 忽略
    return NextResponse.json({ ok: true, action: 'ignored', shift_state: shiftState })
  } catch (e) {
    console.error('[car/webhook]', e)
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
