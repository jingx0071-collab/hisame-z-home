'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway'
import { firstCarComment, fmtDuration, fmtBattery, type CarEntry } from '../../lib/carTypes'

const API_URL = '/api/v2/car'

const GOLD = 'var(--v2-gold-cool, #b8a064)'
const INK = 'var(--v2-ink, #2a2521)'
const INK_SOFT = 'var(--v2-ink-soft, #6a5f54)'
const PAPER = 'var(--v2-paper, #f4ede0)'
const CARD = 'var(--v2-magnolia, #f5ede0)'

function fmtTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function BatteryBar({ pct }: { pct: number }) {
  const color = pct > 40 ? '#6db36d' : pct > 20 ? '#c8a444' : '#c85a44'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      <span style={{
        display: 'inline-block', width: '28px', height: '10px',
        border: `1px solid ${color}`, borderRadius: '2px', position: 'relative',
        background: 'transparent',
      }}>
        <span style={{
          display: 'block', width: `${pct}%`, height: '100%',
          background: color, borderRadius: '1px',
        }} />
        <span style={{
          position: 'absolute', right: '-4px', top: '50%', transform: 'translateY(-50%)',
          width: '3px', height: '6px', background: color, borderRadius: '0 1px 1px 0',
        }} />
      </span>
      <span style={{ fontSize: '11px', color: INK_SOFT }}>{pct}%</span>
    </span>
  )
}

function CarCard({ entry }: { entry: CarEntry }) {
  const comment = firstCarComment(entry)
  const ongoing = entry.status === 'ongoing'

  return (
    <Link href={`/car/${entry.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        background: CARD,
        border: `1px solid ${ongoing ? GOLD : 'rgba(184,160,100,0.25)'}`,
        borderRadius: '10px',
        padding: '14px 16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
        boxShadow: ongoing ? `0 0 0 1px ${GOLD}22` : 'none',
      }}>
        {/* 顶行：时间 + 状态 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', color: INK_SOFT, letterSpacing: '0.05em' }}>
            {fmtTime(entry.created_at)}
          </span>
          <span style={{
            fontSize: '10px', letterSpacing: '0.15em',
            color: ongoing ? GOLD : INK_SOFT,
            fontStyle: 'italic',
          }}>
            {ongoing ? '行驶中' : '已完成'}
          </span>
        </div>

        {/* 路线 */}
        <div style={{ fontSize: '13px', color: INK, marginBottom: '6px', lineHeight: 1.5 }}>
          <span>{entry.start_location || '出发'}</span>
          <span style={{ color: GOLD, margin: '0 6px' }}>→</span>
          <span>{ongoing ? '…' : (entry.end_location || '到达')}</span>
        </div>

        {/* 数据行 */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: comment ? '10px' : '0' }}>
          {entry.start_battery != null && (
            <BatteryBar pct={entry.start_battery} />
          )}
          {entry.distance_km != null && (
            <span style={{ fontSize: '11px', color: INK_SOFT }}>{entry.distance_km} km</span>
          )}
          {entry.duration_min != null && (
            <span style={{ fontSize: '11px', color: INK_SOFT }}>{fmtDuration(entry.duration_min)}</span>
          )}
        </div>

        {/* 爸爸的第一条话 */}
        {comment && (
          <div style={{
            fontSize: '12px', color: INK_SOFT,
            fontStyle: 'italic', lineHeight: 1.6,
            borderTop: `1px solid ${GOLD}33`,
            paddingTop: '8px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {comment.text}
          </div>
        )}
      </div>
    </Link>
  )
}

export default function CarPage() {
  const [entries, setEntries] = useState<CarEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        if (!alive) return
        setEntries(Array.isArray(data.entries) ? data.entries : [])
      } catch (e) {
        console.error('car load failed', e)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const ongoing = entries.find((e) => e.status === 'ongoing')
  const completed = entries.filter((e) => e.status === 'completed')

  return (
    <div style={{
      minHeight: '100vh',
      background: PAPER,
      color: INK,
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      paddingBottom: '80px',
    }}>
      <PageArchway />

      <header style={{
        padding: '16px 24px 20px',
        textAlign: 'center',
        borderBottom: `1px solid ${GOLD}`,
        margin: '0 24px',
      }}>
        <div style={{ fontSize: '13px', color: GOLD, letterSpacing: '0.35em', fontStyle: 'italic' }}>
          XV &mdash; Drive
        </div>
        <div style={{ fontSize: '11px', color: INK_SOFT, letterSpacing: '0.4em', marginTop: '4px' }}>
          驾
        </div>
      </header>

      <div style={{ padding: '20px 16px 0', maxWidth: '560px', margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: INK_SOFT, fontStyle: 'italic', opacity: 0.6 }}>
            查行程记录……
          </div>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: INK_SOFT, fontStyle: 'italic', opacity: 0.72, lineHeight: 1.9 }}>
            还没有行程记录。<br />
            挂上 D 挡，爸爸就知道出发了。
          </div>
        ) : (
          <>
            {ongoing && (
              <>
                <div style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.3em', marginBottom: '10px' }}>
                  NOW · 行驶中
                </div>
                <CarCard entry={ongoing} />
                <div style={{ height: '20px' }} />
              </>
            )}

            {completed.length > 0 && (
              <>
                <div style={{ fontSize: '11px', color: INK_SOFT, letterSpacing: '0.3em', marginBottom: '10px' }}>
                  行程记录
                </div>
                {completed.map((e) => <CarCard key={e.id} entry={e} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
