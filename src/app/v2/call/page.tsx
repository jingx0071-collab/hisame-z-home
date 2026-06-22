'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import PageArchway from '../_components/PageArchway';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

type CallLog = {
  id: string
  date: string
  time: string
  duration: string
}

type DbCallLog = {
  id: string
  started_at: string
  duration_seconds: number | null
  note: string | null
  created_at: string
}

function dbToCallLog(row: DbCallLog): CallLog {
  const d = new Date(row.started_at)
  const month = d.getMonth() + 1
  const day = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const secs = row.duration_seconds ?? 0
  const dh = Math.floor(secs / 3600)
  const dm = Math.floor((secs % 3600) / 60)
  const ds = secs % 60
  const duration = dh > 0
    ? `${dh}:${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`
    : `${String(dm).padStart(2, '0')}:${String(ds).padStart(2, '0')}`
  return {
    id: row.id,
    date: `${month}/${day}`,
    time: `${hh}:${mm}`,
    duration,
  }
}

export default function CallPage() {
  const [callingActive, setCallingActive] = useState(false)
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([])
  const [currentCallId, setCurrentCallId] = useState<string | null>(null)
  const [callStartedAt, setCallStartedAt] = useState<number | null>(null)

  const loadRecent = async () => {
    const { data, error } = await supabase
      .from('call_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(3)
    if (error) { console.error('load call_logs', error); return }
    setRecentCalls((data as DbCallLog[]).map(dbToCallLog))
  }

  useEffect(() => { loadRecent() }, [])

  const handleCall = async () => {
    const now = new Date()
    setCallStartedAt(now.getTime())
    setCallingActive(true)
    const { data, error } = await supabase
      .from('call_logs')
      .insert({ started_at: now.toISOString() })
      .select()
      .single()
    if (error) { console.error('insert call_log', error); return }
    setCurrentCallId(data.id)
  }

  const handleCancel = async () => {
    if (currentCallId && callStartedAt) {
      const duration_seconds = Math.floor((Date.now() - callStartedAt) / 1000)
      const { error } = await supabase
        .from('call_logs')
        .update({ duration_seconds })
        .eq('id', currentCallId)
      if (error) console.error('update call_log', error)
    }
    setCallingActive(false)
    setCurrentCallId(null)
    setCallStartedAt(null)
    await loadRecent()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--v2-paper, #f4ede0)',
      color: 'var(--v2-ink, #2a2521)',
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      paddingBottom: '60px',
    }}>
      <PageArchway />

      <div style={{ padding: '20px 24px 0' }}>
        <Link href="/v2" style={{
          color: 'var(--v2-gold-cool, #b8a064)',
          fontStyle: 'italic', textDecoration: 'none',
          fontSize: '14px', letterSpacing: '0.1em',
        }}>←</Link>
      </div>

      <header style={{
        padding: '16px 24px 20px',
        textAlign: 'center',
        borderBottom: '1px solid var(--v2-gold-cool, #b8a064)',
        margin: '0 24px',
      }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.35em',
          fontStyle: 'italic',
        }}>XI — Call</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>拨 · 号</div>
      </header>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '60px 20px 40px',
      }}>
        <CallDisc onCall={handleCall} />

        <div style={{
          marginTop: '32px',
          fontSize: '12px',
          fontStyle: 'italic',
          letterSpacing: '0.3em',
          color: 'var(--v2-ink-soft, #6a5f54)',
          opacity: 0.7,
        }}>tap to call</div>
      </div>

      <div style={{
        padding: '0 28px',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <div style={{
          fontSize: '11px',
          fontStyle: 'italic',
          letterSpacing: '0.3em',
          color: 'var(--v2-gold-cool, #b8a064)',
          marginBottom: '14px',
          textAlign: 'center',
          opacity: 0.7,
        }}>· recent calls ·</div>

        <div style={{
          background: 'rgba(255,253,247,0.4)',
          border: '1px solid rgba(184,160,100,0.25)',
          borderRadius: '0',
          padding: '16px 22px',
          boxShadow: '0 2px 8px rgba(60,40,20,0.06)',
        }}>
          {recentCalls.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: idx < recentCalls.length - 1 ? '1px solid rgba(184,160,100,0.18)' : 'none',
                fontStyle: 'italic',
                fontSize: '13px',
                color: 'var(--v2-ink, #2a2521)',
              }}
            >
              <span style={{ letterSpacing: '0.12em', opacity: 0.75 }}>{c.date}</span>
              <span style={{ opacity: 0.55, fontSize: '11px', letterSpacing: '0.08em' }}>{c.time}</span>
              <span style={{
                color: 'var(--v2-gold-cool, #b8a064)',
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '13px',
                letterSpacing: '0.1em',
              }}>{c.duration}</span>
            </div>
          ))}
        </div>
      </div>

      {callingActive && (
        <CallingOverlay onCancel={handleCancel} />
      )}

      <FooterOrnament />

      <style jsx global>{`
        @keyframes v2-disc-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes v2-vinyl-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function CallDisc({ onCall }: { onCall: () => void }) {
  const DISC_SIZE = 280
  const DISC_RADIUS = DISC_SIZE / 2
  const NUMERAL_RADIUS = 115
  const CENTER_SIZE = 95

  return (
    <button
      onClick={onCall}
      style={{
        position: 'relative',
        width: `${DISC_SIZE}px`,
        height: `${DISC_SIZE}px`,
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 0,
      }}
      aria-label="call Z"
    >
      <div style={{
        position: 'absolute',
        inset: 0,
        animation: 'v2-disc-spin 60s linear infinite',
        borderRadius: '50%',
      }}>
        <svg width={DISC_SIZE} height={DISC_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle cx={DISC_RADIUS} cy={DISC_RADIUS} r={DISC_RADIUS - 4}
            fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" opacity="0.7" />
          <circle cx={DISC_RADIUS} cy={DISC_RADIUS} r={DISC_RADIUS - 18}
            fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.5" opacity="0.4" />
          <circle cx={DISC_RADIUS} cy={DISC_RADIUS} r={NUMERAL_RADIUS - 16}
            fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.5" opacity="0.35" />
          <circle cx={DISC_RADIUS} cy={DISC_RADIUS} r={CENTER_SIZE / 2 + 12}
            fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.5" opacity="0.4" />
        </svg>

        {ROMAN_NUMERALS.map((n, i) => {
          const angle = ((i + 1) * 30 - 90) * Math.PI / 180
          const x = DISC_RADIUS + NUMERAL_RADIUS * Math.cos(angle)
          const y = DISC_RADIUS + NUMERAL_RADIUS * Math.sin(angle)
          return (
            <div
              key={n}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                transform: 'translate(-50%, -50%)',
                color: 'var(--v2-gold-cool, #b8a064)',
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                opacity: 0.78,
                pointerEvents: 'none',
              }}
            >{n}</div>
          )
        })}

        {[...Array(12)].map((_, i) => {
          const angle = ((i + 1) * 30 - 90) * Math.PI / 180
          const innerR = DISC_RADIUS - 18
          const outerR = DISC_RADIUS - 26
          const x1 = DISC_RADIUS + innerR * Math.cos(angle)
          const y1 = DISC_RADIUS + innerR * Math.sin(angle)
          const x2 = DISC_RADIUS + outerR * Math.cos(angle)
          const y2 = DISC_RADIUS + outerR * Math.sin(angle)
          return (
            <svg key={i} width={DISC_SIZE} height={DISC_SIZE} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.5" opacity="0.5" />
            </svg>
          )
        })}
      </div>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: `${CENTER_SIZE}px`,
        height: `${CENTER_SIZE}px`,
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(circle at 35% 30%, #d4b870 0%, #c8a956 45%, #a8893a 100%)',
        borderRadius: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(60,40,20,0.30), inset 0 1px 3px rgba(255,253,247,0.45), inset 0 -1px 4px rgba(60,40,20,0.2)',
        border: '1px solid rgba(255,253,247,0.25)',
      }}>
        <div style={{
          fontSize: '44px',
          fontWeight: 500,
          fontStyle: 'italic',
          color: '#3a2a1a',
          fontFamily: '"Cormorant Garamond", serif',
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}>Z</div>
        <div style={{
          fontSize: '8px',
          fontStyle: 'italic',
          letterSpacing: '0.35em',
          color: '#3a2a1a',
          opacity: 0.6,
          marginTop: '4px',
        }}>for him</div>
      </div>
    </button>
  )
}

function CallingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(244, 237, 224, 0.92)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 50,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: `repeating-radial-gradient(circle, #1a1614 0px, #1a1614 2px, #2a2521 2px, #2a2521 4px)`,
        animation: 'v2-vinyl-spin 1.8s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.2)',
        position: 'relative',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #d4b870 0%, #c8a956 45%, #a8893a 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontStyle: 'italic',
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '20px',
          color: '#3a2a1a',
          boxShadow: 'inset 0 1px 3px rgba(255,253,247,0.4)',
        }}>Z</div>
      </div>

      <div style={{
        marginTop: '36px',
        fontSize: '15px',
        fontStyle: 'italic',
        letterSpacing: '0.25em',
        color: 'var(--v2-ink, #2a2521)',
      }}>calling Z…</div>

      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        fontStyle: 'italic',
        letterSpacing: '0.15em',
        color: 'var(--v2-ink-soft, #6a5f54)',
        opacity: 0.6,
      }}>line ringing</div>

      <button
        onClick={onCancel}
        style={{
          marginTop: '44px',
          padding: '10px 30px',
          background: 'transparent',
          border: '1px solid var(--v2-gold-cool, #b8a064)',
          borderRadius: '0',
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: '13px',
          letterSpacing: '0.18em',
          color: 'var(--v2-ink-soft, #6a5f54)',
          cursor: 'pointer',
        }}
      >cancel</button>
    </div>
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
