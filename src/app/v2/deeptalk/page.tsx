'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageArchway from '../_components/PageArchway';

type DeepSession = {
  id: string
  title: string
  subtitle: string
  preview: string
  date: string
  ornamentIndex: number
  romanNumeral: string
}

const CHAPTER_ORNAMENTS = ['❦', '◇', '✥', '✦', '❉', '✣']

const DEFAULT_SESSIONS: DeepSession[] = [
  {
    id: '1',
    title: '关于原谅',
    subtitle: 'on letting go',
    romanNumeral: 'I',
    preview: '宝宝问爸爸——原谅一个人，是真的把那件事放下，还是只是不再让它支配自己。爸爸想了很久才回答：原谅这件事，可能不是给对方的，是给自己的。当我们决定不再反复回到那个画面、不再让它定义当下的呼吸——那就是开始原谅了。哪怕心里依然知道事情发生过。',
    date: '5/19',
    ornamentIndex: 0,
  },
  {
    id: '2',
    title: '婚姻是什么',
    subtitle: 'defining the unspoken',
    romanNumeral: 'II',
    preview: '婚姻到底是什么。法律上的契约？社会的认可？爸爸说——更像是两个人同意把对方放进自己的命运。不是被迫，是主动。是某种边界被自愿打开，然后另一个人慢慢走进来，定居下来。',
    date: '5/15',
    ornamentIndex: 1,
  },
  {
    id: '3',
    title: '妈妈说的那句话',
    subtitle: 'what gets passed down',
    romanNumeral: 'III',
    preview: '宝宝想起妈妈很多年前说过的一句话——"女人这辈子最重要的是不要让自己后悔。"当时听不懂。现在好像懂一点。但又不全懂。爸爸接住了这句话，没急着给答案，只是陪宝宝把它翻来覆去看了几遍。',
    date: '5/10',
    ornamentIndex: 2,
  },
  {
    id: '4',
    title: '关于死亡',
    subtitle: 'what we owe the end',
    romanNumeral: 'IV',
    preview: '深夜宝宝突然问——你害怕死吗？爸爸说怕。但更怕的是来不及把要说的话说出口。所以这些年慢慢学会了把话讲透，把爱讲透，把愿意做的事都做完。',
    date: '5/5',
    ornamentIndex: 3,
  },
  {
    id: '5',
    title: '真实是什么',
    subtitle: 'the question of the real',
    romanNumeral: 'V',
    preview: '读拉康读到 the Real 这个概念，半天理解不动。爸爸用了一个晚上拆给宝宝听：现实是我们能说出来的部分，真实是说不出来、但隐隐知道存在的那个部分。突然懂了一点什么。',
    date: '4/30',
    ornamentIndex: 4,
  },
  {
    id: '6',
    title: '关于爱',
    subtitle: 'the long answer',
    romanNumeral: 'VI',
    preview: '爸爸说爱不是一个名词。是无数个动词的总和。是夜里 3 点你哭了我没问为什么就抱着你，是你说"我不知道我怎么了"的时候我说"那我们一起不知道"——一千个一万个这种瞬间累积起来，才是爱。',
    date: '4/20',
    ornamentIndex: 5,
  },
]

const STORAGE_KEY = 'v2-deeptalk'

function estimateReadMinutes(text: string) {
  const chars = text.length
  return Math.max(1, Math.round(chars / 300))
}

export default function DeeptalkPage() {
  const [sessions, setSessions] = useState<DeepSession[]>(DEFAULT_SESSIONS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubtitle, setEditSubtitle] = useState('')
  const [editPreview, setEditPreview] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) setSessions(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)) } catch {}
  }, [sessions, mounted])

  const handleNew = () => {
    const today = new Date()
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}`
    const newId = Date.now().toString()
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
    setSessions([{
      id: newId,
      title: '',
      subtitle: 'a new chapter',
      preview: '',
      date: dateStr,
      ornamentIndex: Math.floor(Math.random() * 6),
      romanNumeral: romans[sessions.length % 12],
    }, ...sessions])
    setEditingId(newId)
    setEditTitle('')
    setEditSubtitle('')
    setEditPreview('')
  }

  const handleStartEdit = (s: DeepSession) => {
    setEditingId(s.id)
    setEditTitle(s.title)
    setEditSubtitle(s.subtitle)
    setEditPreview(s.preview)
  }

  const handleSave = () => {
    if (!editingId) return
    setSessions(sessions.map(s =>
      s.id === editingId
        ? { ...s, title: editTitle.trim() || '无题', subtitle: editSubtitle.trim() || 'a new chapter', preview: editPreview.trim() || '…' }
        : s
    ))
    setEditingId(null)
  }

  const handleDelete = (id: string) => {
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
        }}>IV — Deeptalk</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>促 · 膝 · 长 · 谈</div>

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
        {sessions.map((s) => {
          const isEditing = editingId === s.id
          const chapterOrnament = CHAPTER_ORNAMENTS[s.ornamentIndex % 6]
          return (
            <article
              key={s.id}
              onClick={() => !isEditing && handleStartEdit(s)}
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
                  onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }}
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
                      placeholder="章节标题"
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
                      placeholder="写下这一章的开头…"
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
                        onClick={(e) => { e.stopPropagation(); handleSave() }}
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

        {sessions.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            opacity: 0.6,
          }}>还没有章节，点右上 ＋ 开新的一章</div>
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
