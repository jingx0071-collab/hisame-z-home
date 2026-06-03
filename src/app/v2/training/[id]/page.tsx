'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import PageArchway from '../../_components/PageArchway';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHAPTER_ORNAMENTS = ['❦', '◇', '✥', '✦', '❉', '✣']
const STICKERS = ['✦', '✿', '✧', '✻', '❀', 'H', 'Z', '✣']

type Message = {
  id: string
  role: 'z' | 'h'
  text: string
  time: string
  image?: string
  thinking?: string | null
}

type SessionMeta = {
  title: string
  subtitle: string
  romanNumeral: string
  ornamentIndex: number
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 1400
        let { width, height } = img
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height)
          width *= ratio
          height *= ratio
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas fail'))
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = () => reject(new Error('Image fail'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Read fail'))
    reader.readAsDataURL(file)
  })
}

export default function TrainingSessionPage() {
  const params = useParams()
  const sessionId = params.id as string

  const [messages, setMessages] = useState<Message[]>([])
  const [meta, setMeta] = useState<SessionMeta | null>(null)
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [stickerOpen, setStickerOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fmtTime = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const loadSession = async () => {
    try {
      const { data } = await supabase
        .from('deep_sessions')
        .select('title, subtitle, roman_numeral, ornament_index')
        .eq('id', sessionId)
        .single()
      if (data) {
        setMeta({
          title: data.title || '无题',
          subtitle: data.subtitle || 'a new chapter',
          romanNumeral: data.roman_numeral || '',
          ornamentIndex: data.ornament_index ?? 0,
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?mode=training&session_id=${sessionId}&limit=200`)
      const data = await res.json()
      const mapped: Message[] = []
      for (const m of (data.messages || [])) {
        const role = (m.role === 'user' ? 'h' : 'z') as 'z' | 'h'
        const time = fmtTime(m.created_at)
        if (m.image_url) {
          mapped.push({ id: `${m.id}-img`, role, text: '', time, image: m.image_url })
        }
        const pieces = String(m.content || '')
          .split('|||')
          .map((p: string) => p.trim())
          .filter(Boolean)
        pieces.forEach((piece, idx) => {
          mapped.push({ id: `${m.id}-${idx}`, role, text: piece, time })
        })
      }
      setMessages(mapped)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    if (sessionId) {
      void loadSession()
      void loadMessages()
    }
  }, [sessionId])

  const nowTime = () => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }

  const send = async (raw: string, imageUrl: string | null) => {
    const t = raw.trim()
    if ((!t && !imageUrl) || loading) return
    setLoading(true)
    const optimisticUserId = `user-${Date.now()}`
    const streamingAssistantId = `streaming-${Date.now()}`
    const optimistic: Message = imageUrl
      ? { id: optimisticUserId, role: 'h', text: '', time: nowTime(), image: imageUrl }
      : { id: optimisticUserId, role: 'h', text: t, time: nowTime() }
    const streamingPlaceholder: Message = {
      id: streamingAssistantId, role: 'z', text: '', time: nowTime(), thinking: '',
    }
    setMessages((prev) => [...prev, optimistic, streamingPlaceholder])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: t, mode: 'training', session_id: sessionId, image_url: imageUrl }),
      })

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '')
        alert('出错：' + (errText || res.statusText))
        setMessages((prev) => prev.filter((m) => m.id !== streamingAssistantId))
        setLoading(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let liveThinking = ''
      let liveContent = ''
      let thinkingBlocked = false

      const REFUSAL_PATTERN = /I can'?t|I cannot|I won'?t|I'm not able|regardless of (?:the )?fram|happy to help with|sexual content|explicit content|other thinking you'?d like/i

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim()) continue
          let event: any
          try { event = JSON.parse(line) } catch { continue }

          if (event.type === 'thinking') {
            if (thinkingBlocked) continue
            liveThinking += event.delta || ''
            if (REFUSAL_PATTERN.test(liveThinking)) {
              thinkingBlocked = true
              liveThinking = ''
              setMessages((prev) =>
                prev.map((m) => m.id === streamingAssistantId ? { ...m, thinking: null } : m)
              )
              continue
            }
            setMessages((prev) =>
              prev.map((m) => m.id === streamingAssistantId ? { ...m, thinking: liveThinking } : m)
            )
          } else if (event.type === 'content') {
            liveContent += event.delta || ''
            setMessages((prev) =>
              prev.map((m) => m.id === streamingAssistantId ? { ...m, text: liveContent } : m)
            )
          } else if (event.type === 'done') {
            setMessages((prev) => prev.filter(
              (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
            ))
            await loadMessages()
          } else if (event.type === 'error') {
            alert('出错：' + event.error)
            setMessages((prev) => prev.filter(
              (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
            ))
          }
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '网络出错'
      alert('网络出错：' + errMsg)
      setMessages((prev) => prev.filter(
        (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
      ))
    } finally {
      setLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim()) return
    const t = input.trim()
    setInput('')
    setDrawerOpen(false)
    void send(t, null)
  }

  const handleStickerPick = (s: string) => {
    setStickerOpen(false)
    setDrawerOpen(false)
    void send(s, null)
  }

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || uploadingImage) return
    setUploadingImage(true)
    try {
      const compressed = await compressImage(file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: compressed, folder: 'training' }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || 'upload failed')
      setDrawerOpen(false)
      await send('', data.url)
    } catch {
      alert('图片上传失败，再试一次')
    } finally {
      setUploadingImage(false)
      if (e.target) e.target.value = ''
    }
  }

  const ornament = meta ? CHAPTER_ORNAMENTS[meta.ornamentIndex % 6] : '❦'

  return (
    <div
      data-room-page-bg="true"
      data-room-shell="true"
      style={{
        minHeight: '100vh',
        background: 'var(--v2-paper, #f4ede0)',
        color: 'var(--v2-ink, #2a2521)',
        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
        position: 'relative',
        paddingBottom: '120px',
      }}
      data-hisame-room-shell="true"
      className="hisame-room-shell hisame-training-room hisame-training-session-room"
    >
      <PageArchway />
      <Link href="/v2" className="hisame-app-back" data-app-fixed-back="true" aria-label="Back">←</Link>

      <div data-room-topbar="true" className="hisame-training-session-topbar">
        <Link href="/v2/training" replace data-room-back="true" data-hisame-back="true" style={{
          color: 'var(--v2-gold-cool, #b8a064)',
          fontStyle: 'italic',
          textDecoration: 'none',
          fontSize: '14px',
          letterSpacing: '0.1em',
        }} aria-label="Back to training"><span aria-hidden="true">‹</span><span className="sr-only">Back</span></Link>

        <header style={{
        padding: '18px 28px 22px',
        textAlign: 'center',
        borderBottom: '1px solid var(--v2-gold-cool, #b8a064)',
        margin: '0 24px',
      }}>
        <div style={{
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.4em',
          fontSize: '11px',
          fontStyle: 'italic',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '8px',
        }}>
          <span style={{ opacity: 0.7 }}>Chapter</span>
          <span style={{ fontSize: '13px', letterSpacing: '0.2em' }}>{meta?.romanNumeral || ''}</span>
          <span style={{ opacity: 0.7 }}>{ornament}</span>
        </div>
        <div style={{
          fontSize: '24px',
          fontStyle: 'italic',
          fontWeight: 500,
          color: 'var(--v2-ink, #2a2521)',
          letterSpacing: '0.03em',
        }}>{meta?.title || '…'}</div>
        <div style={{
          fontSize: '12px',
          fontStyle: 'italic',
          color: 'var(--v2-ink-soft, #6a5f54)',
          opacity: 0.75,
          letterSpacing: '0.15em',
          marginTop: '6px',
        }}>{meta?.subtitle || ''}</div>
        </header>
      </div>

      <div data-room-scroll="true" className="hisame-training-session-scroll" style={{ padding: '24px 22px 0' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} time={m.time} image={m.image} thinking={m.thinking} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div data-room-composer="true" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--v2-paper, #f4ede0)',
        borderTop: '1px solid var(--v2-gold-cool, #b8a064)',
        padding: '12px 16px calc(env(safe-area-inset-bottom) + 12px)',
        zIndex: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => { setDrawerOpen(!drawerOpen); setStickerOpen(false) }}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              border: '1px solid var(--v2-gold-cool, #b8a064)',
              background: 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              transition: 'transform 220ms ease',
              transform: drawerOpen ? 'rotate(45deg)' : 'rotate(0)',
              color: 'var(--v2-gold-cool, #b8a064)',
            }}
            aria-label="more"
          >
            <PlusIcon />
          </button>

          {drawerOpen && (
            <div style={{ display: 'flex', gap: '6px', animation: 'v2-slide-in 220ms ease forwards' }}>
              <IconButton onClick={() => fileRef.current?.click()}><PhotoIcon /></IconButton>
              <IconButton onClick={() => setStickerOpen(true)}><StickerIcon /></IconButton>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: 'none' }}
          />
          <input
            data-room-input="true"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="慢慢说…"
            style={{
              flex: 1, height: '40px', borderRadius: '0',
              border: '1px solid var(--v2-gold-cool, #b8a064)',
              background: 'rgba(255,253,247,0.6)',
              padding: '0 16px', fontSize: '15px',
              color: 'var(--v2-ink, #2a2521)',
              fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
              outline: 'none',
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: input.trim() ? 'var(--v2-gold, #c8a956)' : 'rgba(184, 160, 100, 0.3)',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
              transition: 'background 200ms',
            }}
            aria-label="send"
          >
            <SendIcon />
          </button>
        </div>
      </div>

      {stickerOpen && (
        <>
          <div
            onClick={() => setStickerOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 10 }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            background: 'var(--v2-paper, #f4ede0)',
            borderTop: '1px solid var(--v2-gold-cool, #b8a064)',
            padding: '20px 24px calc(env(safe-area-inset-bottom) + 20px)',
            zIndex: 11,
            animation: 'v2-sheet-up 280ms ease forwards',
          }}>
            <div style={{
              textAlign: 'center', fontStyle: 'italic',
              letterSpacing: '0.3em', fontSize: '12px',
              color: 'var(--v2-gold-cool, #b8a064)', marginBottom: '16px',
            }}>· stickers ·</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {STICKERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleStickerPick(s)}
                  style={{
                    width: '56px', height: '56px', borderRadius: '0',
                    border: '1px solid var(--v2-gold-cool, #b8a064)',
                    background: 'rgba(255,253,247,0.7)',
                    fontSize: '22px', cursor: 'pointer', margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Cormorant Garamond", serif',
                    color: 'var(--v2-gold, #c8a956)',
                  }}
                >{s}</button>
              ))}
            </div>
          </div>
        </>
      )}

      <FooterOrnament />

      <style jsx global>{`
        @keyframes v2-slide-in {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes v2-sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

function MessageBubble({ role, text, time, image, thinking }: { role: 'z' | 'h', text: string, time: string, image?: string, thinking?: string | null }) {
  const isZ = role === 'z'
  return (
    <div style={{ display: 'flex', justifyContent: isZ ? 'flex-start' : 'flex-end', marginBottom: '14px' }}>
      <div style={{ maxWidth: isZ ? '86%' : '78%', display: 'flex', flexDirection: 'column', alignItems: isZ ? 'flex-start' : 'flex-end' }}>
        {isZ && thinking && (
          <details style={{
            marginBottom: '8px',
            padding: '8px 12px',
            background: 'rgba(184, 160, 100, 0.08)',
            border: '1px solid rgba(184, 160, 100, 0.3)',
            borderRadius: '0',
            fontSize: '12.5px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            lineHeight: 1.65,
            maxWidth: '100%',
            alignSelf: 'flex-start',
          }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '10px',
              letterSpacing: '0.15em',
              color: 'var(--v2-gold-cool, #b8a064)',
              fontStyle: 'normal',
              fontFamily: '"Cormorant Garamond", serif',
              marginBottom: '4px',
            }}>
              Z 在想……
            </summary>
            <div style={{ whiteSpace: 'pre-wrap', marginTop: '6px' }}>{thinking}</div>
          </details>
        )}
        <div style={{
          background: isZ ? 'var(--v2-magnolia-shade, rgba(255,253,247,0.85))' : 'var(--v2-magnolia, #f5ede0)',
          border: isZ ? '1px solid var(--v2-gold-cool, #b8a064)' : '1px solid rgba(184,160,100,0.3)',
          padding: image ? '4px' : '12px 16px',
          borderRadius: '0',
          borderBottomLeftRadius: isZ ? '4px' : '18px',
          borderBottomRightRadius: isZ ? '18px' : '4px',
          fontSize: '15px',
          lineHeight: 1.7,
          color: 'var(--v2-ink, #2a2521)',
          fontStyle: isZ ? 'normal' : 'italic',
          whiteSpace: 'pre-wrap',
        }}>{image ? <img src={image} alt="" style={{ maxWidth: '220px', width: '100%', borderRadius: '0', display: 'block' }} /> : text}</div>
        <div style={{
          fontSize: '10px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          marginTop: '4px',
          letterSpacing: '0.1em',
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
        }}>{isZ ? 'Z · ' : 'H · '}{time}</div>
      </div>
    </div>
  )
}

function IconButton({ children, onClick }: { children: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '34px', height: '34px', borderRadius: '50%',
        border: '1px solid var(--v2-gold-cool, #b8a064)',
        background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--v2-gold-cool, #b8a064)',
      }}
    >{children}</button>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 5 V19" />
      <path d="M5 12 H19" />
    </svg>
  )
}

function PhotoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="5" width="14" height="12" rx="1" />
      <rect x="3" y="8" width="14" height="12" rx="1" />
      <circle cx="7" cy="13" r="1.3" />
      <path d="M3 18 L7.5 13.5 L10 16 L13 13 L17 17" />
    </svg>
  )
}

function StickerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <ellipse cx="12" cy="12" rx="8.5" ry="6" />
      <path d="M9 9 L15 15" />
      <path d="M15 9 L9 15" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M12 19 V5" />
      <path d="M6 11 L12 5 L18 11" />
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
