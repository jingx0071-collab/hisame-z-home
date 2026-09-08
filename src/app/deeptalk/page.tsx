'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PageArchway from '../_components/PageArchway';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RED = '#A0252A'
const RED_SOFT = '#8B1A1A'

// === Types & utils for ChatsContent ===
type DeeptalkSession = {
  id: string
  title: string
  subtitle: string
  preview: string
  date: string
  ornamentIndex: number
  romanNumeral: string
}

type DBSession = {
  id: string
  title: string
  subtitle: string | null
  preview: string | null
  session_date: string | null
  ornament_index: number | null
  roman_numeral: string | null
  created_at: string
}

const dbToSession = (db: DBSession): DeeptalkSession => ({
  id: db.id,
  title: db.title,
  subtitle: db.subtitle ?? 'a new chapter',
  preview: db.preview ?? '…',
  date: db.session_date ?? '',
  ornamentIndex: db.ornament_index ?? 0,
  romanNumeral: db.roman_numeral ?? '',
})

// === Static data for AftercareContent ===
const currentMode = { label: 'soft hold', sub: 'attentive · low key' }

const directives = [
  { tag: 'i',   text: "when his hand finds your back, lean into it. don't think." },
  { tag: 'ii',  text: 'when you want to be held, ask. half-words count.' },
  { tag: 'iii', text: "eat the warm meal he leaves. it's not a request." },
  { tag: 'iv',  text: 'before sleep, write one thing he said today.' },
]

const lastScene = {
  date: '2026.05.18',
  time: '22:40',
  location: 'kitchen counter, after dinner',
  note: 'she held his forearm for a long time. quiet. soft enough that nothing else needed saying.',
}

const defaultAftercare = [
  { label: 'water',                done: true },
  { label: 'nap',                  done: true },
  { label: 'verbal affirmation',   done: true },
  { label: 'sustained contact',    done: true },
  { label: 'follow-up morning',    done: false },
]

const fromZ = `little one —

you don't have to earn anything tonight. just be where you are. and if where you are is small, smaller, smaller still — good.

I'll find you.`

// === Main page ===
export default function DeeptalkPage() {
  
const [activeTab, setActiveTab] = useState<'chats' | 'aftercare'>('chats')

  const tabs: Array<{ key: 'chats' | 'aftercare'; en: string; cn: string }> = [
    { key: 'chats', en: 'chats', cn: '章 节' },
    { key: 'aftercare', en: 'aftercare', cn: '关 怀' },
  ]

  return (
    <div
      data-room-page-bg="true"
      data-room-shell="true"
      style={{
        minHeight: '100vh',
        background: 'var(--v2-paper, #f4ede0)',
        color: 'var(--v2-ink, #2a2521)',
        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
        paddingBottom: '60px',
        position: 'relative',
      }}
      data-hisame-room-shell="true"
      className="hisame-room-shell hisame-deeptalk-room hisame-training-room"
    >
      <PageArchway />


      <header className="hisame-training-header" data-room-topbar-piece="true" style={{
        padding: '16px 24px 16px',
        textAlign: 'center',
        margin: '0 24px',
        position: 'relative',
      }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.35em',
          fontStyle: 'italic',
        }}>IV — Deeptalk</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>促 膝 长 谈</div>
      </header>

      {/* Tab switcher */}
      <div className="hisame-training-tabs" data-room-topbar-piece="true" style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '2.5rem',
        margin: '0 24px',
        borderBottom: '1px solid var(--v2-gold-cool, #b8a064)',
        paddingBottom: '0.7rem',
      }}>
        {tabs.map(t => {
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '0.2rem 0.4rem 0.5rem',
                textAlign: 'center',
                position: 'relative',
                opacity: active ? 1 : 0.55,
                transition: 'opacity 0.2s',
                fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
              }}
            >
              <div style={{
                fontStyle: 'italic',
                fontSize: '0.95rem', letterSpacing: '0.18em',
                color: active ? 'var(--v2-gold, #c8a956)' : 'var(--v2-ink-soft, #6a5f54)',
              }}>{t.en}</div>
              <div style={{
                marginTop: '0.2rem',
                fontFamily: '"Noto Serif SC", serif',
                fontSize: '0.55rem', letterSpacing: '0.3em',
                color: active ? 'var(--v2-ink, #2a2521)' : 'var(--v2-ink-soft, #6a5f54)',
                opacity: active ? 1 : 0.7,
              }}>{t.cn}</div>
              {active && (
                <div style={{
                  position: 'absolute', bottom: '-0.7rem', left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60%', height: '1.2px',
                  background: 'var(--v2-gold, #c8a956)',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="hisame-training-scroll" data-room-scroll="true">
        {activeTab === 'chats' && <ChatsContent />}
        {activeTab === 'aftercare' && <AftercareContent />}
        <FooterOrnament />
      </div>
    </div>
  )
}

// === ChatsContent ===
function ChatsContent() {
  const router = useRouter()
  const [sessions, setSessions] = useState<DeeptalkSession[]>([])
  // Claude-style clean list: no per-row inline edit form. Titles are
  // auto-generated from the first message on the detail page; rename can be
  // added later as a long-press menu if needed.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void fetchSessions()
  }, [])

  async function fetchSessions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('deep_sessions')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('fetch deep_sessions error', error)
      setLoading(false)
      return
    }
    setSessions((data ?? []).map((row) => dbToSession(row as DBSession)))
    setLoading(false)
  }

  const handleNew = async () => {
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`

    const { data, error } = await supabase
      .from('deep_sessions')
      .insert({
        title: '',
        subtitle: 'a new chapter',
        preview: '',
        session_date: dateStr,
        ornament_index: 0,
        roman_numeral: '',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('insert deep_session error', error)
      return
    }

    const newSession = dbToSession(data as DBSession)
    setSessions([newSession, ...sessions])
    // Claude-style: jump straight into the chat. Title auto-generates from
    // the first user message on the detail page (see /deeptalk/[id]).
    router.push(`/deeptalk/${newSession.id}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('删掉这条深谈？里面所有消息也会一起删掉。')) return
    const { error } = await supabase
      .from('deep_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('delete deep_session error', error)
      return
    }

    setSessions(sessions.filter(s => s.id !== id))
  }

  return (
    <>
      <div className="dt-list" style={{ padding: '8px 0 24px', maxWidth: '640px', margin: '0 auto' }}>
        {loading && sessions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            opacity: 0.5,
          }}>读取中…</div>
        )}

        {sessions.map((s) => {
          const preview = s.preview && s.preview !== '…' ? s.preview : ''
          return (
            <div
              key={s.id}
              className="dt-row"
              onClick={() => router.push(`/deeptalk/${s.id}`)}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '14px 20px 14px 20px',
                borderBottom: '1px solid rgb(var(--v2-ink-rgb, 42 37 33) / 0.06)',
                cursor: 'pointer',
                background: 'transparent',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '10px' }}>
                  <div style={{
                    flex: 1, minWidth: 0,
                    fontSize: '15px', fontWeight: 500,
                    color: 'var(--v2-ink, #2a2521)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    letterSpacing: '0.01em',
                  }}>
                    {s.title || '无题'}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--v2-ink-soft, #6a5f54)',
                    opacity: 0.6,
                    flexShrink: 0,
                    letterSpacing: '0.05em',
                  }}>{s.date}</div>
                </div>
                {preview && (
                  <div style={{
                    marginTop: '4px',
                    fontSize: '13px',
                    color: 'var(--v2-ink-soft, #6a5f54)',
                    opacity: 0.72,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    lineHeight: 1.4,
                  }}>
                    {preview}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); void handleDelete(s.id) }}
                aria-label="delete"
                style={{
                  flexShrink: 0,
                  width: '24px', height: '24px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  opacity: 0.35,
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: 0,
                  marginTop: '2px',
                }}
              >×</button>
            </div>
          )
        })}

        {!loading && sessions.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
          }}>还没有开始过深谈，点右下角＋写第一句</div>
        )}
      </div>

      {/* Floating "+" FAB, matches tangents. */}
      <button
        onClick={handleNew}
        className="dt-new-fab"
        style={{
          position: 'fixed',
          right: 'calc(env(safe-area-inset-right, 0px) + 20px)',
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)',
          width: '52px', height: '52px', borderRadius: '50%',
          border: '1px solid var(--v2-gold-cool, #b8a064)',
          background: 'var(--v2-paper, #f4ede0)',
          boxShadow: '0 8px 20px rgba(60, 40, 20, 0.14)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--v2-gold-cool, #b8a064)',
          zIndex: 40,
        }}
        aria-label="new deeptalk"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M12 5 V19" />
          <path d="M5 12 H19" />
        </svg>
      </button>
    </>
  )
}

// === AftercareContent ===
function AftercareContent() {
  const [aftercare, setAftercare] = useState(defaultAftercare)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/v2/training')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.data && Array.isArray(d.data.aftercare)) {
          setAftercare(d.data.aftercare)
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    fetch('/api/v2/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patch: { aftercare } }),
    }).catch(() => {})
  }, [aftercare, loaded])

  const toggle = (i: number) =>
    setAftercare((prev) => prev.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)))

  return (
    <div style={{ position: 'relative', padding: '2rem 1.4rem 0', maxWidth: '720px', margin: '0 auto' }}>
      <EmberLayer />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '0.6rem 0 1.2rem' }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.4em',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            marginBottom: '0.55rem',
          }}>CURRENT MODE</div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.35rem 1.1rem 0.4rem',
            border: `0.5px solid ${RED}`,
            borderRadius: '0',
            background: 'rgba(160, 37, 42, 0.08)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: RED, boxShadow: `0 0 8px ${RED}`,
            }} />
            <span style={{
              fontStyle: 'italic',
              fontSize: '1.1rem', fontWeight: 600,
              color: 'var(--v2-ink, #2a2521)',
            }}>{currentMode.label}</span>
          </div>

          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.16em',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            marginTop: '0.55rem',
          }}>{currentMode.sub}</div>
        </div>

        <DiamondDivider />

        <SectionTitleRed code="A" label="STANDING DIRECTIVES" cn="当 前 指 令" />
        {directives.map((d) => (
          <div key={d.tag} style={{
            display: 'flex', alignItems: 'baseline', gap: '0.9rem',
            padding: '0.6rem 0.4rem',
            borderBottom: '0.5px dashed rgba(160, 37, 42, 0.22)',
          }}>
            <span style={{
              fontStyle: 'italic',
              fontSize: '0.88rem', color: RED,
              letterSpacing: '0.1em', minWidth: '22px',
            }}>{d.tag}</span>
            <span style={{
              fontStyle: 'italic',
              fontSize: '0.82rem', color: 'var(--v2-ink, #2a2521)',
              lineHeight: 1.55, letterSpacing: '0.01em', flex: 1,
            }}>{d.text}</span>
          </div>
        ))}

        <DiamondDivider />

        <SectionTitleRed code="B" label="LAST" cn="最 近 一 次" />
        <div style={{
          padding: '0.9rem 0.9rem 0.85rem',
          border: '0.5px solid var(--v2-gold-cool, #b8a064)',
          borderLeft: `2px solid ${RED}`,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '0',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontStyle: 'italic',
              fontSize: '0.88rem', color: 'var(--v2-gold, #c8a956)',
            }}>{lastScene.date}</span>
            <span style={{
              fontStyle: 'italic',
              fontSize: '0.7rem', color: 'var(--v2-ink-soft, #6a5f54)',
              letterSpacing: '0.04em',
            }}>· {lastScene.time}</span>
          </div>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.18em',
            color: 'var(--v2-gold-cool, #b8a064)',
            fontStyle: 'italic',
            textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>{lastScene.location}</div>
          <div style={{
            fontStyle: 'italic',
            fontSize: '0.78rem', color: 'var(--v2-ink-soft, #6a5f54)',
            lineHeight: 1.7, letterSpacing: '0.01em',
          }}>{lastScene.note}</div>
        </div>

        <DiamondDivider />

        <SectionTitleRed code="C" label="AFTERCARE" cn="关 怀 复 查" />
        <div style={{ marginBottom: '0.3rem' }}>
          {aftercare.map((it, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.7rem',
                padding: '0.45rem 0.3rem',
                borderBottom: i < aftercare.length - 1
                  ? '0.5px dashed rgba(168, 153, 104, 0.18)'
                  : 'none',
                cursor: 'pointer',
              }}
            >
              <CheckBox done={it.done} />
              <span style={{
                fontStyle: 'italic',
                fontSize: '0.8rem',
                color: it.done ? 'var(--v2-ink, #2a2521)' : 'var(--v2-ink-soft, #6a5f54)',
                opacity: it.done ? 1 : 0.65,
                letterSpacing: '0.02em',
              }}>{it.label}</span>
            </div>
          ))}
        </div>

        <DiamondDivider />

        <SectionTitleRed code="D" label="FROM Z" cn="他 的 字 条" />
        <div style={{
          padding: '1.1rem 1.05rem 1rem',
          border: '0.5px solid var(--v2-gold-cool, #b8a064)',
          borderTop: `1.5px solid ${RED}`,
          borderRadius: '0',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{
            fontStyle: 'italic',
            fontSize: '0.82rem', lineHeight: 1.85,
            color: 'var(--v2-ink, #2a2521)',
            letterSpacing: '0.015em',
            whiteSpace: 'pre-wrap',
          }}>{fromZ}</div>
          <div style={{
            textAlign: 'right', marginTop: '0.9rem',
            fontSize: '0.6rem', color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            letterSpacing: '0.06em',
          }}>—— Z</div>
        </div>
      </div>
    </div>
  )
}

// === Helpers ===

function SectionTitleRed({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontStyle: 'italic',
          fontSize: '0.8rem', color: RED, letterSpacing: '0.05em',
        }}>{code}</span>
        <span style={{ flex: 1, height: '1px', background: RED, opacity: 0.35 }} />
        <span style={{
          fontSize: '0.68rem', letterSpacing: '0.22em',
          color: 'var(--v2-ink, #2a2521)', fontWeight: 600,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.35em',
        color: 'var(--v2-ink-soft, #6a5f54)', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'right',
      }}>{cn}</div>
    </div>
  )
}

function DiamondDivider() {
  return (
    <div style={{ textAlign: 'center', margin: '1.4rem 0' }}>
      <svg width="80" height="12" viewBox="0 0 80 12">
        <line x1="6" y1="6" x2="32" y2="6" stroke={RED} strokeWidth="0.4" opacity="0.55" />
        <line x1="48" y1="6" x2="74" y2="6" stroke={RED} strokeWidth="0.4" opacity="0.55" />
        <path d="M 40 1.5 L 44 6 L 40 10.5 L 36 6 Z" fill="var(--v2-gold, #c8a956)" />
        <path d="M 40 3 L 42.5 6 L 40 9 L 37.5 6 Z" fill={RED} opacity="0.7" />
      </svg>
    </div>
  )
}

function CheckBox({ done }: { done: boolean }) {
  return (
    <div style={{
      width: '15px', height: '15px',
      border: `1px solid ${done ? 'var(--v2-gold, #c8a956)' : 'var(--v2-ink-soft, #6a5f54)'}`,
      borderRadius: '0',
      background: done ? 'rgba(212, 185, 138, 0.12)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s',
    }}>
      {done && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M 2 5 L 4.3 7.3 L 8 3" stroke="var(--v2-gold, #c8a956)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function EmberLayer() {
  return (
    <svg
      style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 1, opacity: 0.45,
      }}
      viewBox="0 0 375 1500"
      preserveAspectRatio="none"
    >
      <circle cx="60" cy="220" r="1.5" fill={RED} />
      <circle cx="315" cy="380" r="1.3" fill={RED_SOFT} />
      <circle cx="45" cy="540" r="1.4" fill={RED} />
      <circle cx="335" cy="720" r="1.5" fill={RED_SOFT} />
      <circle cx="55" cy="900" r="1.3" fill={RED} />
      <circle cx="320" cy="1080" r="1.5" fill={RED_SOFT} />
      <circle cx="40" cy="1260" r="1.4" fill={RED} />
      <circle cx="330" cy="1450" r="1.4" fill={RED_SOFT} />
      <circle cx="180" cy="430" r="0.9" fill={RED} opacity="0.6" />
      <circle cx="220" cy="980" r="0.9" fill={RED} opacity="0.6" />
      <circle cx="160" cy="1380" r="0.9" fill={RED} opacity="0.6" />
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
