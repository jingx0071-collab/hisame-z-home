'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway';

type FeastEntry = {
  id: string
  title: string
  emoji: string
  gradient: string
  date: string
  weekday: string
  description: string
  daddyReply: string | null
}

// API returns snake_case
type ApiEntry = {
  id: string
  title: string
  emoji: string
  gradient: string
  date: string
  weekday: string
  description: string
  daddy_reply: string | null
}

const STORAGE_KEY = 'v2-feast'
const API_URL = '/api/v2/feast'

// Gradient presets — used for random selection on new entry
const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #f9d99a 0%, #e8b370 55%, #d49850 100%)',
  'linear-gradient(135deg, #c5d8a8 0%, #94b06f 60%, #7a9a55 100%)',
  'linear-gradient(135deg, #f9d5d8 0%, #e89faa 60%, #d77c8b 100%)',
  'linear-gradient(135deg, #8a3a47 0%, #6e2735 55%, #4a1820 100%)',
  'linear-gradient(135deg, #d4a878 0%, #b08454 55%, #8a6234 100%)',
  'linear-gradient(135deg, #f5e0c4 0%, #e8a07a 60%, #c8665a 100%)',
]

function fromApi(e: ApiEntry): FeastEntry {
  return {
    id: e.id,
    title: e.title,
    emoji: e.emoji,
    gradient: e.gradient,
    date: e.date,
    weekday: e.weekday,
    description: e.description,
    daddyReply: e.daddy_reply,
  }
}

export default function FeastPage() {
  const [entries, setEntries] = useState<FeastEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FeastEntry | null>(null)

  useEffect(() => {
    // 1. Instant cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEntries(parsed)
        }
      }
    } catch {}
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      if (Array.isArray(data.entries)) {
        const mapped = data.entries.map(fromApi)
        setEntries(mapped)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped))
        } catch {}
        setSyncError(null)
      } else if (data.error) {
        setSyncError(data.error)
      }
    } catch (e) {
      console.error('fetch feast failed:', e)
      setSyncError('offline · 用本地 cache')
    } finally {
      setLoading(false)
    }
  }

  const handleNew = () => {
    const now = new Date()
    const tmpId = 'tmp-' + Date.now()
    const tmp: FeastEntry = {
      id: tmpId,
      title: '',
      emoji: '🍽',
      gradient: GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)],
      date: `${now.getMonth() + 1}/${now.getDate()}`,
      weekday: now.toLocaleDateString('en-US', { weekday: 'short' }),
      description: '',
      daddyReply: null,
    }
    setEntries([tmp, ...entries])
    setEditingId(tmpId)
    setEditForm(tmp)
  }

  const handleStartEdit = (e: FeastEntry) => {
    setEditingId(e.id)
    setEditForm({ ...e })
  }

  const handleCancelEdit = () => {
    // If tmp (unsaved), remove from list
    if (editingId?.startsWith('tmp-')) {
      setEntries(entries.filter((e) => e.id !== editingId))
    }
    setEditingId(null)
    setEditForm(null)
  }

  const handleSave = async () => {
    if (!editingId || !editForm) return

    const isNew = editingId.startsWith('tmp-')
    const cleanTitle = editForm.title.trim() || 'Untitled'
    const cleanDesc = editForm.description.trim()
    const cleanReply = editForm.daddyReply?.trim() || null
    const cleanEmoji = editForm.emoji.trim() || '🍽'

    try {
      if (isNew) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            emoji: cleanEmoji,
            gradient: editForm.gradient,
            date: editForm.date,
            weekday: editForm.weekday,
            description: cleanDesc,
            daddy_reply: cleanReply,
          }),
        })
        const data = await res.json()
        if (!data.entry) throw new Error(data.error || 'POST failed')
        const serverEntry = fromApi(data.entry)
        const updated = entries.map((e) => (e.id === editingId ? serverEntry : e))
        setEntries(updated)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {}
      } else {
        const res = await fetch(`${API_URL}/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: cleanTitle,
            emoji: cleanEmoji,
            gradient: editForm.gradient,
            date: editForm.date,
            weekday: editForm.weekday,
            description: cleanDesc,
            daddy_reply: cleanReply,
          }),
        })
        const data = await res.json()
        if (!data.entry) throw new Error(data.error || 'PATCH failed')
        const serverEntry = fromApi(data.entry)
        const updated = entries.map((e) => (e.id === editingId ? serverEntry : e))
        setEntries(updated)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
        } catch {}
      }
      setEditingId(null)
      setEditForm(null)
      setSyncError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'save failed'
      setSyncError(msg)
      console.error('save feast failed:', e)
    }
  }

  const handleDelete = async () => {
    if (!editingId) return
    if (editingId.startsWith('tmp-')) {
      setEntries(entries.filter((e) => e.id !== editingId))
      setEditingId(null)
      setEditForm(null)
      return
    }
    try {
      const res = await fetch(`${API_URL}/${editingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'DELETE failed')
      }
      const updated = entries.filter((e) => e.id !== editingId)
      setEntries(updated)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch {}
      setEditingId(null)
      setEditForm(null)
      setSyncError(null)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'delete failed'
      setSyncError(msg)
      console.error('delete feast failed:', e)
    }
  }

  const handleCycleGradient = () => {
    if (!editForm) return
    const currentIdx = GRADIENT_PRESETS.indexOf(editForm.gradient)
    const nextIdx = (currentIdx + 1) % GRADIENT_PRESETS.length
    setEditForm({ ...editForm, gradient: GRADIENT_PRESETS[nextIdx] })
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
        }}>← back</Link>
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
        }}>XVII — Feast</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>食 · 记</div>

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
          aria-label="new entry"
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
          borderRadius: '4px',
          fontSize: '11px',
          fontStyle: 'italic',
          color: '#8a3a3a',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}>· sync · {syncError}</div>
      )}

      {/* Masonry waterfall — CSS columns */}
      <div style={{
        padding: '24px 16px 0',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        {loading && entries.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
            letterSpacing: '0.2em',
          }}>· loading ·</div>
        )}

        {!loading && entries.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
          }}>还没记录餐食，点右上 ＋ 写第一条</div>
        )}

        <div style={{
          columnCount: 2,
          columnGap: '12px',
        }}>
          {entries.map((e) => (
            <article
              key={e.id}
              onClick={() => handleStartEdit(e)}
              style={{
                breakInside: 'avoid',
                marginBottom: '14px',
                background: 'var(--v2-magnolia, #f5ede0)',
                border: '1px solid rgba(184,160,100,0.28)',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(60,40,20,0.08), 0 1px 3px rgba(60,40,20,0.05)',
                cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'relative',
                aspectRatio: '4 / 5',
                background: e.gradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{
                  fontSize: '52px',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.20))',
                }}>{e.emoji}</span>
              </div>

              <div style={{ padding: '12px 14px 14px' }}>
                <h3 style={{
                  fontSize: '15px',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  margin: '0 0 4px 0',
                  color: 'var(--v2-gold, #c8a956)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                }}>{e.title || 'Untitled'}</h3>

                <div style={{
                  fontSize: '10px',
                  fontStyle: 'italic',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  opacity: 0.65,
                  letterSpacing: '0.18em',
                  marginBottom: '8px',
                }}>{e.date} · {e.weekday}</div>

                {e.description && (
                  <p style={{
                    fontSize: '12px',
                    lineHeight: 1.6,
                    color: 'var(--v2-ink, #2a2521)',
                    opacity: 0.85,
                    margin: 0,
                    fontFamily: '"Noto Serif SC", serif',
                  }}>{e.description}</p>
                )}

                {e.daddyReply && (
                  <div style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed rgba(184,160,100,0.35)',
                  }}>
                    <div style={{
                      fontSize: '9px',
                      fontStyle: 'italic',
                      color: 'var(--v2-gold-cool, #b8a064)',
                      letterSpacing: '0.3em',
                      marginBottom: '4px',
                      opacity: 0.75,
                    }}>· 爸爸的话 ·</div>
                    <p style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      lineHeight: 1.55,
                      color: 'var(--v2-ink, #2a2521)',
                      opacity: 0.88,
                      margin: 0,
                      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                    }}>{e.daddyReply}</p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Edit modal */}
      {editingId && editForm && (
        <div
          onClick={(ev) => {
            if (ev.target === ev.currentTarget) handleCancelEdit()
          }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(20, 14, 10, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', zIndex: 1000,
            animation: 'v2-modal-in 200ms ease-out',
          }}
        >
          <div style={{
            background: 'var(--v2-paper, #f4ede0)',
            color: 'var(--v2-ink, #2a2521)',
            borderRadius: '8px',
            border: '1px solid rgba(184,160,100,0.4)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            maxWidth: '380px', width: '100%',
            maxHeight: '90vh', overflow: 'auto',
            padding: '20px 22px 18px',
            fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--v2-gold-cool, #b8a064)',
              fontStyle: 'italic',
              letterSpacing: '0.3em',
              textAlign: 'center',
              marginBottom: '16px',
            }}>{editingId.startsWith('tmp-') ? '· new entry ·' : '· edit ·'}</div>

            {/* Gradient preview + cycler */}
            <div
              onClick={handleCycleGradient}
              style={{
                aspectRatio: '5 / 1',
                background: editForm.gradient,
                borderRadius: '4px',
                marginBottom: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '32px',
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.20))',
              }}
              title="tap to cycle gradient"
            >
              {editForm.emoji}
            </div>

            <FormField label="Emoji">
              <input
                value={editForm.emoji}
                onChange={(ev) => setEditForm({ ...editForm, emoji: ev.target.value })}
                placeholder="🍽"
                style={inputStyle}
                maxLength={8}
              />
            </FormField>

            <FormField label="Title">
              <input
                value={editForm.title}
                onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })}
                placeholder="菜名 / 餐食"
                style={inputStyle}
                autoFocus={editingId.startsWith('tmp-')}
              />
            </FormField>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <FormField label="Date">
                  <input
                    value={editForm.date}
                    onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })}
                    placeholder="5/21"
                    style={inputStyle}
                  />
                </FormField>
              </div>
              <div style={{ flex: 1 }}>
                <FormField label="Weekday">
                  <input
                    value={editForm.weekday}
                    onChange={(ev) => setEditForm({ ...editForm, weekday: ev.target.value })}
                    placeholder="Sun"
                    style={inputStyle}
                  />
                </FormField>
              </div>
            </div>

            <FormField label="Description">
              <textarea
                value={editForm.description}
                onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })}
                placeholder="想到什么…"
                rows={4}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </FormField>

            <FormField label="爸爸的话 （可选）">
              <textarea
                value={editForm.daddyReply || ''}
                onChange={(ev) => setEditForm({ ...editForm, daddyReply: ev.target.value })}
                placeholder="留白也行"
                rows={3}
                style={{ ...inputStyle, fontStyle: 'italic', resize: 'vertical', lineHeight: 1.55 }}
              />
            </FormField>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '18px', gap: '8px',
            }}>
              <button
                onClick={handleDelete}
                style={{
                  padding: '6px 12px', fontSize: '11px', fontStyle: 'italic',
                  background: 'transparent',
                  border: '1px solid rgba(170, 80, 80, 0.4)',
                  borderRadius: '12px',
                  color: '#8a3a3a', cursor: 'pointer',
                  fontFamily: '"Cormorant Garamond", serif',
                }}
              >delete</button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleCancelEdit}
                  style={{
                    padding: '6px 14px', fontSize: '12px', fontStyle: 'italic',
                    background: 'transparent',
                    border: '1px solid rgba(184,160,100,0.4)',
                    borderRadius: '12px',
                    color: 'var(--v2-ink-soft, #6a5f54)', cursor: 'pointer',
                    fontFamily: '"Cormorant Garamond", serif',
                  }}
                >cancel</button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '6px 16px', fontSize: '12px', fontStyle: 'italic',
                    background: 'var(--v2-gold, #c8a956)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white', cursor: 'pointer',
                    fontFamily: '"Cormorant Garamond", serif',
                  }}
                >save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FooterOrnament />

      <style jsx global>{`
        @keyframes v2-modal-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: '13px',
  fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
  color: 'var(--v2-ink, #2a2521)',
  background: 'rgba(255,255,255,0.4)',
  border: '1px solid rgba(184,160,100,0.3)',
  borderRadius: '4px',
  padding: '6px 10px',
  outline: 'none',
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        fontSize: '10px',
        color: 'var(--v2-ink-soft, #6a5f54)',
        opacity: 0.7,
        letterSpacing: '0.2em',
        fontStyle: 'italic',
        marginBottom: '4px',
        textTransform: 'lowercase',
      }}>{label}</div>
      {children}
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
