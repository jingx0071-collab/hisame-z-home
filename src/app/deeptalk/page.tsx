'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PageArchway from '../_components/PageArchway';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

// === Main page ===
export default function DeeptalkPage() {
  return (
    <div
      data-room-page-bg="true"
      data-room-shell="true"
      style={{
        minHeight: '100vh',
        color: 'var(--v2-ink, #2a2521)',
        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
        paddingBottom: '60px',
        position: 'relative',
      }}
      data-hisame-room-shell="true"
      className="hisame-room-shell hisame-deeptalk-room hisame-training-room"
    >
      <PageArchway />


      {/* Chat list only — no tabs, no aftercare panel. */}
      <div className="hisame-training-scroll" data-room-scroll="true">
        <ChatsContent />
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
