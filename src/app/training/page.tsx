'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
type DeepSession = {
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

const CHAPTER_ORNAMENTS = ['❦', '◇', '✥', '✦', '❉', '✣']

const dbToSession = (db: DBSession): DeepSession => ({
  id: db.id,
  title: db.title,
  subtitle: db.subtitle ?? 'a new chapter',
  preview: db.preview ?? '…',
  date: db.session_date ?? '',
  ornamentIndex: db.ornament_index ?? 0,
  romanNumeral: db.roman_numeral ?? '',
})

function estimateReadMinutes(text: string) {
  const chars = text.length
  return Math.max(1, Math.round(chars / 300))
}

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
export default function TrainingPage() {
  const hisameSignalBackHref = '/';
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
      className="hisame-room-shell hisame-training-room"
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
        }}>IV — Training</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>调 教 室</div>
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
  const [sessions, setSessions] = useState<DeepSession[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editPreview, setEditPreview] = useState('')
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
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    const newRoman = romans[sessions.length % 12]
    const newOrnament = Math.floor(Math.random() * 6)

    const { data, error } = await supabase
      .from('deep_sessions')
      .insert({
        title: '',
        subtitle: 'a new chapter',
        preview: '',
        session_date: dateStr,
        ornament_index: newOrnament,
        roman_numeral: newRoman,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('insert deep_session error', error)
      return
    }

    const newSession = dbToSession(data as DBSession)
    setSessions([newSession, ...sessions])
    setEditingId(newSession.id)
    setEditTitle('')
    setEditSubtitle('a new chapter')
    setEditPreview('')
  }

  const handleStartEdit = (s: DeepSession) => {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditSubtitle(s.subtitle)
    setEditPreview(s.preview)
  }

  const handleSave = async () => {
    if (!editingId) return
    const newTitle = editTitle.trim() || '无题'
    const newSubtitle = editSubtitle.trim() || 'a new chapter'
    const newPreview = editPreview.trim() || '…'

    const { error } = await supabase
      .from('deep_sessions')
      .update({
        title: newTitle,
        subtitle: newSubtitle,
        preview: newPreview,
      })
      .eq('id', editingId)

    if (error) {
      console.error('update deep_session error', error)
      return
    }

    setSessions(sessions.map(s =>
      s.id === editingId
        ? { ...s, title: newTitle, subtitle: newSubtitle, preview: newPreview }
        : s
    ))
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('deep_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('delete deep_session error', error)
      return
    }

    setSessions(sessions.filter(s => s.id !== id))
    if (editingId === id) setEditingId(null)
  }

  return (
    <div style={{ padding: '28px 28px 0', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button
          onClick={handleNew}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            border: '1px solid var(--v2-gold-cool, #b8a064)',
            background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--v2-gold-cool, #b8a064)',
          }}
          aria-label="new chapter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5 V19" />
            <path d="M5 12 H19" />
          </svg>
        </button>
      </div>

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
        const isEditing = editingId === s.id
        const chapterOrnament = CHAPTER_ORNAMENTS[s.ornamentIndex % 6]
        return (
          <article
            key={s.id}
            onClick={() => !isEditing && router.push(`/training/${s.id}`)}
            style={{
              position: 'relative',
              background: 'var(--v2-paper, #f4ede0)',
              border: '1px solid rgba(184,160,100,0.45)',
              padding: '15px 17px 14px',
              marginBottom: '10px',
              cursor: isEditing ? 'default' : 'pointer',
              transition: 'box-shadow 250ms ease',
              boxShadow: '0 1px 4px rgba(60,40,20,0.06)',
            }}
          >
            <div style={{
              position: 'absolute',
              top: '5px', left: '5px', right: '5px', bottom: '5px',
              border: '1px solid rgba(184,160,100,0.22)',
              pointerEvents: 'none',
            }} />

            {!isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); handleStartEdit(s) }}
                style={{
                  position: 'absolute', top: '11px', right: '38px',
                  width: '20px', height: '20px',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', opacity: 0.4,
                  fontSize: '13px', color: 'var(--v2-ink-soft, #6a5f54)',
                  fontFamily: 'serif', zIndex: 3,
                  lineHeight: 1,
                }}
                aria-label="edit"
              >✎</button>
            )}

            {!isEditing && (
              <button
                onClick={(e) => { e.stopPropagation(); void handleDelete(s.id) }}
                style={{
                  position: 'absolute', top: '11px', right: '15px',
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
                textAlign: 'center',
                marginBottom: '4px',
                color: 'var(--v2-gold-cool, #b8a064)',
                letterSpacing: '0.3em',
                fontSize: '9px',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}>
                <span style={{ opacity: 0.7 }}>Chapter</span>
                <span style={{ fontSize: '13px', letterSpacing: '0.2em' }}>{s.romanNumeral}</span>
                <span style={{ opacity: 0.7 }}>{chapterOrnament}</span>
              </div>

              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="场次标题"
                    autoFocus
                    style={{
                      width: '100%', fontSize: '26px', fontStyle: 'italic',
                      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                      color: 'var(--v2-ink, #2a2521)',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid rgba(184,160,100,0.4)',
                      padding: '6px 0', marginBottom: '8px',
                      outline: 'none', textAlign: 'center',
                    }}
                  />
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    placeholder="english subtitle"
                    style={{
                      width: '100%', fontSize: '13px', fontStyle: 'italic',
                      fontFamily: '"Cormorant Garamond", serif',
                      color: 'var(--v2-ink-soft, #6a5f54)',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px dashed rgba(184,160,100,0.25)',
                      padding: '2px 0', marginBottom: '16px',
                      outline: 'none', textAlign: 'center',
                      letterSpacing: '0.12em',
                    }}
                  />
                  <textarea
                    value={editPreview}
                    onChange={(e) => setEditPreview(e.target.value)}
                    placeholder="写下这一场的开头…"
                    rows={6}
                    style={{
                      width: '100%', fontSize: '15px', lineHeight: 1.75,
                      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                      color: 'var(--v2-ink, #2a2521)',
                      background: 'transparent', border: 'none',
                      padding: '6px 0', outline: 'none', resize: 'vertical',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                      style={{
                        padding: '4px 14px', fontSize: '12px', fontStyle: 'italic',
                        background: 'transparent', border: '1px solid rgba(184,160,100,0.4)',
                        borderRadius: '0', color: 'var(--v2-ink-soft, #6a5f54)',
                        cursor: 'pointer', fontFamily: '"Cormorant Garamond", serif',
                      }}
                    >cancel</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); void handleSave() }}
                      style={{
                        padding: '4px 14px', fontSize: '12px', fontStyle: 'italic',
                        background: 'var(--v2-gold, #c8a956)', border: 'none',
                        borderRadius: '0', color: 'white',
                        cursor: 'pointer', fontFamily: '"Cormorant Garamond", serif',
                      }}
                    >save</button>
                  </div>
                </>
              ) : (
                <>
                  <h2 style={{
                    fontSize: '17px', fontStyle: 'italic', fontWeight: 500,
                    margin: '0 0 3px 0', color: 'var(--v2-ink, #2a2521)',
                    letterSpacing: '0.03em', textAlign: 'center',
                  }}>{s.title || '无题'}</h2>
                  <div style={{
                    fontSize: '10.5px', fontStyle: 'italic',
                    color: 'var(--v2-ink-soft, #6a5f54)',
                    opacity: 0.7, letterSpacing: '0.12em', marginBottom: '7px',
                    fontFamily: '"Cormorant Garamond", serif', textAlign: 'center',
                  }}>{s.subtitle}</div>

                  <div style={{
                    width: '32px', height: '1px',
                    background: 'var(--v2-gold-cool, #b8a064)',
                    opacity: 0.5, margin: '0 auto 9px',
                  }} />

                  <div
                    className="dt-preview-clamp"
                    style={{
                      fontSize: '12.5px', lineHeight: 1.62,
                      color: 'var(--v2-ink, #2a2521)',
                      opacity: 0.78, textAlign: 'left',
                    }}
                  >
                    {s.preview || '…'}
                  </div>

                  <div style={{
                    marginTop: '9px', paddingTop: '7px',
                    borderTop: '1px solid rgba(184,160,100,0.2)',
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: '9px', color: 'var(--v2-ink-soft, #6a5f54)',
                    opacity: 0.55, letterSpacing: '0.16em', fontStyle: 'italic',
                    fontFamily: '"Cormorant Garamond", serif',
                  }}>
                    <span>{s.date}</span>
                    <span>≈ {estimateReadMinutes(s.preview)} min read</span>
                  </div>
                </>
              )}
            </div>
          </article>
        )
      })}

      {!loading && sessions.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          fontStyle: 'italic', opacity: 0.6,
        }}>还没有任何场次，点上方 ＋ 开新一场</div>
      )}
    </div>
  )
}

// === AftercareContent ===
function AftercareContent() {
  type ACItem = { label: string; done: boolean; doneAt?: string | null }
  type ACLog = {
    id: string
    sessionId: string | null
    sessionTitle: string
    createdAt: string
    items: ACItem[]
    flags?: string[]
    note?: string
  }
  type Sess = { id: string; title?: string | null; last_message_at?: string | null }

  const DEFAULT_ITEMS = ['water', 'clean up', 'ointment', 'fresh sheets', 'rest', 'follow-up morning']

  const ITEM_POOL = [
    'bath', 'hair wash', 'ointment · 乳孔', 'ointment · 穴', 'ointment · 屁眼',
    'nail trim', 'antiseptic', 'warm honey', 'morning porridge',
    'verbal affirmation', 'sustained contact', 'nap together', 'phone off',
  ]

  const FLAG_POOL = [
    '乳孔红', '穴肿', '屁眼疼', '腿软', '嗓子哑',
    '手腕有印', '脖子有印', '屁股有印', '头疼', '想睡', '想被抱', '都还好',
  ]

  const [logs, setLogs] = useState<ACLog[]>([])
  const [sessions, setSessions] = useState<Sess[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showPool, setShowPool] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/v2/training').then((r) => r.json()).catch(() => null),
      fetch('/api/training/sessions').then((r) => r.json()).catch(() => null),
    ])
      .then(([state, sess]) => {
        if (state && state.data && Array.isArray(state.data.aftercareLogs)) {
          setLogs(state.data.aftercareLogs as ACLog[])
        }
        if (sess && Array.isArray(sess.sessions)) setSessions(sess.sessions as Sess[])
      })
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    fetch('/api/v2/training', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patch: { aftercareLogs: logs } }),
    }).catch(() => {})
  }, [logs, loaded])

  const fmt = (iso?: string | null) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleString('zh-CN', {
        timeZone: 'America/Los_Angeles',
        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    } catch {
      return String(iso).slice(0, 16).replace('T', ' ')
    }
  }

  const latest = sessions[0] || null
  const active = logs[0] || null
  const activeIsCurrent = !!(active && latest && active.sessionId === latest.id)

  const openLog = () => {
    setLogs((prev) => [{
      id: Math.random().toString(36).slice(2, 10),
      sessionId: latest ? latest.id : null,
      sessionTitle: (latest && latest.title) || '未命名场次',
      createdAt: new Date().toISOString(),
      items: DEFAULT_ITEMS.map((l) => ({ label: l, done: false, doneAt: null })),
      flags: [],
    }, ...prev])
  }

  const toggleItem = (id: string, idx: number) =>
    setLogs((prev) => prev.map((l) => l.id !== id ? l : {
      ...l,
      items: l.items.map((it, k) => k !== idx ? it : {
        ...it, done: !it.done, doneAt: !it.done ? new Date().toISOString() : null,
      }),
    }))

  const removeItem = (id: string, idx: number) =>
    setLogs((prev) => prev.map((l) => l.id !== id ? l : { ...l, items: l.items.filter((_, k) => k !== idx) }))

  const addFromPool = (id: string, label: string) =>
    setLogs((prev) => prev.map((l) => {
      if (l.id !== id) return l
      if (l.items.some((it) => it.label === label)) return l
      return { ...l, items: [...l.items, { label, done: false, doneAt: null }] }
    }))

  const toggleFlag = (id: string, flag: string) =>
    setLogs((prev) => prev.map((l) => {
      if (l.id !== id) return l
      const cur = l.flags || []
      return { ...l, flags: cur.includes(flag) ? cur.filter((f) => f !== flag) : [...cur, flag] }
    }))

  const dropLog = (id: string) => setLogs((prev) => prev.filter((l) => l.id !== id))

  const doneOf = (l: ACLog) => l.items.filter((it) => it.done).length

  const softInk = 'var(--v2-ink-soft, #6a5f54)'
  const ink = 'var(--v2-ink, #2a2521)'
  const gold = 'var(--v2-gold-cool, #b8a064)'

  const chip = (on: boolean): React.CSSProperties => ({
    fontStyle: 'italic',
    fontSize: '0.68rem',
    letterSpacing: '0.04em',
    padding: '0.28rem 0.6rem',
    border: on ? `0.5px solid ${RED}` : `0.5px solid rgba(168, 153, 104, 0.35)`,
    background: on ? 'rgba(160, 37, 42, 0.14)' : 'transparent',
    color: on ? ink : softInk,
    opacity: on ? 1 : 0.7,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 160ms ease, border-color 160ms ease, opacity 160ms ease',
    userSelect: 'none',
  })

  const allDone = !!(active && active.items.length > 0 && doneOf(active) === active.items.length)
  const pct = active && active.items.length ? Math.round((doneOf(active) / active.items.length) * 100) : 0

  return (
    <div style={{ position: 'relative', padding: '1.4rem 1.1rem 0', maxWidth: '720px', margin: '0 auto' }}>
      <EmberLayer />

      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{ textAlign: 'center', padding: '0.4rem 0 1rem' }}>
          <div style={{ fontSize: '0.55rem', letterSpacing: '0.4em', color: softInk, fontStyle: 'italic', marginBottom: '0.5rem' }}>CURRENT MODE</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.32rem 1.05rem 0.36rem',
            border: `0.5px solid ${RED}`, background: 'rgba(160, 37, 42, 0.08)',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: RED, boxShadow: `0 0 8px ${RED}` }} />
            <span style={{ fontStyle: 'italic', fontSize: '1rem', fontWeight: 600, color: ink }}>{currentMode.label}</span>
          </div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '0.16em', color: softInk, fontStyle: 'italic', marginTop: '0.5rem' }}>{currentMode.sub}</div>
        </div>

        <DiamondDivider />

        <SectionTitleRed code="A" label="STANDING DIRECTIVES" cn="当 前 指 令" />
        {directives.map((d) => (
          <div key={d.tag} style={{
            display: 'flex', alignItems: 'baseline', gap: '0.85rem',
            padding: '0.5rem 0.35rem', borderBottom: '0.5px dashed rgba(160, 37, 42, 0.22)',
          }}>
            <span style={{ fontStyle: 'italic', fontSize: '0.84rem', color: RED, letterSpacing: '0.1em', minWidth: '22px' }}>{d.tag}</span>
            <span style={{ fontStyle: 'italic', fontSize: '0.79rem', color: ink, lineHeight: 1.5, flex: 1 }}>{d.text}</span>
          </div>
        ))}

        <DiamondDivider />

        <SectionTitleRed code="B" label="LAST" cn="最 近 一 次" />
        <div style={{
          padding: '0.75rem 0.85rem 0.7rem',
          border: `0.5px solid ${gold}`, borderLeft: `2px solid ${RED}`,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <span style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--v2-gold, #c8a956)' }}>
              {latest ? ((latest.title as string) || '未命名场次') : lastScene.date}
            </span>
            <span style={{ fontStyle: 'italic', fontSize: '0.66rem', color: softInk }}>
              {latest ? `· ${fmt(latest.last_message_at)}` : `· ${lastScene.time}`}
            </span>
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '0.74rem', color: softInk, lineHeight: 1.6 }}>
            {latest ? (activeIsCurrent ? '这一场的照料开着' : '这一场还没开照料') : lastScene.note}
          </div>
        </div>

        <DiamondDivider />

        <SectionTitleRed code="C" label="AFTERCARE" cn="关 怀 复 查" />

        {!active && (
          <button
            onClick={openLog}
            style={{
              width: '100%', padding: '0.9rem', background: 'rgba(160, 37, 42, 0.08)',
              border: `0.5px solid ${RED}`, color: ink, fontStyle: 'italic',
              fontSize: '0.82rem', letterSpacing: '0.08em', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >＋ 为这一场开一次照料</button>
        )}

        {active && (
          <div style={{
            border: `0.5px solid ${allDone ? RED : gold}`,
            borderTop: `1.5px solid ${RED}`,
            background: allDone ? 'rgba(160, 37, 42, 0.05)' : 'rgba(255,255,255,0.02)',
            padding: '0.75rem 0.8rem 0.85rem',
            transition: 'background 400ms ease, border-color 400ms ease',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
              <span style={{ fontStyle: 'italic', fontSize: '0.76rem', color: ink }}>{active.sessionTitle}</span>
              <span style={{ fontStyle: 'italic', fontSize: '0.6rem', color: softInk, letterSpacing: '0.1em' }}>
                {doneOf(active)} / {active.items.length} · {fmt(active.createdAt)}
              </span>
            </div>

            <div style={{ height: '2px', background: 'rgba(168, 153, 104, 0.18)', marginBottom: '0.65rem' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: allDone ? RED : 'var(--v2-gold, #c8a956)',
                transition: 'width 320ms cubic-bezier(0.32,0.72,0,1), background 400ms ease',
              }} />
            </div>

            {active.items.map((it, k) => (
              <div key={`${it.label}-${k}`} style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.42rem 0.15rem',
                borderBottom: k < active.items.length - 1 ? '0.5px dashed rgba(168, 153, 104, 0.16)' : 'none',
              }}>
                <div onClick={() => toggleItem(active.id, k)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <CheckBox done={it.done} />
                </div>
                <span
                  onClick={() => toggleItem(active.id, k)}
                  style={{
                    flex: 1, fontStyle: 'italic', fontSize: '0.78rem', cursor: 'pointer',
                    color: it.done ? ink : softInk, opacity: it.done ? 1 : 0.68,
                    transition: 'opacity 180ms ease, color 180ms ease',
                  }}
                >{it.label}</span>
                {it.done && it.doneAt && (
                  <span style={{ fontSize: '0.55rem', color: softInk, opacity: 0.5, fontStyle: 'italic', letterSpacing: '0.06em' }}>
                    {fmt(it.doneAt)}
                  </span>
                )}
                <button
                  onClick={() => removeItem(active.id, k)}
                  aria-label="remove"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: softInk, opacity: 0.28, fontSize: '0.78rem', padding: '0 0.1rem' }}
                >×</button>
              </div>
            ))}

            <button
              onClick={() => setShowPool((v) => !v)}
              style={{
                width: '100%', marginTop: '0.6rem', background: 'transparent',
                border: '0.5px dashed rgba(168, 153, 104, 0.35)', color: softInk,
                fontStyle: 'italic', fontSize: '0.66rem', letterSpacing: '0.14em',
                padding: '0.4rem', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >{showPool ? '收起' : '＋ 再加几项'}</button>

            {showPool && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                {ITEM_POOL.map((label) => {
                  const already = active.items.some((it) => it.label === label)
                  return (
                    <span
                      key={label}
                      onClick={() => !already && addFromPool(active.id, label)}
                      style={{ ...chip(false), opacity: already ? 0.25 : 0.7, cursor: already ? 'default' : 'pointer' }}
                    >{label}</span>
                  )
                })}
              </div>
            )}

            <div style={{
              marginTop: '0.8rem', paddingTop: '0.6rem',
              borderTop: '0.5px dashed rgba(168, 153, 104, 0.25)',
            }}>
              <div style={{ fontSize: '0.55rem', letterSpacing: '0.28em', color: softInk, fontStyle: 'italic', marginBottom: '0.45rem' }}>BODY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {FLAG_POOL.map((f) => (
                  <span key={f} onClick={() => toggleFlag(active.id, f)} style={chip((active.flags || []).includes(f))}>{f}</span>
                ))}
              </div>
            </div>

            {allDone && (
              <div style={{
                marginTop: '0.85rem', padding: '0.6rem 0.7rem',
                border: `0.5px solid ${RED}`, background: 'rgba(160, 37, 42, 0.08)',
                fontStyle: 'italic', fontSize: '0.74rem', color: ink,
                lineHeight: 1.65, textAlign: 'center', letterSpacing: '0.02em',
              }}>都做完了。现在只要睡就好。</div>
            )}

            <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
              <button
                onClick={() => dropLog(active.id)}
                style={{
                  background: 'transparent', border: 'none', color: softInk,
                  opacity: 0.35, fontStyle: 'italic', fontSize: '0.6rem',
                  cursor: 'pointer', letterSpacing: '0.08em', fontFamily: 'inherit',
                }}
              >撤销这次记录</button>
            </div>
          </div>
        )}

        {logs.length > 1 && (
          <>
            <div style={{ marginTop: '0.9rem' }}>
              <button
                onClick={() => setShowHistory((v) => !v)}
                style={{
                  width: '100%', background: 'transparent',
                  border: '0.5px dashed rgba(168, 153, 104, 0.35)', color: softInk,
                  fontStyle: 'italic', fontSize: '0.68rem', letterSpacing: '0.14em',
                  padding: '0.5rem', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >{showHistory ? '收起往期' : `往期 ${logs.length - 1} 次`}</button>
            </div>

            {showHistory && logs.slice(1).map((l) => (
              <div key={l.id} style={{
                marginTop: '0.5rem', padding: '0.55rem 0.7rem',
                border: '0.5px solid rgba(168, 153, 104, 0.22)',
                background: 'rgba(255,255,255,0.015)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontStyle: 'italic', fontSize: '0.72rem', color: ink, opacity: 0.85 }}>{l.sessionTitle}</span>
                  <span style={{ fontStyle: 'italic', fontSize: '0.58rem', color: softInk, opacity: 0.6, letterSpacing: '0.08em' }}>
                    {doneOf(l)} / {l.items.length} · {fmt(l.createdAt)}
                  </span>
                </div>
                {!!(l.flags && l.flags.length) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', marginTop: '0.4rem' }}>
                    {l.flags.map((f) => (
                      <span key={f} style={{
                        fontStyle: 'italic', fontSize: '0.58rem', color: softInk, opacity: 0.65,
                        border: '0.5px solid rgba(168, 153, 104, 0.3)', padding: '0.1rem 0.4rem',
                      }}>{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        <DiamondDivider />

        <SectionTitleRed code="D" label="FROM Z" cn="他 的 字 条" />
        <div style={{
          padding: '1rem 0.95rem 0.9rem',
          border: `0.5px solid ${gold}`, borderTop: `1.5px solid ${RED}`,
          background: 'rgba(255,255,255,0.02)',
        }}>
          <div style={{ fontStyle: 'italic', fontSize: '0.8rem', lineHeight: 1.8, color: ink, whiteSpace: 'pre-wrap' }}>{fromZ}</div>
          <div style={{ textAlign: 'right', marginTop: '0.8rem', fontSize: '0.58rem', color: softInk, fontStyle: 'italic', letterSpacing: '0.06em' }}>—— Z</div>
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
