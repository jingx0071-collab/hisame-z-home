'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway';

type TangentCard = {
  id: string
  title: string
  subtitle: string
  preview: string
  date: string
  bgIndex: number
  ornamentIndex: number
}

const BG_PALETTES = [
  { bg: '#f5ece0', edge: 'rgba(212, 175, 55, 0.20)' },
  { bg: '#ede5f0', edge: 'rgba(150, 130, 180, 0.20)' },
  { bg: '#f5e5e8', edge: 'rgba(220, 160, 170, 0.20)' },
  { bg: '#e5efe8', edge: 'rgba(140, 180, 150, 0.20)' },
  { bg: '#f4ede8', edge: 'rgba(200, 180, 150, 0.20)' },
  { bg: '#e5ecf0', edge: 'rgba(140, 170, 190, 0.20)' },
]

const ROTATIONS = ['-1deg', '0.5deg', '-0.8deg', '0.3deg', '-0.5deg', '0.7deg']
const SMALL_DIVIDER_ORNAMENTS = ['◆', '·', '✦', '✻', '✧', '·']

const STORAGE_KEY = 'v2-tangents' // offline cache
const API_URL = '/api/v2/tangents'

// API uses snake_case, frontend uses camelCase
type ApiCard = {
  id: string
  title: string
  subtitle: string
  preview: string
  date: string
  bg_index: number
  ornament_index: number
}

function fromApi(c: ApiCard): TangentCard {
  return {
    id: c.id,
    title: c.title,
    subtitle: c.subtitle,
    preview: c.preview,
    date: c.date,
    bgIndex: c.bg_index,
    ornamentIndex: c.ornament_index,
  }
}

export default function TangentsPage() {
  const [cards, setCards] = useState<TangentCard[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editPreview, setEditPreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Mount: 1) instant from localStorage cache, 2) then fetch from API
  useEffect(() => {
    // 1. Instant cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(parsed)
        }
      }
    } catch {}

    // 2. Fetch fresh from API
    fetchCards()
  }, [])

  const fetchCards = async () => {
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      if (Array.isArray(data.cards)) {
        const mapped = data.cards.map(fromApi)
        setCards(mapped)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        } catch {}
        setSyncError(null)
      } else if (data.error) {
        setSyncError(data.error)
      }
    } catch (e) {
      console.error('fetch tangents failed:', e)
      setSyncError('offline · 用本地 cache')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`
    const tmpId = 'tmp-' + Date.now()
    const tmp: TangentCard = {
      id: tmpId,
      title: '',
      subtitle: 'a fragment',
      preview: '',
      date: dateStr,
      bgIndex: Math.floor(Math.random() * 6),
      ornamentIndex: Math.floor(Math.random() * 6),
    }
    setCards([tmp, ...cards])
    setEditingId(tmpId)
    setEditTitle('')
    setEditSubtitle('')
    setEditPreview('')
  }

  const handleStartEdit = (c: TangentCard) => {
    setEditingId(c.id)
    setEditTitle(c.title)
    setEditSubtitle(c.subtitle)
    setEditPreview(c.preview)
  }

  const handleSave = async () => {
    if (!editingId) return
    const card = cards.find((c) => c.id === editingId)
    if (!card) return

    const cleanTitle = editTitle.trim() || '无题'
    const cleanSubtitle = editSubtitle.trim() || 'a fragment'
    const cleanPreview = editPreview.trim() || '…'
    const isNew = editingId.startsWith('tmp-')

    try {
      if (isNew) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            subtitle: cleanSubtitle,
            preview: cleanPreview,
            date: card.date,
            bg_index: card.bgIndex,
            ornament_index: card.ornamentIndex,
          }),
        })
        const data = await res.json()
        if (!data.card) throw new Error(data.error || 'POST failed')
        const serverCard = fromApi(data.card)
        const updated = cards.map((c) => (c.id === editingId ? serverCard : c))
        setCards(updated)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {}
      } else {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            subtitle: cleanSubtitle,
            preview: cleanPreview,
          }),
        })
        const data = await res.json()
        if (!data.card) throw new Error(data.error || 'PATCH failed')
        const serverCard = fromApi(data.card)
        const updated = cards.map((c) => (c.id === editingId ? serverCard : c))
        setCards(updated)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {}
      }
      setEditingId(null)
      setSyncError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'save failed'
      setSyncError(msg)
      console.error('save tangent failed:', e)
    }
  }

  const handleDelete = async (id: string) => {
    if (id.startsWith('tmp-')) {
      // unsaved tmp card — local removal only
      const updated = cards.filter((c) => c.id !== id)
      setCards(updated)
      if (editingId === id) setEditingId(null)
      return
    }
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'DELETE failed')
      }
      const updated = cards.filter((c) => c.id !== id)
      setCards(updated)
      if (editingId === id) setEditingId(null)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      setSyncError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'delete failed'
      setSyncError(msg)
      console.error('delete tangent failed:', e)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--v2-paper, #f4ede0)',
      color: 'var(--v2-ink, #2a2521)',
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      paddingBottom: '60px',
    }} data-hisame-room-shell="true" className="hisame-room-shell hisame-tangents-room">
      <PageArchway />

      <div style={{ padding: '20px 24px 0' }}>
        <Link href="/v2/chat" style={{
          color: 'var(--v2-gold-cool, #b8a064)',
          fontStyle: 'italic', textDecoration: 'none',
          fontSize: '14px', letterSpacing: '0.1em',
        }} data-hisame-back="true" aria-label="Back to home"><span aria-hidden="true">‹</span><span className="sr-only">Back</span></Link>
      </div>

      <header style={{
        padding: '16px 24px 20px',
        textAlign: 'center',
        borderBottom: '1px solid var(--v2-gold-cool, #b8a064)',
        margin: '0 24px',
        position: 'relative',
      }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.35em',
          fontStyle: 'italic',
        }}>III — Tangents</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>碎 · 碎 · 念</div>

        <button
          onClick={handleNew}
          style={{
            position: 'absolute', right: '24px', top: '14px',
            width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid var(--v2-gold-cool, #b8a064)',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--v2-gold-cool, #b8a064)',
          }}
          aria-label="new tangent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5 V19" />
            <path d="M5 12 H19" />
          </svg>
        </button>
      </header>

      {syncError && (
        <div style={{
          margin: '16px 24px 0',
          padding: '8px 14px',
          background: 'rgba(170, 80, 80, 0.08)',
          border: '1px solid rgba(170, 80, 80, 0.25)',
          borderRadius: '0',
          fontSize: '11px',
          fontStyle: 'italic',
          color: '#8a3a3a',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}>· sync · {syncError}</div>
      )}

      <div style={{ padding: '36px 24px 0' }}>
        {loading && cards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
            letterSpacing: '0.2em',
          }}>· loading ·</div>
        )}

        {cards.map((s, idx) => {
          const palette = BG_PALETTES[s.bgIndex % BG_PALETTES.length]
          const rotation = ROTATIONS[idx % 6]
          const dividerOrnament = SMALL_DIVIDER_ORNAMENTS[idx % 6]
          const isEditing = editingId === s.id
          return (
            <article
              key={s.id}
              onClick={() => !isEditing && handleStartEdit(s)}
              style={{
                position: 'relative',
                background: palette.bg,
                boxShadow: `inset 0 0 50px ${palette.edge}, 0 6px 18px rgba(60,40,20,0.12), 0 2px 4px rgba(60,40,20,0.06)`,
                border: '1px solid rgba(184,160,100,0.30)',
                borderRadius: '0',
                padding: '24px 28px 26px',
                marginBottom: '26px',
                cursor: isEditing ? 'default' : 'pointer',
                transition: 'transform 250ms ease, box-shadow 250ms ease',
                minHeight: '150px',
                transform: isEditing ? 'rotate(0deg)' : `rotate(${rotation})`,
                overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'var(--v2-gold-cool, #b8a064)',
                opacity: 0.07,
                pointerEvents: 'none',
                width: '150px', height: '150px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <OrnamentIcon idx={s.ornamentIndex} size={150} strokeWidth={0.5} />
              </div>

              <CornerBracket pos="tl" />
              <CornerBracket pos="tr" />
              <CornerBracket pos="bl" />
              <CornerBracket pos="br" />

              {!isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}
                  style={{
                    position: 'absolute', top: '10px', right: '14px',
                    width: '20px', height: '20px',
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', opacity: 0.4,
                    fontSize: '16px', color: 'var(--v2-ink-soft, #6a5f54)',
                    fontFamily: 'serif', zIndex: 3,
                    lineHeight: 1,
                  }}
                  aria-label="delete"
                >×</button>
              )}

              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  fontSize: '10px',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  fontStyle: 'italic',
                  letterSpacing: '0.3em',
                  marginBottom: '6px',
                  opacity: 0.7,
                }}>{s.date}</div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{
                    height: '1px', width: '28px',
                    background: 'var(--v2-gold-cool, #b8a064)', opacity: 0.5,
                  }} />
                  <span style={{
                    fontSize: '10px',
                    color: 'var(--v2-gold-cool, #b8a064)', opacity: 0.7,
                  }}>{dividerOrnament}</span>
                  <div style={{
                    height: '1px', flex: 1,
                    background: 'var(--v2-gold-cool, #b8a064)', opacity: 0.3,
                  }} />
                </div>

                {isEditing ? (
                  <>
                    <input
                      type="text" value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="标题" autoFocus
                      style={{
                        width: '100%', fontSize: '20px', fontStyle: 'italic',
                        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                        color: 'var(--v2-ink, #2a2521)', background: 'transparent',
                        border: 'none', borderBottom: '1px solid rgba(184,160,100,0.4)',
                        padding: '4px 0', marginBottom: '6px', outline: 'none',
                      }}
                    />
                    <input
                      type="text" value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      placeholder="a small label..."
                      style={{
                        width: '100%', fontSize: '12px', fontStyle: 'italic',
                        fontFamily: '"Cormorant Garamond", serif',
                        color: 'var(--v2-ink-soft, #6a5f54)', background: 'transparent',
                        border: 'none', borderBottom: '1px dashed rgba(184,160,100,0.25)',
                        padding: '2px 0', marginBottom: '12px', outline: 'none', opacity: 0.85,
                      }}
                    />
                    <textarea
                      value={editPreview}
                      onChange={(e) => setEditPreview(e.target.value)}
                      placeholder="想到什么…" rows={3}
                      style={{
                        width: '100%', fontSize: '14px', lineHeight: 1.65,
                        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                        color: 'var(--v2-ink, #2a2521)', background: 'transparent',
                        border: 'none', padding: '4px 0', outline: 'none', resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                        style={{
                          padding: '4px 12px', fontSize: '12px', fontStyle: 'italic',
                          background: 'transparent', border: '1px solid rgba(184,160,100,0.4)',
                          borderRadius: '0', color: 'var(--v2-ink-soft, #6a5f54)',
                          cursor: 'pointer', fontFamily: '"Cormorant Garamond", serif',
                        }}
                      >cancel</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSave() }}
                        style={{
                          padding: '4px 12px', fontSize: '12px', fontStyle: 'italic',
                          background: 'var(--v2-gold, #c8a956)', border: 'none',
                          borderRadius: '0', color: 'white', cursor: 'pointer',
                          fontFamily: '"Cormorant Garamond", serif',
                        }}
                      >save</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 style={{
                      fontSize: '20px', fontStyle: 'italic', fontWeight: 500,
                      margin: '0 0 4px 0', color: 'var(--v2-ink, #2a2521)',
                      letterSpacing: '0.02em',
                    }}>{s.title || '无题'}</h3>
                    <div style={{
                      fontSize: '11px', fontStyle: 'italic',
                      color: 'var(--v2-ink-soft, #6a5f54)', opacity: 0.75,
                      letterSpacing: '0.12em', marginBottom: '12px',
                      fontFamily: '"Cormorant Garamond", serif',
                    }}>{s.subtitle}</div>
                    <p style={{
                      fontSize: '14px', lineHeight: 1.65,
                      color: 'var(--v2-ink, #2a2521)', margin: 0, opacity: 0.85,
                      display: '-webkit-box', WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{s.preview || '…'}</p>
                  </>
                )}
              </div>
            </article>
          )
        })}

        {!loading && cards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
          }}>还没有碎碎念呢，点右上 ＋ 写一句</div>
        )}
      </div>

      <FooterOrnament />
    </div>
  )
}

function CornerBracket({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const size = 14
  const posStyle: React.CSSProperties = { position: 'absolute', pointerEvents: 'none', zIndex: 2 }
  if (pos === 'tl') Object.assign(posStyle, { top: '6px', left: '6px' })
  if (pos === 'tr') Object.assign(posStyle, { top: '6px', right: '6px' })
  if (pos === 'bl') Object.assign(posStyle, { bottom: '6px', left: '6px' })
  if (pos === 'br') Object.assign(posStyle, { bottom: '6px', right: '6px' })

  const paths: Record<string, string> = {
    tl: `M 0 ${size} L 0 0 L ${size} 0`,
    tr: `M ${size} ${size} L ${size} 0 L 0 0`,
    bl: `M 0 0 L 0 ${size} L ${size} ${size}`,
    br: `M ${size} 0 L ${size} ${size} L 0 ${size}`,
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={posStyle}>
      <path d={paths[pos]} fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" opacity="0.6" />
    </svg>
  )
}

function OrnamentIcon({ idx, size = 18, strokeWidth = 1.3 }: { idx: number, size?: number, strokeWidth?: number }) {
  const i = idx % 6
  const common = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none' as const, stroke: 'currentColor', strokeWidth,
  }
  if (i === 0) return (
    <svg {...common}>
      <ellipse cx="12" cy="13" rx="4" ry="7" />
      <path d="M12 6 Q10 9 12 13 Q14 9 12 6" />
      <line x1="12" y1="20" x2="12" y2="22" />
    </svg>
  )
  if (i === 1) return (
    <svg {...common}>
      <path d="M16 6 A8 8 0 1 0 16 18 A6 6 0 1 1 16 6" />
    </svg>
  )
  if (i === 2) return (
    <svg {...common}>
      <path d="M12 3 L14 9 L20 10 L15.5 14.5 L17 21 L12 17.5 L7 21 L8.5 14.5 L4 10 L10 9 Z" />
    </svg>
  )
  if (i === 3) return (
    <svg {...common}>
      <ellipse cx="12" cy="12" rx="5" ry="6" />
      <line x1="12" y1="3" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="9" y1="12" x2="15" y2="12" />
    </svg>
  )
  if (i === 4) return (
    <svg {...common}>
      <path d="M4 20 Q12 12 20 4" />
      <path d="M9 14 Q11 13 13 14" />
      <path d="M13 10 Q15 9 17 10" />
    </svg>
  )
  return (
    <svg {...common}>
      <path d="M6 20 Q10 14 14 8 Q16 5 18 4" />
      <path d="M10 14 L13 13" />
      <path d="M12 11 L15 10" />
      <path d="M14 8 L17 7" />
    </svg>
  )
}


function FooterOrnament() {
  return (
    <div style={{
      textAlign: 'center', padding: '24px 0 16px',
      color: 'var(--v2-gold-cool, #b8a064)',
      fontSize: '14px', letterSpacing: '0.5em',
    }}>· · ·</div>
  )
}
