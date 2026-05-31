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

export default function TrainingPage() {
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--v2-paper, #f4ede0)',
      color: 'var(--v2-ink, #2a2521)',
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      paddingBottom: '60px',
    }}>
      <PageArchway />

      <div style={{ padding: '20px 24px 0' }}>
        <Link href="/v2/chats" style={{
          color: 'var(--v2-gold-cool, #b8a064)',
          fontStyle: 'italic', textDecoration: 'none',
          fontSize: '14px', letterSpacing: '0.1em',
        }}>← chats</Link>
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
        }}>IV — Training</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}><Link href="/v2/training/aftercare" style={{ color: 'inherit', textDecoration: 'none' }}>aftercare ↗</Link></div>

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
          aria-label="new chapter"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5 V19" />
            <path d="M5 12 H19" />
          </svg>
        </button>
      </header>

      <div style={{ padding: '36px 28px 0', maxWidth: '720px', margin: '0 auto' }}>
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
              onClick={() => !isEditing && router.push(`/v2/training/${s.id}`)}
              style={{
                position: 'relative',
                background: 'var(--v2-paper, #f4ede0)',
                border: '1px solid rgba(184,160,100,0.45)',
                padding: '36px 38px 32px',
                marginBottom: '36px',
                cursor: isEditing ? 'default' : 'pointer',
                transition: 'box-shadow 250ms ease',
                boxShadow: '0 4px 14px rgba(60,40,20,0.08), 0 1px 3px rgba(60,40,20,0.05)',
              }}
            >
              {/* Inner hairline frame */}
              <div style={{
                position: 'absolute',
                top: '8px', left: '8px', right: '8px', bottom: '8px',
                border: '1px solid rgba(184,160,100,0.22)',
                pointerEvents: 'none',
              }} />

              {!isEditing && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(s) }}
                  style={{
                    position: 'absolute', top: '14px', right: '44px',
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
                    position: 'absolute', top: '14px', right: '18px',
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
                {/* Chapter Roman + ornament */}
                <div style={{
                  textAlign: 'center',
                  marginBottom: '8px',
                  color: 'var(--v2-gold-cool, #b8a064)',
                  letterSpacing: '0.4em',
                  fontSize: '11px',
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
                        width: '100%',
                        fontSize: '26px',
                        fontStyle: 'italic',
                        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                        color: 'var(--v2-ink, #2a2521)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid rgba(184,160,100,0.4)',
                        padding: '6px 0',
                        marginBottom: '8px',
                        outline: 'none',
                        textAlign: 'center',
                      }}
                    />
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => setEditSubtitle(e.target.value)}
                      placeholder="english subtitle"
                      style={{
                        width: '100%',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        fontFamily: '"Cormorant Garamond", serif',
                        color: 'var(--v2-ink-soft, #6a5f54)',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px dashed rgba(184,160,100,0.25)',
                        padding: '2px 0',
                        marginBottom: '16px',
                        outline: 'none',
                        textAlign: 'center',
                        letterSpacing: '0.12em',
                      }}
                    />
                    <textarea
                      value={editPreview}
                      onChange={(e) => setEditPreview(e.target.value)}
                      placeholder="写下这一场的开头…"
                      rows={6}
                      style={{
                        width: '100%',
                        fontSize: '15px',
                        lineHeight: 1.75,
                        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                        color: 'var(--v2-ink, #2a2521)',
                        background: 'transparent',
                        border: 'none',
                        padding: '6px 0',
                        outline: 'none',
                        resize: 'vertical',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                        style={{
                          padding: '4px 14px',
                          fontSize: '12px',
                          fontStyle: 'italic',
                          background: 'transparent',
                          border: '1px solid rgba(184,160,100,0.4)',
                          borderRadius: '12px',
                          color: 'var(--v2-ink-soft, #6a5f54)',
                          cursor: 'pointer',
                          fontFamily: '"Cormorant Garamond", serif',
                        }}
                      >cancel</button>
                      <button
                        onClick={(e) => { e.stopPropagation(); void handleSave() }}
                        style={{
                          padding: '4px 14px',
                          fontSize: '12px',
                          fontStyle: 'italic',
                          background: 'var(--v2-gold, #c8a956)',
                          border: 'none',
                          borderRadius: '12px',
                          color: 'white',
                          cursor: 'pointer',
                          fontFamily: '"Cormorant Garamond", serif',
                        }}
                      >save</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{
                      fontSize: '26px',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      margin: '0 0 6px 0',
                      color: 'var(--v2-ink, #2a2521)',
                      letterSpacing: '0.03em',
                      textAlign: 'center',
                    }}>{s.title || '无题'}</h2>
                    <div style={{
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: 'var(--v2-ink-soft, #6a5f54)',
                      opacity: 0.75,
                      letterSpacing: '0.15em',
                      marginBottom: '20px',
                      fontFamily: '"Cormorant Garamond", serif',
                      textAlign: 'center',
                    }}>{s.subtitle}</div>

                    {/* Hairline divider */}
                    <div style={{
                      width: '60px',
                      height: '1px',
                      background: 'var(--v2-gold-cool, #b8a064)',
                      opacity: 0.5,
                      margin: '0 auto 24px',
                    }} />

                    {/* Preview with drop cap */}
                    <div style={{
                      fontSize: '15px',
                      lineHeight: 1.85,
                      color: 'var(--v2-ink, #2a2521)',
                      opacity: 0.88,
                      textAlign: 'justify',
                    }}>
                      <span style={{
                        float: 'left',
                        fontSize: '54px',
                        lineHeight: '0.85',
                        paddingRight: '8px',
                        paddingTop: '4px',
                        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                        fontWeight: 500,
                        fontStyle: 'italic',
                        color: 'var(--v2-gold, #c8a956)',
                      }}>
                        {s.preview.charAt(0) || '…'}
                      </span>
                      {s.preview.slice(1) || ''}
                      <div style={{ clear: 'both' }} />
                    </div>

                    {/* Footer */}
                    <div style={{
                      marginTop: '24px',
                      paddingTop: '14px',
                      borderTop: '1px solid rgba(184,160,100,0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '10px',
                      color: 'var(--v2-ink-soft, #6a5f54)',
                      opacity: 0.6,
                      letterSpacing: '0.2em',
                      fontStyle: 'italic',
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
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            opacity: 0.6,
          }}>还没有任何场次，点右上 ＋ 开新一场</div>
        )}
      </div>

      <FooterOrnament />
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
