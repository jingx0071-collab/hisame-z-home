'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { firstComment, type FeastEntry, type FeastComment } from '../../../lib/feastTypes'

const GOLD = 'var(--v2-gold-cool, #b8a064)'
const INK = 'var(--v2-ink, #2a2521)'
const INK_SOFT = 'var(--v2-ink-soft, #6a5f54)'
const PAPER = 'var(--v2-paper, #f4ede0)'
const CARD = 'var(--v2-magnolia, #f5ede0)'

function fmtTime(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function FeastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = (params?.id as string) || ''

  const [entry, setEntry] = useState<FeastEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [slide, setSlide] = useState(0)
  const railRef = useRef<HTMLDivElement>(null)
  const tailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fetch(`/api/v2/feast/${id}`)
        const data = await res.json()
        if (data.entry) setEntry(data.entry as FeastEntry)
      } catch (e) {
        console.error('feast detail load failed', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const images = Array.isArray(entry?.images) ? entry!.images! : []
  const comments: FeastComment[] = Array.isArray(entry?.comments) ? entry!.comments! : []
  const legacy = entry && comments.length === 0 ? firstComment(entry) : null
  const thread: FeastComment[] = comments.length ? comments : (legacy ? [legacy] : [])

  const onRailScroll = () => {
    const el = railRef.current
    if (!el || !el.clientWidth) return
    setSlide(Math.round(el.scrollLeft / el.clientWidth))
  }

  const send = async () => {
    const text = input.trim()
    if (!text || sending || !entry) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/v2/feast/${entry.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.entry) setEntry(data.entry as FeastEntry)
    } catch (e) {
      console.error('feast comment failed', e)
    } finally {
      setSending(false)
      setTimeout(() => tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
    }
  }

  const remove = async () => {
    if (!entry) return
    try {
      await fetch(`/api/v2/feast/${entry.id}`, { method: 'DELETE' })
      router.push('/feast')
    } catch (e) {
      console.error('feast delete failed', e)
    }
  }

  if (loading) {
    return (
      <div style={shellStyle}>
        <div style={{
          padding: '90px 20px', textAlign: 'center',
          color: INK_SOFT, fontStyle: 'italic', opacity: 0.6,
        }}>翻到那一页……</div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div style={shellStyle}>
        <div style={{
          padding: '90px 20px', textAlign: 'center',
          color: INK_SOFT, fontStyle: 'italic', opacity: 0.7, lineHeight: 2,
        }}>
          这一页找不着了。
          <br />
          <Link href="/feast" style={{ color: GOLD, textDecoration: 'none' }}>回食记</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'calc(env(safe-area-inset-top) + 10px) 16px 10px',
        background: PAPER,
        borderBottom: '1px solid rgba(184,160,100,0.28)',
      }}>
        <Link href="/feast" aria-label="回食记" style={{ color: GOLD, textDecoration: 'none', fontSize: '18px', lineHeight: 1 }}>‹</Link>
        <div style={{
          fontSize: '10px', color: GOLD, fontStyle: 'italic', letterSpacing: '0.3em',
        }}>· 食记 ·</div>
        <button
          onClick={remove}
          aria-label="撕掉这一页"
          style={{
            border: 'none', background: 'transparent', color: INK_SOFT,
            opacity: 0.55, fontSize: '11px', fontStyle: 'italic',
            letterSpacing: '0.14em', cursor: 'pointer',
          }}
        >撕掉</button>
      </div>

      {images.length > 0 && (
        <div style={{ position: 'relative', background: '#e9e0d0' }}>
          <div
            ref={railRef}
            onScroll={onRailScroll}
            style={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {images.map((url) => (
              <img
                key={url}
                src={url}
                alt=""
                style={{
                  width: '100%', flexShrink: 0,
                  scrollSnapAlign: 'center',
                  display: 'block',
                  maxHeight: '76vh',
                  objectFit: 'contain',
                  background: '#1c1712',
                }}
              />
            ))}
          </div>

          {images.length > 1 && (
            <div style={{
              position: 'absolute', bottom: '10px', left: 0, right: 0,
              display: 'flex', justifyContent: 'center', gap: '6px',
            }}>
              {images.map((u, i) => (
                <span key={u} style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: i === slide ? '#f4ede0' : 'rgba(244,237,224,0.42)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }} />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '18px 20px 0', maxWidth: '620px', margin: '0 auto' }}>
        <h1 style={{
          fontSize: '20px', fontStyle: 'italic', fontWeight: 500,
          margin: '0 0 6px 0', color: 'var(--v2-gold, #c8a956)', lineHeight: 1.35,
        }}>{entry.title || 'Untitled'}</h1>

        <div style={{
          fontSize: '10.5px', fontStyle: 'italic', color: INK_SOFT,
          opacity: 0.7, letterSpacing: '0.16em', marginBottom: '10px',
        }}>
          {entry.date} · {entry.weekday}
          {entry.place ? ` · ${entry.place}` : ''}
        </div>

        {typeof entry.rating === 'number' && entry.rating > 0 && (
          <div style={{ fontSize: '13px', color: GOLD, letterSpacing: '0.28em', marginBottom: '12px' }}>
            {'✦'.repeat(entry.rating)}<span style={{ opacity: 0.28 }}>{'✦'.repeat(5 - entry.rating)}</span>
          </div>
        )}

        {entry.description && (
          <p style={{
            fontSize: '14.5px', lineHeight: 1.85, color: INK,
            margin: '0 0 20px 0', whiteSpace: 'pre-wrap',
            fontFamily: '"Noto Serif SC", serif',
          }}>{entry.description}</p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 14px' }}>
          <div style={{ flex: 1, height: '1px', background: GOLD, opacity: 0.35 }} />
          <span style={{
            padding: '0 12px', color: GOLD, fontSize: '9.5px',
            fontStyle: 'italic', letterSpacing: '0.3em',
          }}>留言</span>
          <div style={{ flex: 1, height: '1px', background: GOLD, opacity: 0.35 }} />
        </div>

        {thread.length === 0 && !sending && (
          <div style={{
            textAlign: 'center', padding: '18px 10px 24px',
            color: INK_SOFT, opacity: 0.6, fontStyle: 'italic', fontSize: '12.5px',
          }}>爸爸还没看到这条</div>
        )}

        {thread.map((c) => <CommentRow key={c.id} c={c} />)}

        {sending && (
          <div style={{
            display: 'flex', gap: '10px', marginBottom: '16px',
            color: INK_SOFT, fontStyle: 'italic', fontSize: '12.5px', opacity: 0.7,
          }}>
            <Avatar role="z" />
            <div style={{ paddingTop: '3px' }}>爸爸在看……</div>
          </div>
        )}

        <div ref={tailRef} style={{ height: '90px' }} />
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: PAPER,
        borderTop: `1px solid ${GOLD}`,
        padding: '10px 14px calc(env(safe-area-inset-bottom) + 10px)',
        display: 'flex', gap: '8px', alignItems: 'center',
        zIndex: 30,
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send() }}
          placeholder="跟爸爸说点什么……"
          style={{
            flex: 1,
            background: CARD,
            border: '1px solid rgba(184,160,100,0.4)',
            color: INK,
            padding: '10px 12px',
            fontSize: '14px',
            fontFamily: '"Noto Serif SC", "Cormorant Garamond", serif',
            outline: 'none',
            borderRadius: 0,
          }}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${GOLD}`,
            color: GOLD,
            fontSize: '12.5px',
            fontStyle: 'italic',
            letterSpacing: '0.16em',
            cursor: sending ? 'wait' : 'pointer',
            opacity: sending || !input.trim() ? 0.45 : 1,
            fontFamily: '"Cormorant Garamond", serif',
            borderRadius: 0,
            whiteSpace: 'nowrap',
          }}
        >说</button>
      </div>
    </div>
  )
}

function CommentRow({ c }: { c: FeastComment }) {
  const isZ = c.role === 'z'
  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
      <Avatar role={c.role} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '10px', color: GOLD, letterSpacing: '0.2em',
          fontStyle: 'italic', marginBottom: '3px', opacity: 0.85,
        }}>
          {isZ ? '爸爸' : 'Hisame'}
          {c.at && <span style={{ color: INK_SOFT, opacity: 0.55, marginLeft: '8px' }}>{fmtTime(c.at)}</span>}
        </div>
        <p style={{
          fontSize: '13.5px',
          lineHeight: 1.78,
          color: INK,
          opacity: isZ ? 0.92 : 0.86,
          margin: 0,
          fontStyle: isZ ? 'normal' : 'italic',
          whiteSpace: 'pre-wrap',
          fontFamily: '"Noto Serif SC", "Cormorant Garamond", serif',
        }}>{c.text}</p>
      </div>
    </div>
  )
}

function Avatar({ role }: { role: 'z' | 'h' }) {
  return (
    <div style={{
      width: '28px', height: '28px', flexShrink: 0,
      borderRadius: '50%',
      border: `1px solid ${GOLD}`,
      background: role === 'z' ? GOLD : 'transparent',
      color: role === 'z' ? PAPER : GOLD,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '11px', fontStyle: 'italic',
      fontFamily: '"Cormorant Garamond", serif',
    }}>{role === 'z' ? 'Z' : 'H'}</div>
  )
}

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: PAPER,
  color: INK,
  fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
  paddingBottom: '20px',
}
