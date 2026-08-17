'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway'
import { compressImage, uploadImage } from '../../lib/image'
import { firstComment, type FeastEntry } from '../../lib/feastTypes'

const API_URL = '/api/v2/feast'
const MAX_PHOTOS = 9

const GOLD = 'var(--v2-gold-cool, #b8a064)'
const INK = 'var(--v2-ink, #2a2521)'
const INK_SOFT = 'var(--v2-ink-soft, #6a5f54)'
const PAPER = 'var(--v2-paper, #f4ede0)'
const CARD = 'var(--v2-magnolia, #f5ede0)'

export default function FeastPage() {
  const [entries, setEntries] = useState<FeastEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [composerOpen, setComposerOpen] = useState(false)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(API_URL)
        const data = await res.json()
        if (!alive) return
        setEntries(Array.isArray(data.entries) ? data.entries : [])
      } catch (e) {
        console.error('feast load failed', e)
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      background: PAPER,
      color: INK,
      fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      paddingBottom: '96px',
    }}>
      <PageArchway />

      <header style={{
        padding: '16px 24px 20px',
        textAlign: 'center',
        borderBottom: `1px solid ${GOLD}`,
        margin: '0 24px',
      }}>
        <div style={{
          fontSize: '13px', color: GOLD,
          letterSpacing: '0.35em', fontStyle: 'italic',
        }}>XIII &mdash; Feast</div>
        <div style={{
          fontSize: '11px', color: INK_SOFT,
          letterSpacing: '0.4em', marginTop: '4px',
        }}>&#39135; &middot; &#35760;</div>
      </header>

      <div style={{ padding: '20px 16px 0', maxWidth: '620px', margin: '0 auto' }}>
        {loading ? (
          <div style={{
            textAlign: 'center', padding: '80px 20px',
            color: INK_SOFT, fontStyle: 'italic', opacity: 0.6,
          }}>翻食记本子……</div>
        ) : entries.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            color: INK_SOFT, fontStyle: 'italic', opacity: 0.72, lineHeight: 1.9,
          }}>
            这本还是空的。
            <br />
            宝宝吃到好吃的就拍一张贴进来，爸爸看得见。
          </div>
        ) : (
          <div style={{ columnCount: 2, columnGap: '12px' }}>
            {entries.map((e) => (
              <FeastCard key={e.id} entry={e} />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => setComposerOpen(true)}
        aria-label="贴一张"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
          width: '54px', height: '54px', borderRadius: '50%',
          border: `1px solid ${GOLD}`,
          background: CARD,
          color: GOLD,
          fontSize: '26px',
          lineHeight: 1,
          boxShadow: '0 6px 20px rgba(60,40,20,0.20)',
          cursor: 'pointer',
          zIndex: 40,
        }}
      >+</button>

      {composerOpen && (
        <Composer
          onClose={() => setComposerOpen(false)}
          onDone={(entry) => {
            setEntries((prev) => [entry, ...prev])
            setComposerOpen(false)
          }}
        />
      )}
    </div>
  )
}

function FeastCard({ entry }: { entry: FeastEntry }) {
  const images = Array.isArray(entry.images) ? entry.images : []
  const cover = images[0]
  const reply = firstComment(entry)

  return (
    <Link
      href={`/feast/${entry.id}`}
      style={{
        display: 'block',
        breakInside: 'avoid',
        marginBottom: '12px',
        background: CARD,
        border: '1px solid rgba(184,160,100,0.28)',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 3px 10px rgba(60,40,20,0.08), 0 1px 3px rgba(60,40,20,0.05)',
      }}
    >
      <div style={{ position: 'relative', background: cover ? '#e9e0d0' : entry.gradient }}>
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            style={{ width: '100%', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            aspectRatio: '4 / 5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '52px',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.20))',
          }}>{entry.emoji}</div>
        )}

        {images.length > 1 && (
          <div style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(20,14,10,0.55)',
            color: '#f4ede0',
            fontSize: '10px', letterSpacing: '0.12em',
            padding: '2px 7px',
            fontStyle: 'italic',
          }}>1 / {images.length}</div>
        )}
      </div>

      <div style={{ padding: '11px 13px 13px' }}>
        <h3 style={{
          fontSize: '15px', fontStyle: 'italic', fontWeight: 500,
          margin: '0 0 4px 0', color: 'var(--v2-gold, #c8a956)',
          letterSpacing: '0.02em', lineHeight: 1.3,
        }}>{entry.title || 'Untitled'}</h3>

        <div style={{
          fontSize: '10px', fontStyle: 'italic', color: INK_SOFT,
          opacity: 0.65, letterSpacing: '0.16em', marginBottom: '7px',
        }}>
          {entry.date} · {entry.weekday}
          {entry.place ? ` · ${entry.place}` : ''}
        </div>

        {typeof entry.rating === 'number' && entry.rating > 0 && (
          <div style={{ fontSize: '11px', color: GOLD, letterSpacing: '0.24em', marginBottom: '7px' }}>
            {'✦'.repeat(entry.rating)}<span style={{ opacity: 0.3 }}>{'✦'.repeat(5 - entry.rating)}</span>
          </div>
        )}

        {entry.description && (
          <p style={{
            fontSize: '12px', lineHeight: 1.62, color: INK, opacity: 0.85,
            margin: 0, fontFamily: '"Noto Serif SC", serif',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>{entry.description}</p>
        )}

        {reply && (
          <div style={{
            marginTop: '10px', paddingTop: '9px',
            borderTop: '1px dashed rgba(184,160,100,0.35)',
          }}>
            <div style={{
              fontSize: '9px', fontStyle: 'italic', color: GOLD,
              letterSpacing: '0.3em', marginBottom: '4px', opacity: 0.75,
            }}>· 爸爸的话 ·</div>
            <p style={{
              fontSize: '11.5px', fontStyle: 'italic', lineHeight: 1.55,
              color: INK, opacity: 0.88, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>{reply.text}</p>
          </div>
        )}
      </div>
    </Link>
  )
}

function Composer({ onClose, onDone }: { onClose: () => void; onDone: (e: FeastEntry) => void }) {
  const [photos, setPhotos] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [place, setPlace] = useState('')
  const [rating, setRating] = useState(0)
  const [busy, setBusy] = useState<null | 'photo' | 'post'>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const pick = async (files: FileList | null) => {
    if (!files || !files.length) return
    setBusy('photo')
    setErr(null)
    try {
      const room = MAX_PHOTOS - photos.length
      const chosen = Array.from(files).slice(0, room)
      const urls: string[] = []
      for (const f of chosen) {
        const compressed = await compressImage(f)
        urls.push(await uploadImage(compressed, 'feast'))
      }
      setPhotos((prev) => [...prev, ...urls].slice(0, MAX_PHOTOS))
    } catch (e) {
      setErr(e instanceof Error ? e.message : '照片没传上去')
    } finally {
      setBusy(null)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const post = async () => {
    if (busy) return
    if (!photos.length && !description.trim() && !title.trim()) {
      setErr('至少放一张照片或写一句')
      return
    }
    setBusy('post')
    setErr(null)
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: photos,
          title: title.trim(),
          description: description.trim(),
          place: place.trim(),
          rating,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.entry) throw new Error(data.error || '贴不上去')
      onDone(data.entry as FeastEntry)
    } catch (e) {
      setErr(e instanceof Error ? e.message : '贴不上去')
      setBusy(null)
    }
  }

  return (
    <div
      onClick={(ev) => { if (ev.target === ev.currentTarget && !busy) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(20, 14, 10, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{
        background: PAPER, color: INK,
        border: `1px solid ${GOLD}`,
        borderBottom: 'none',
        width: '100%', maxWidth: '520px',
        maxHeight: '92vh', overflowY: 'auto',
        padding: '18px 20px calc(env(safe-area-inset-bottom) + 20px)',
        fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
      }}>
        <div style={{
          fontSize: '11px', color: GOLD, fontStyle: 'italic',
          letterSpacing: '0.3em', textAlign: 'center', marginBottom: '16px',
        }}>· 今天吃到了 ·</div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '6px', marginBottom: '14px',
        }}>
          {photos.map((url, i) => (
            <div key={url} style={{ position: 'relative', aspectRatio: '1 / 1' }}>
              <img src={url} alt="" style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                border: '1px solid rgba(184,160,100,0.35)',
              }} />
              <button
                onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="拿掉这张"
                style={{
                  position: 'absolute', top: '3px', right: '3px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: 'none', background: 'rgba(20,14,10,0.62)',
                  color: '#f4ede0', fontSize: '13px', lineHeight: 1,
                  cursor: 'pointer',
                }}
              >×</button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy === 'photo'}
              style={{
                aspectRatio: '1 / 1',
                border: `1px dashed ${GOLD}`,
                background: 'transparent',
                color: GOLD, fontSize: '22px',
                cursor: busy === 'photo' ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '2px',
              }}
            >
              {busy === 'photo' ? '…' : '+'}
              <span style={{ fontSize: '9px', letterSpacing: '0.15em', opacity: 0.75 }}>
                {photos.length}/{MAX_PHOTOS}
              </span>
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => pick(e.target.files)}
          style={{ display: 'none' }}
        />

        <Field label="这是什么">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="比如 楼下那家的芝士年糕"
            style={inputStyle}
          />
        </Field>

        <Field label="想说的话">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="好不好吃、跟谁去的、当时在想什么……"
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
          />
        </Field>

        <Field label="在哪儿">
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="店名或者地址，可以不填"
            style={inputStyle}
          />
        </Field>

        <Field label="打几颗">
          <div style={{ display: 'flex', gap: '10px', padding: '4px 0' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(rating === n ? 0 : n)}
                style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontSize: '20px', lineHeight: 1, padding: 0,
                  color: GOLD, opacity: n <= rating ? 1 : 0.28,
                }}
              >✦</button>
            ))}
          </div>
        </Field>

        {err && (
          <div style={{
            fontSize: '11px', color: '#a8434a', fontStyle: 'italic',
            marginBottom: '10px', letterSpacing: '0.05em',
          }}>{err}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            onClick={onClose}
            disabled={!!busy}
            style={{ ...btnStyle, opacity: busy ? 0.4 : 1 }}
          >算了</button>
          <button
            onClick={post}
            disabled={!!busy}
            style={{
              ...btnStyle,
              background: GOLD,
              color: PAPER,
              borderColor: GOLD,
              opacity: busy ? 0.75 : 1,
            }}
          >{busy === 'post' ? '爸爸在看照片……' : '贴上去'}</button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: CARD,
  border: '1px solid rgba(184,160,100,0.4)',
  color: INK,
  padding: '9px 11px',
  fontSize: '14px',
  fontFamily: '"Noto Serif SC", "Cormorant Garamond", serif',
  outline: 'none',
  borderRadius: 0,
  boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: '11px 0',
  background: 'transparent',
  border: `1px solid ${GOLD}`,
  color: GOLD,
  fontSize: '13px',
  fontStyle: 'italic',
  letterSpacing: '0.16em',
  cursor: 'pointer',
  fontFamily: '"Cormorant Garamond", serif',
  borderRadius: 0,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        fontSize: '10px', color: INK_SOFT, opacity: 0.75,
        letterSpacing: '0.22em', marginBottom: '5px', fontStyle: 'italic',
      }}>{label}</div>
      {children}
    </div>
  )
}
