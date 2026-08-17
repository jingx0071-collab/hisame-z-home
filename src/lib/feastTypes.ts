export type FeastComment = {
  id: string
  role: 'z' | 'h'
  text: string
  at: string
}

export type FeastEntry = {
  id: string
  title: string
  emoji: string
  gradient: string
  date: string
  weekday: string
  description: string
  daddy_reply: string | null
  images: string[] | null
  comments: FeastComment[] | null
  place: string | null
  rating: number | null
  created_at?: string
}

// 卡片上显示的那条爸爸的话：优先 comments 里第一条 z，退回旧的 daddy_reply
export function firstComment(e: FeastEntry): FeastComment | null {
  const list = Array.isArray(e.comments) ? e.comments : []
  const z = list.find((c) => c.role === 'z')
  if (z) return z
  if (e.daddy_reply) return { id: 'legacy', role: 'z', text: e.daddy_reply, at: '' }
  return null
}
