'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Message {
  id: number
  role: 'user' | 'assistant'
  content: string
  thinking: string | null
  created_at: string
}

interface SessionInfo {
  id: string
  title: string | null
  created_at: string
  last_message_at: string
}

function formatTime(iso: string): string {
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return fmt.format(new Date(iso))
}

export default function V2TangentChatPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function loadSession() {
    setLoading(true)
    try {
      const res = await fetch(`/api/tangents/sessions/${sessionId}`)
      const data = await res.json()
      if (data.session) setSession(data.session)
      if (data.messages) setMessages(data.messages)
    } catch (e) {
      console.error('load session failed:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) loadSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return
    setSending(true)
    setInput('')
    const optimisticUser: Message = {
      id: Date.now(),
      role: 'user',
      content,
      thinking: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticUser])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tangent',
          session_id: sessionId,
          content,
        }),
      })
      const data = await res.json()
      if (data.error) {
        alert('出错：' + data.error)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id))
      } else {
        setMessages((prev) => {
          const withoutOpt = prev.filter((m) => m.id !== optimisticUser.id)
          return [...withoutOpt, data.user_message, data.assistant_message]
        })
        if (!session?.title) {
          setTimeout(loadSession, 3000)
        }
      }
    } catch (e) {
      alert('网络错误：' + (e instanceof Error ? e.message : ''))
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{
      height: '100vh',
      background: 'var(--v2-paper, #f4ede0)',
      color: 'var(--v2-ink, #2a2521)',
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      display: 'flex',
      flexDirection: 'column',
    }} data-hisame-room-shell="true" className="hisame-room-shell hisame-tangent-chat-room">

      <header data-room-topbar-piece="true" style={{
        padding: '20px 24px 14px',
        textAlign: 'center',
        borderBottom: '1px solid var(--v2-gold-cool, #b8a064)',
        margin: '0 24px',
        position: 'relative',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.push('/v2/tangents')}
          style={{
            position: 'absolute',
            left: '0', top: '20px',
            background: 'transparent', border: 'none',
            color: 'var(--v2-gold-cool, #b8a064)',
            fontSize: '16px', cursor: 'pointer',
            fontFamily: 'inherit', fontStyle: 'italic',
            padding: '4px 8px',
          }}
          aria-label="back to tangents"
        >←</button>

        <div style={{
          fontSize: '10px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.4em',
          fontStyle: 'italic',
          marginBottom: '4px',
          opacity: 0.85,
        }}>· session ·</div>
        <div style={{
          fontSize: '16px',
          fontStyle: 'italic',
          color: 'var(--v2-ink, #2a2521)',
          letterSpacing: '0.05em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          padding: '0 40px',
        }}>{session?.title || '碎碎念'}</div>
      </header>

      <div ref={scrollRef} style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 22px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.6,
            letterSpacing: '0.2em',
          }}>· loading ·</div>
        ) : messages.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', opacity: 0.65,
            lineHeight: 1.85, fontSize: '14px',
          }}>说点什么吧<br/>随便聊聊</div>
        ) : (
          messages.map((m) => {
            const isUser = m.role === 'user'
            return (
              <div key={m.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                gap: '4px',
              }}>
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  fontSize: '10px',
                  letterSpacing: '0.22em',
                  opacity: 0.7,
                  fontStyle: 'italic',
                  padding: '0 4px',
                }}>
                  <span style={{ color: 'var(--v2-gold-cool, #b8a064)' }}>
                    {isUser ? '宝 宝' : '爸 爸'}
                  </span>
                  <span style={{ color: 'var(--v2-ink-soft, #6a5f54)' }}>
                    {formatTime(m.created_at)}
                  </span>
                </div>
                <div style={{
                  background: isUser ? 'rgba(255, 252, 245, 0.85)' : 'rgba(244, 231, 200, 0.92)',
                  border: '1px solid rgba(184,160,100,0.32)',
                  borderLeft: isUser ? '1px solid rgba(184,160,100,0.32)' : '2px solid var(--v2-gold-cool, #b8a064)',
                  borderRight: isUser ? '2px solid var(--v2-gold-cool, #b8a064)' : '1px solid rgba(184,160,100,0.32)',
                  boxShadow: isUser
                    ? '0 1px 2px rgba(60, 40, 20, 0.05), inset 0 0 18px rgba(184, 160, 100, 0.05)'
                    : '0 1px 3px rgba(60, 40, 20, 0.08), inset 0 0 24px rgba(184, 160, 100, 0.10)',
                  padding: '12px 16px',
                  fontSize: '14.5px',
                  lineHeight: 1.7,
                  color: 'var(--v2-ink, #2a2521)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontStyle: isUser ? 'italic' : 'normal',
                }}>{m.content}</div>
                {!isUser && m.thinking && (
                  <details style={{ marginTop: '4px', alignSelf: 'stretch', fontSize: '12px' }}>
                    <summary style={{
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: 'var(--v2-ink-soft, #6a5f54)',
                      padding: '4px 6px',
                      letterSpacing: '0.3em',
                      fontSize: '10px',
                      fontStyle: 'italic',
                      listStyle: 'none',
                      opacity: 0.7,
                    }}>· 思 考 ·</summary>
                    <div style={{
                      marginTop: '6px',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.35)',
                      borderLeft: '1px dashed rgba(184,160,100,0.4)',
                      lineHeight: 1.8,
                      color: 'var(--v2-ink-soft, #6a5f54)',
                      fontSize: '12.5px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontStyle: 'italic',
                    }}>{m.thinking}</div>
                  </details>
                )}
              </div>
            )
          })
        )}
      </div>

      <footer style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        padding: '12px 18px 24px',
        background: 'rgba(244, 237, 224, 0.85)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(184,160,100,0.25)',
        flexShrink: 0,
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="想到什么…"
          rows={1}
          disabled={sending}
          style={{
            flex: 1,
            background: 'rgba(255, 252, 245, 0.7)',
            border: '1px solid rgba(184,160,100,0.25)',
            borderRadius: '0',
            padding: '10px 14px',
            fontSize: '14.5px',
            color: 'var(--v2-ink, #2a2521)',
            resize: 'none',
            maxHeight: '120px',
            fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
            outline: 'none',
            fontStyle: 'italic',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'var(--v2-gold, #c8a956)',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: (!input.trim() || sending) ? 0.35 : 1,
            transition: 'opacity 200ms ease',
            fontFamily: 'inherit',
          }}
          aria-label="send"
        >{sending ? '·' : '→'}</button>
      </footer>
    </div>
  )
}
