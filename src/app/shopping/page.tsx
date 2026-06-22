'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import PageArchway from '../_components/PageArchway';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Launcher = {
  name: string
  han: string
  monogram: string
  url: string
}

const LAUNCHERS: Launcher[] = [
  { name: 'Amazon',      han: '亚马逊',    monogram: 'Am', url: 'https://amazon.com' },
  { name: 'Target',      han: '塔吉特',    monogram: 'Tg', url: 'https://target.com' },
  { name: 'Sephora',     han: '丝芙兰',    monogram: 'Se', url: 'https://sephora.com' },
  { name: 'Temu',        han: '拼多多',    monogram: 'Tm', url: 'https://temu.com' },
  { name: 'Shein',       han: '希音',      monogram: 'Sh', url: 'https://shein.com' },
  { name: 'AliExpress',  han: '速卖通',    monogram: 'Ae', url: 'https://aliexpress.com' },
  { name: 'Skims',       han: 'by Kim K',  monogram: 'Sk', url: 'https://skims.com' },
  { name: 'Yami',        han: '亚米',      monogram: 'Ya', url: 'https://yamibuy.com' },
]

// ============ Wishlist types ============

type Item = {
  id: string
  name: string
  category: string | null
  status: 'want' | 'bought'
  link: string | null
  note: string | null
  priority: number
  createdAt: string
}

type DBItem = {
  id: string
  name: string
  category: string | null
  status: string | null
  link: string | null
  note: string | null
  priority: number | null
  created_at: string
}

function dbToItem(r: DBItem): Item {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    status: r.status === 'bought' ? 'bought' : 'want',
    link: r.link,
    note: r.note,
    priority: r.priority ?? 2,
    createdAt: r.created_at,
  }
}

// ============ Page ============

export default function ShoppingPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'want' | 'bought'>('all')

  // draft
  const [draftName, setDraftName] = useState('')
  const [draftLink, setDraftLink] = useState('')
  const [draftNote, setDraftNote] = useState('')
  const [draftCategory, setDraftCategory] = useState('')
  const [draftPriority, setDraftPriority] = useState(2)

  useEffect(() => {
    async function fetchItems() {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) {
        console.error('fetch shopping_items', error)
        setLoading(false)
        return
      }
      setItems((data as DBItem[]).map(dbToItem))
      setLoading(false)
    }
    fetchItems()
  }, [])

  function resetDraft() {
    setDraftName('')
    setDraftLink('')
    setDraftNote('')
    setDraftCategory('')
    setDraftPriority(2)
  }

  function openNew() {
    resetDraft()
    setEditingId(null)
    setShowForm(true)
  }

  function openEdit(item: Item) {
    setDraftName(item.name)
    setDraftLink(item.link ?? '')
    setDraftNote(item.note ?? '')
    setDraftCategory(item.category ?? '')
    setDraftPriority(item.priority)
    setEditingId(item.id)
    setShowForm(true)
  }

  function closeForm() {
    resetDraft()
    setEditingId(null)
    setShowForm(false)
  }

  async function handleSave() {
    if (!draftName.trim()) return
    const payload = {
      name: draftName.trim(),
      link: draftLink.trim() || null,
      note: draftNote.trim() || null,
      category: draftCategory.trim() || null,
      priority: draftPriority,
    }
    if (editingId) {
      const { data, error } = await supabase
        .from('shopping_items')
        .update(payload)
        .eq('id', editingId)
        .select()
        .single()
      if (error) { console.error('update shopping_items', error); return }
      setItems(prev => prev.map(i => i.id === editingId ? dbToItem(data as DBItem) : i))
    } else {
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({ ...payload, status: 'want' })
        .select()
        .single()
      if (error) { console.error('insert shopping_items', error); return }
      setItems(prev => sortItems([dbToItem(data as DBItem), ...prev]))
    }
    closeForm()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from('shopping_items')
      .delete()
      .eq('id', id)
    if (error) { console.error('delete shopping_items', error); return }
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function handleToggleStatus(item: Item) {
    const next: 'want' | 'bought' = item.status === 'want' ? 'bought' : 'want'
    const { data, error } = await supabase
      .from('shopping_items')
      .update({ status: next })
      .eq('id', item.id)
      .select()
      .single()
    if (error) { console.error('toggle status', error); return }
    setItems(prev => prev.map(i => i.id === item.id ? dbToItem(data as DBItem) : i))
  }

  function sortItems(list: Item[]): Item[] {
    return [...list].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority
      return b.createdAt.localeCompare(a.createdAt)
    })
  }

  const filtered = items.filter(i => filter === 'all' ? true : i.status === filter)

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
        <Link href="/" style={{
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
      }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.35em',
          fontStyle: 'italic',
        }}>XIV — Shopping</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>购 · 物</div>
      </header>

      {/* ============ Launcher grid ============ */}
      <div style={{
        padding: '32px 22px 0',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px',
        }}>
          {LAUNCHERS.map((l) => (
            <a
              key={l.name}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'var(--v2-magnolia, #f5ede0)',
                border: '1px solid rgba(184,160,100,0.30)',
                borderRadius: '0',
                padding: '18px 14px 16px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                aspectRatio: '1 / 1',
                justifyContent: 'space-between',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '60%',
                gap: '6px',
                opacity: 0.6,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
                <span style={{ fontSize: '8px', color: 'var(--v2-gold-cool, #b8a064)' }}>◆</span>
                <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
              </div>

              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                border: '1px solid var(--v2-gold-cool, #b8a064)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent',
                boxShadow: 'inset 0 0 10px rgba(184,160,100,0.10)',
              }}>
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic', fontWeight: 500, fontSize: '22px',
                  color: 'var(--v2-gold, #c8a956)', letterSpacing: '0.02em',
                }}>{l.monogram}</span>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic', fontWeight: 500, fontSize: '15px',
                  color: 'var(--v2-ink, #2a2521)', letterSpacing: '0.02em',
                  marginBottom: '2px',
                }}>{l.name}</div>
                <div style={{
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: '10px', color: 'var(--v2-ink-soft, #6a5f54)',
                  letterSpacing: '0.2em', opacity: 0.75,
                }}>{l.han}</div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ============ Section divider ============ */}
      <div style={{
        maxWidth: '480px',
        margin: '48px auto 0',
        padding: '0 22px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          opacity: 0.7,
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
          <span style={{ fontSize: '10px', color: 'var(--v2-gold-cool, #b8a064)', letterSpacing: '0.3em' }}>◆ ◆ ◆</span>
          <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
        </div>
      </div>

      {/* ============ Wishlist section ============ */}
      <div style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: '28px 22px 0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            fontSize: '13px',
            color: 'var(--v2-gold-cool, #b8a064)',
            letterSpacing: '0.35em',
            fontStyle: 'italic',
          }}>Wishlist</div>
          <div style={{
            fontSize: '10px',
            color: 'var(--v2-ink-soft, #6a5f54)',
            letterSpacing: '0.4em',
            marginTop: '4px',
          }}>心 仪 之 物</div>
        </div>

        {/* Control bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          gap: '12px',
        }}>
          <button
            onClick={openNew}
            style={{
              background: 'transparent',
              border: '1px solid var(--v2-gold-cool, #b8a064)',
              color: 'var(--v2-gold, #c8a956)',
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '14px',
              letterSpacing: '0.1em',
              padding: '8px 18px',
              borderRadius: '0',
              cursor: 'pointer',
            }}
          >+ new</button>

          <div style={{ display: 'flex', gap: '6px' }}>
            {(['all', 'want', 'bought'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  background: filter === f ? 'var(--v2-gold-cool, #b8a064)' : 'transparent',
                  color: filter === f ? '#fff' : 'var(--v2-ink-soft, #6a5f54)',
                  border: '1px solid var(--v2-gold-cool, #b8a064)',
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  padding: '6px 10px',
                  borderRadius: '0',
                  cursor: 'pointer',
                }}
              >{f === 'all' ? '全部' : f === 'want' ? '想要' : '已买'}</button>
            ))}
          </div>
        </div>

        {/* New / edit form */}
        {showForm && (
          <div style={{
            background: 'var(--v2-magnolia, #f5ede0)',
            border: '1px solid rgba(184,160,100,0.40)',
            borderRadius: '0',
            padding: '16px 14px',
            marginBottom: '18px',
            boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
          }}>
            <input
              placeholder="name *"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="link (optional)"
              value={draftLink}
              onChange={e => setDraftLink(e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="category (optional)"
              value={draftCategory}
              onChange={e => setDraftCategory(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder="note (optional)"
              value={draftNote}
              onChange={e => setDraftNote(e.target.value)}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--v2-ink-soft, #6a5f54)', letterSpacing: '0.2em' }}>priority</span>
              {[1, 2, 3].map(p => (
                <button
                  key={p}
                  onClick={() => setDraftPriority(p)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: draftPriority >= p ? 'var(--v2-gold, #c8a956)' : 'rgba(184,160,100,0.30)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                >◆</button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={closeForm} style={btnGhost}>cancel</button>
              <button onClick={handleSave} style={btnPrimary}>save</button>
            </div>
          </div>
        )}

        {/* Items list */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            padding: '32px 0',
            fontSize: '13px',
          }}>loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic',
            padding: '32px 0',
            fontSize: '13px',
            opacity: 0.6,
          }}>
            {items.length === 0 ? '还没有添加心仪的东西' : '此筛选下暂无'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--v2-magnolia, #f5ede0)',
                  border: '1px solid rgba(184,160,100,0.30)',
                  borderRadius: '0',
                  padding: '14px 16px',
                  boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
                  opacity: item.status === 'bought' ? 0.55 : 1,
                  transition: 'opacity 200ms ease',
                }}
              >
                {/* top row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: '"Cormorant Garamond", serif',
                      fontStyle: 'italic',
                      fontWeight: 500,
                      fontSize: '17px',
                      color: 'var(--v2-ink, #2a2521)',
                      textDecoration: item.status === 'bought' ? 'line-through' : 'none',
                      marginBottom: '4px',
                      wordBreak: 'break-word',
                    }}>{item.name}</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--v2-gold, #c8a956)', fontSize: '11px', letterSpacing: '0.1em' }}>
                        {'◆'.repeat(item.priority)}
                      </span>
                      {item.category && (
                        <span style={{
                          fontFamily: '"Noto Serif SC", serif',
                          fontSize: '10px',
                          color: 'var(--v2-ink-soft, #6a5f54)',
                          letterSpacing: '0.15em',
                          opacity: 0.75,
                          padding: '1px 6px',
                          border: '1px solid rgba(184,160,100,0.30)',
                          borderRadius: '0',
                        }}>{item.category}</span>
                      )}
                      <button
                        onClick={() => handleToggleStatus(item)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          fontFamily: '"Noto Serif SC", serif',
                          fontSize: '10px',
                          color: item.status === 'bought' ? 'var(--v2-gold, #c8a956)' : 'var(--v2-ink-soft, #6a5f54)',
                          letterSpacing: '0.2em',
                          cursor: 'pointer',
                          padding: '0',
                        }}
                      >{item.status === 'bought' ? '✓ 已买' : '○ 想要'}</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button onClick={() => openEdit(item)} style={iconBtn}>✎</button>
                    <button onClick={() => handleDelete(item.id)} style={iconBtn}>×</button>
                  </div>
                </div>

                {/* note */}
                {item.note && (
                  <div style={{
                    fontFamily: '"Noto Serif SC", serif',
                    fontSize: '12px',
                    color: 'var(--v2-ink-soft, #6a5f54)',
                    marginTop: '8px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                  }}>{item.note}</div>
                )}

                {/* link */}
                {item.link && (
                  <div style={{ marginTop: '8px' }}>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontFamily: '"Cormorant Garamond", serif',
                        fontStyle: 'italic',
                        fontSize: '12px',
                        color: 'var(--v2-gold-cool, #b8a064)',
                        letterSpacing: '0.1em',
                        textDecoration: 'none',
                      }}
                    >open link →</a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <FooterOrnament />
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(255,255,255,0.5)',
  border: '1px solid rgba(184,160,100,0.30)',
  borderRadius: '0',
  padding: '8px 10px',
  marginBottom: '10px',
  fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
  fontSize: '14px',
  color: 'var(--v2-ink, #2a2521)',
  outline: 'none',
  boxSizing: 'border-box',
}

const btnPrimary: React.CSSProperties = {
  background: 'var(--v2-gold-cool, #b8a064)',
  color: '#fff',
  border: 'none',
  fontFamily: '"Cormorant Garamond", serif',
  fontStyle: 'italic',
  fontSize: '13px',
  letterSpacing: '0.1em',
  padding: '7px 16px',
  borderRadius: '0',
  cursor: 'pointer',
}

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--v2-ink-soft, #6a5f54)',
  border: '1px solid rgba(184,160,100,0.40)',
  fontFamily: '"Cormorant Garamond", serif',
  fontStyle: 'italic',
  fontSize: '13px',
  letterSpacing: '0.1em',
  padding: '7px 16px',
  borderRadius: '0',
  cursor: 'pointer',
}

const iconBtn: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--v2-ink-soft, #6a5f54)',
  fontSize: '14px',
  cursor: 'pointer',
  padding: '2px 6px',
  lineHeight: 1,
}

function FooterOrnament() {
  return (
    <div style={{
      textAlign: 'center', padding: '40px 0 16px',
      color: 'var(--v2-gold-cool, #b8a064)',
      fontSize: '14px', letterSpacing: '0.5em',
    }}>· · ·</div>
  )
}
