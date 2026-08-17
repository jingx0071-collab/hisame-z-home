export type ClosetComment = {
  id: string
  role: 'z' | 'h'
  text: string
  at: string
}

export type ClosetEntry = {
  id: string
  title: string
  date: string
  weekday: string
  description: string
  images: string[] | null
  comments: ClosetComment[] | null
  occasion: string | null
  items: string[] | null
  rating: number | null
  weather: string | null
  temp_c: number | null
  mode: 'log' | 'pick'
  pick_index: number | null
  pick_reason: string | null
  created_at?: string
}

export function firstDaddyLine(e: ClosetEntry): ClosetComment | null {
  const list = Array.isArray(e.comments) ? e.comments : []
  return list.find((c) => c.role === 'z') || null
}

export function tempLabel(e: Pick<ClosetEntry, 'weather' | 'temp_c'>): string {
  const bits: string[] = []
  if (e.weather) bits.push(e.weather)
  if (typeof e.temp_c === 'number') bits.push(`${e.temp_c}°`)
  return bits.join(' ')
}
