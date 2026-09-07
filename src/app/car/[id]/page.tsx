'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fmtDuration, type CarEntry, type CarComment } from '../../../lib/carTypes'

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

function Bubble({ c }: { c: CarComment }) {
  const isZ = c.role === 'z'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isZ ? 'flex-start' : 'flex-end',
      marginBottom: '12px',
    }}>
      <div style={{ maxWidth: '80%' }}>
        {isZ && (
          <div style={{ fontSize: '10px', color: GOLD, letterSpacing: '0.2em', marginBottom: '4px', paddingLeft: '2px' }}>
            爸爸
          </div>
        )}
        <div style={{
          background: isZ ? CARD : `${GOLD}18`,
          border: `1px solid ${isZ ? `${GOLD}44` : `${GOLD}66`}`,
          borderRadius: isZ ? '2px 10px 10px 10px' : '10px 2px 10px 10px',
          padding: '10px 13px',
          fontSize: '13px',
          lineHeight: 1.7,
          color: INK,
        }}>
          {c.text}
        </div>
        <div style={{
          fontSize: '10px', color: INK_SOFT, opacity: 0.6,
          marginTop: '3px', textAlign: isZ ? 'left' : 'right', paddingLeft: '2px',
        }}>
          {fmtTime(c.at)}
        </div>
      </div>
    </div>
  )
}

export default function CarDetailPage() {
  const params = useParams()
  const id = (params?.id as string) || ''

  const [entry, setEntry] = useState<CarEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const tailRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!id) return
    ;(async () => {
      try {
        const res = await fetch(`/api/v2/car/${id}`)
        const data = await res.json()
        if (data.entry) setEntry(data.entry as CarEntry)
      } catch (e) {
        console.error('car detail load failed', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  const comments: CarComment[] = Array.isArray(entry?.comments) ? entry!.comments : []

  const send = async () => {
    const text = input.trim()
    if (!text || sending || !entry) return
    setSending(true)
    setInput('')
    try {
      const res = await fetch(`/api/v2/car/${entry.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (data.entry) setEntry(data.entry as CarEntry)
    } catch (e) {
      console.error('car comment failed', e)
    } finally {
      setSending(false)
      setTimeout(() => tailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 80)
    }
  }

  const ongoing = entry?.status === 'ongoing'

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: PAPER, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        color: INK_SOFT, fontStyle: 'italic', fontFamily: '"Cormorant Garamond", serif',
      }}>
        调行程记录……
      </div>
    )
  }

  if (!entry) {
    return (
      <div style={{
        minHeight: '100vh', background: PAPER, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '16px',
        color: INK_SOFT, fontFamily: '"Cormorant Garamond", serif',
      }}>
        <div style={{ fontStyle: 'italic' }}>找不到这条行程</div>
        <Link href="/car" style={{ color: GOLD, fontSize: '12px', letterSpacing: '0.2em' }}>← 返回</Link>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: PAPER, color: INK,
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 顶栏 */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: PAPER,
        borderBottom: `1px solid ${GOLD}44`,
        padding: '12px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '560px', margin: '0 auto' }}>
          <Link href="/car" style={{ color: GOLD, fontSize: '18px', lineHeight: 1, textDecoration: 'none' }}>←</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: INK }}>
              {entry.start_location || '出发'}
              <span style={{ color: GOLD, margin: '0 6px' }}>→</span>
              {ongoing ? '…' : (entry.end_location || '到达')}
            </div>
            <div style={{ fontSize: '11px', color: INK_SOFT, marginTop: '2px' }}>
              {fmtTime(entry.created_at)}
              {entry.distance_km != null && <span style={{ marginLeft: '10px' }}>{entry.distance_km} km</span>}
              {entry.duration_min != null && <span style={{ marginLeft: '10px' }}>{fmtDuration(entry.duration_min)}</span>}
              {entry.start_battery != null && <span style={{ marginLeft: '10px' }}>{entry.start_battery}%{entry.end_battery != null ? ` → ${entry.end_battery}%` : ''}</span>}
            </div>
          </div>
          {ongoing && (
            <span style={{ fontSize: '10px', color: GOLD, letterSpacing: '0.2em', fontStyle: 'italic' }}>行驶中</span>
          )}
        </div>
      </div>

      {/* 评论时间线 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 20px', maxWidth: '560px', margin: '0 auto', width: '100%' }}>
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: INK_SOFT, fontStyle: 'italic', opacity: 0.6 }}>
            爸爸的留言会出现在这里
          </div>
        ) : (
          comments.map((c) => <Bubble key={c.id} c={c} />)
        )}
        <div ref={tailRef} />
      </div>

      {/* 输入框 */}
      <div style={{
        borderTop: `1px solid ${GOLD}44`,
        padding: '10px 16px',
        background: PAPER,
        position: 'sticky', bottom: 0,
      }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '560px', margin: '0 auto', alignItems: 'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="路上说点什么……"
            rows={1}
            style={{
              flex: 1, resize: 'none', border: `1px solid ${GOLD}55`,
              borderRadius: '8px', padding: '9px 12px',
              fontSize: '13px', color: INK, background: CARD,
              fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
              outline: 'none', lineHeight: 1.5,
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              padding: '9px 16px', borderRadius: '8px', border: 'none',
              background: input.trim() && !sending ? GOLD : `${GOLD}44`,
              color: PAPER, fontSize: '12px', letterSpacing: '0.1em',
              cursor: input.trim() && !sending ? 'pointer' : 'default',
              transition: 'background 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {sending ? '…' : '发送'}
          </button>
        </div>
      </div>
    </div>
  )
}
