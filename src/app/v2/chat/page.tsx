'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway';
import { useSkin } from '../_components/ThemeProvider';

type Message = {
  id: string
  role: 'z' | 'h'
  text: string
  time: string
  image?: string
}

const STICKERS = ['✦', '✿', '✧', '✻', '❀', 'H', 'Z', '✣']

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
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

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/chat?mode=messages&limit=200')
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
    loadMessages()
    const interval = setInterval(loadMessages, 30000)
    return () => clearInterval(interval)
  }, [])

  const nowTime = () => {
    const n = new Date()
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
  }

  const send = async (raw: string, imageUrl: string | null) => {
    const t = raw.trim()
    if ((!t && !imageUrl) || loading) return
    setLoading(true)
    const optimistic: Message = imageUrl
      ? { id: Date.now().toString(), role: 'h', text: '', time: nowTime(), image: imageUrl }
      : { id: Date.now().toString(), role: 'h', text: t, time: nowTime() }
    const typing: Message = { id: 'typing', role: 'z', text: '……', time: nowTime() }
    setMessages((prev) => [...prev, optimistic, typing])
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: t, mode: 'messages', image_url: imageUrl }),
      })
      const data = await res.json()
      if (data.error) alert('出错：' + data.error)
    } catch {
      alert('网络出错')
    } finally {
      await loadMessages()
      setLoading(false)
    }
  }

  const handleSend = () => {
    if (!input.trim()) return
    const t = input.trim()
    setInput('')
    setDrawerOpen(false)
    send(t, null)
  }

  const handleStickerPick = (s: string) => {
    setStickerOpen(false)
    setDrawerOpen(false)
    send(s, null)
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
        body: JSON.stringify({ file_data: compressed, folder: 'messages' }),
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

  const skin = useSkin()
  const isOS = skin === 'grace-os'
  const isWhiteGothic = skin === 'white-gothic'
  const isWindowSkin = isOS || isWhiteGothic

  return (
    <div data-room-page-bg="true" data-room-shell="true" style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--v2-paper, #f4ede0)',
      color: 'var(--v2-ink, #2a2521)',
      fontFamily: 'var(--v2-font-body, "Cormorant Garamond", "Noto Serif SC", serif)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      ...(isWindowSkin ? { border: '1px solid var(--v2-gold-cool, #808080)' } : {}),
    }} data-hisame-room-shell="true" className="hisame-room-shell hisame-chat-room">
      {!isWindowSkin && <PageArchway />}

      <div data-room-topbar="true" style={{
        flexShrink: 0,
        background: 'var(--v2-paper, #f4ede0)',
        paddingTop: 'env(safe-area-inset-top)',
        position: 'relative',
        zIndex: 3,
      }}>
        {isWindowSkin ? (
          <>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px',
              borderBottom: '1px solid var(--v2-gold-cool, #808080)',
              background: 'var(--v2-magnolia, #262626)',
            }}>
              <span style={{
                fontFamily: 'var(--v2-font-display)', fontSize: '11px',
                letterSpacing: '0.15em', color: 'var(--v2-text-strong, #eaeaea)',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: 'var(--v2-text-mid, #b0b0b0)', fontSize: '13px' }}>&#8224;</span>
                短信
              </span>
              <Link href="/v2" data-room-back="true" style={{
                fontFamily: 'var(--v2-font-display)',
                fontSize: '12px',
                color: 'var(--v2-text-mid, #5f6666)',
                textDecoration: 'none',
                lineHeight: 1,
                padding: '7px 11px',
                border: '1px solid rgba(58, 68, 68, 0.22)',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.22)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }} data-hisame-back="true" aria-label="Back to home"><span aria-hidden="true">‹</span><span className="sr-only">Back</span></Link>
            </div>
            <div style={{ padding: '14px 24px 10px', textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--v2-font-body)', fontStyle: 'italic',
                fontSize: '15px', letterSpacing: '0.1em',
                color: 'var(--v2-text-strong, #eaeaea)',
              }}>短信</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px 10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool, #808080)', opacity: 0.4 }} />
              <span style={{ padding: '0 12px', color: 'var(--v2-text-mid, #b0b0b0)', fontSize: '11px' }}>&#8224;</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool, #808080)', opacity: 0.4 }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ padding: '20px 24px 0' }}>
              <Link href="/v2" style={{
                color: 'var(--v2-gold-cool, #b8a064)',
                fontStyle: 'italic',
                textDecoration: 'none',
                fontSize: '14px',
                letterSpacing: '0.1em',
              }} data-hisame-back="true" aria-label="Back to home"><span aria-hidden="true">‹</span><span className="sr-only">Back</span></Link>
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
              }}>I &mdash; Messages</div>
              <div style={{
                fontSize: '11px',
                color: 'var(--v2-ink-soft, #6a5f54)',
                letterSpacing: '0.4em',
                marginTop: '4px',
              }}>&#30701; &middot; &#20449;</div>
            </header>

            <div style={{
              padding: '12px 24px',
              fontSize: '11px',
              color: 'var(--v2-ink-soft, #6a5f54)',
              fontStyle: 'italic',
              letterSpacing: '0.1em',
              textAlign: 'center',
            }}>&#19978;&#27425;:5/20 21:18 PST</div>
          </>
        )}
      </div>

      <div data-room-scroll="true" style={{
        flex: 1,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '0 20px 100px',
      }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} text={m.text} time={m.time} image={m.image} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{
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
              <IconButton onClick={() => alert('camera (placeholder)')}><CameraIcon /></IconButton>
            </div>
          )}

          <input data-room-input="true"
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: 'none' }}
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
            placeholder="写点什么…"
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
              <button
                onClick={() => alert('add sticker (placeholder)')}
                style={{
                  width: '56px', height: '56px', borderRadius: '0',
                  border: '1px dashed var(--v2-gold-cool, #b8a064)',
                  background: 'transparent',
                  fontSize: '18px', color: 'var(--v2-gold-cool, #b8a064)',
                  cursor: 'pointer', margin: '0 auto',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >＋</button>
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

function MessageBubble({ role, text, time, image }: { role: 'z' | 'h', text: string, time: string, image?: string }) {
  const isZ = role === 'z'
  return (
    <div style={{ display: 'flex', justifyContent: isZ ? 'flex-start' : 'flex-end', marginBottom: '12px' }}>
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isZ ? 'flex-start' : 'flex-end' }}>
        <div style={{
          background: isZ ? 'var(--v2-magnolia-shade, rgba(255,253,247,0.85))' : 'var(--v2-magnolia, #f5ede0)',
          border: isZ ? '1px solid var(--v2-gold-cool, #b8a064)' : '1px solid rgba(184,160,100,0.3)',
          padding: image ? '4px' : '10px 14px',
          borderRadius: '0',
          borderBottomLeftRadius: isZ ? '4px' : '18px',
          borderBottomRightRadius: isZ ? '18px' : '4px',
          fontSize: '15px',
          lineHeight: 1.5,
          color: 'var(--v2-ink, #2a2521)',
          fontStyle: isZ ? 'normal' : 'italic',
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

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="18" height="13" rx="1.5" />
      <path d="M8 7 L9 4 L15 4 L16 7" />
      <circle cx="12" cy="13.5" r="3.5" />
      <circle cx="12" cy="13.5" r="0.7" fill="currentColor" stroke="none" />
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