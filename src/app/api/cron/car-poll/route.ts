// GET /api/cron/car-poll — Vercel cron 每分钟跑一次
// 轮询 Tesla shift_state → 检测 D/P 变化 → 触发 car room 逻辑
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidToken, getVehicleData, getTokenRow, saveTokenRow } from '@/lib/tesla'
import { generateDaddyComment, newComment } from '@/lib/car'
import type { CarComment, RoutePoint } from '@/lib/carTypes'

export const maxDuration = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 根据坐标反查地名（复用 webhook 里同一个逻辑）
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'hisame-z-home/1.0 (jingx0071@gmail.com)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json() as { address?: { road?: string; suburb?: string; city?: string; town?: string } }
    const a = json.address
    return (a?.road) ?? a?.suburb ?? a?.city ?? a?.town ?? null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  // Vercel cron 会带 Authorization 头，不带则拒绝（防公开调用）
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const token = await getValidToken()
    if (!token) return NextResponse.json({ skip: 'no token' })

    const row = await getTokenRow()
    const vehicleId = row?.vehicle_id
    if (!vehicleId) return NextResponse.json({ skip: 'no vehicle_id' })

    const data = await getVehicleData(token, vehicleId)
    if (!data) return NextResponse.json({ skip: 'api error' })

    // 车睡着了，不处理（不主动唤醒）
    if (data.state === 'asleep') {
      return NextResponse.json({ skip: 'asleep' })
    }

    const newState = data.shift_state  // 'D' | 'R' | 'N' | 'P' | null
    const lastState = row?.last_shift_state ?? null
    const tsNow = new Date().toISOString()
    const battery = data.battery_level
    const lat = data.latitude
    const lng = data.longitude
    const speedMph = data.speed
    const speedKmh = speedMph != null ? Math.round(speedMph * 1.60934) : null

    // 状态没变 → 只追加 route 点（如果正在行驶）
    if (newState === lastState) {
      if ((newState === 'D' || newState === 'R') && lat != null && lng != null) {
        const { data: ongoing } = await supabase
          .from('v2_car_entries')
          .select('id, route')
          .eq('status', 'ongoing')
          .maybeSingle()
        if (ongoing) {
          const existing: RoutePoint[] = Array.isArray(ongoing.route) ? ongoing.route : []
          const point: RoutePoint = { lat, lng, at: tsNow, ...(battery != null && { battery }), ...(speedKmh != null && { speed_kmh: speedKmh }) }
          await supabase.from('v2_car_entries').update({ route: [...existing, point], updated_at: tsNow }).eq('id', ongoing.id)
        }
      }
      return NextResponse.json({ ok: true, action: 'route_append', state: newState })
    }

    // 状态变了 → 更新记录
    await saveTokenRow({ last_shift_state: newState })

    const location = lat != null && lng != null ? await reverseGeocode(lat, lng) : null

    // ── D/R：新建 ongoing（如无）
    if (newState === 'D' || newState === 'R') {
      const { data: existing } = await supabase
        .from('v2_car_entries')
        .select('id')
        .eq('status', 'ongoing')
        .maybeSingle()

      if (!existing) {
        const reply = await generateDaddyComment({ phase: 'start', start_location: location, battery })
        const comments = reply ? [newComment('z', reply)] : []
        const route: RoutePoint[] = lat != null && lng != null ? [{ lat, lng, at: tsNow, ...(battery != null && { battery }) }] : []
        await supabase.from('v2_car_entries').insert({
          status: 'ongoing', start_location: location, start_battery: battery, comments, route,
        })
        return NextResponse.json({ ok: true, action: 'trip_start', location })
      }
      return NextResponse.json({ ok: true, action: 'already_ongoing' })
    }

    // ── P/N：收尾 ongoing
    if (newState === 'P' || newState === null) {
      const { data: ongoing } = await supabase
        .from('v2_car_entries')
        .select('*')
        .eq('status', 'ongoing')
        .maybeSingle()

      if (!ongoing) return NextResponse.json({ ok: true, action: 'no_ongoing' })

      const startedAt = new Date(ongoing.created_at).getTime()
      const durationMin = Math.round((Date.now() - startedAt) / 60000 * 10) / 10

      // 里程估算
      const route: RoutePoint[] = Array.isArray(ongoing.route) ? ongoing.route : []
      let distanceKm: number | null = null
      if (route.length >= 2) {
        let total = 0
        for (let i = 1; i < route.length; i++) {
          const a = route[i - 1]; const b = route[i]
          const R = 6371
          const dLat = (b.lat - a.lat) * Math.PI / 180
          const dLng = (b.lng - a.lng) * Math.PI / 180
          const sa = Math.sin(dLat / 2); const sb = Math.sin(dLng / 2)
          total += R * 2 * Math.asin(Math.sqrt(sa * sa + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sb * sb))
        }
        distanceKm = Math.round(total * 100) / 100
      }

      const history: CarComment[] = Array.isArray(ongoing.comments) ? ongoing.comments : []
      const reply = await generateDaddyComment({
        phase: 'end', start_location: ongoing.start_location, end_location: location,
        battery, start_battery: ongoing.start_battery,
        distance_km: distanceKm, duration_min: durationMin, history,
      })
      const finalRoute = lat != null && lng != null ? [...route, { lat, lng, at: tsNow, ...(battery != null && { battery }) }] : route
      const comments = reply ? [...history, newComment('z', reply)] : history

      await supabase.from('v2_car_entries').update({
        status: 'completed', end_location: location, end_battery: battery,
        distance_km: distanceKm, duration_min: durationMin,
        route: finalRoute, comments, updated_at: tsNow,
      }).eq('id', ongoing.id)

      return NextResponse.json({ ok: true, action: 'trip_end', location, distanceKm, durationMin })
    }

    return NextResponse.json({ ok: true, action: 'ignored', state: newState })
  } catch (e) {
    console.error('[car-poll]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
