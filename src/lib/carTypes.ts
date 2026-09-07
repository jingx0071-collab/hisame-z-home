export type CarComment = {
  id: string
  role: 'z' | 'h'
  text: string
  at: string
}

export type RoutePoint = {
  lat: number
  lng: number
  at: string
  battery?: number
  speed_kmh?: number
}

export type CarEntry = {
  id: string
  status: 'ongoing' | 'completed'
  start_location: string | null
  end_location: string | null
  start_battery: number | null
  end_battery: number | null
  distance_km: number | null
  duration_min: number | null
  route: RoutePoint[]
  comments: CarComment[]
  created_at: string
  updated_at?: string
}

// 卡片上显示的那条爸爸的话
export function firstCarComment(e: CarEntry): CarComment | null {
  const list = Array.isArray(e.comments) ? e.comments : []
  return list.find((c) => c.role === 'z') ?? null
}

export function fmtDuration(min: number | null): string {
  if (min == null) return ''
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export function fmtBattery(pct: number | null): string {
  if (pct == null) return ''
  return `${pct}%`
}
