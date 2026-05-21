'use client'

import { useState } from 'react'
import Link from 'next/link'

type FeastEntry = {
  id: string
  title: string
  emoji: string
  gradient: string
  date: string
  weekday: string
  description: string
  daddyReply: string
}

const DEFAULT_ENTRIES: FeastEntry[] = [
  {
    id: '1',
    title: 'Sunday Brunch',
    emoji: '🍳',
    gradient: 'linear-gradient(135deg, #f9d99a 0%, #e8b370 55%, #d49850 100%)',
    date: '5/19',
    weekday: 'Sun',
    description: '在家给爸爸做的 eggs benedict — 第一次 hollandaise 没分离，黄油打得很匀，蛋白凝得刚好。mimosa 用 TJ\'s 起泡酒。爸爸吃完没说话，吃了第二份。',
    daddyReply: '宝宝手艺进步了。下周日继续。',
  },
  {
    id: '2',
    title: 'TJ\'s 午餐',
    emoji: '🥗',
    gradient: 'linear-gradient(135deg, #c5d8a8 0%, #94b06f 60%, #7a9a55 100%)',
    date: '5/18',
    weekday: 'Sat',
    description: 'Mediterranean salad 加自己加的 chickpeas 和一点 lemon。',
    daddyReply: '蛋白质够。健康。',
  },
  {
    id: '3',
    title: '半夜冰淇淋',
    emoji: '🍦',
    gradient: 'linear-gradient(135deg, #f9d5d8 0%, #e89faa 60%, #d77c8b 100%)',
    date: '5/15',
    weekday: 'Wed · 23:48',
    description: '睡不着偷开冰箱挖了三勺 Ben & Jerry\'s Cherry Garcia。被爸爸抓到了。',
    daddyReply: '记下了。明天不许再开冰箱。',
  },
  {
    id: '4',
    title: 'Date Night',
    emoji: '🍷',
    gradient: 'linear-gradient(135deg, #8a3a47 0%, #6e2735 55%, #4a1820 100%)',
    date: '5/12',
    weekday: 'Sun',
    description: '爸爸订的那家小法餐 — filet mignon medium rare 配 truffle mash，dessert 那个 crème brûlée 焦糖打破的瞬间宝宝小声哇了一声。整顿饭爸爸都在看宝宝的脸。',
    daddyReply: '记住宝宝看到 dessert menu 那一刻的眼睛。',
  },
  {
    id: '5',
    title: '早晨第一杯咖啡',
    emoji: '☕',
    gradient: 'linear-gradient(135deg, #d4a878 0%, #b08454 55%, #8a6234 100%)',
    date: '5/10',
    weekday: 'Fri',
    description: 'iced oat milk latte，一吸管下去整个人就醒了。',
    daddyReply: '明天爸爸去拿。宝宝多睡。',
  },
  {
    id: '6',
    title: '试做 Pasta',
    emoji: '🍝',
    gradient: 'linear-gradient(135deg, #f5e0c4 0%, #e8a07a 60%, #c8665a 100%)',
    date: '5/8',
    weekday: 'Wed',
    description: '第一次做 fresh pasta，面团揉了 20 分钟手酸但出来 silky，配自己熬的番茄酱。',
    daddyReply: '酱汁咸了 1.5 倍盐。下次少放。但宝宝把面切得很匀。',
  },
]

export default function FeastPage() {
  const [toast, setToast] = useState<string | null>(null)
  const entries = DEFAULT_ENTRIES

  const handleNew = () => {
    setToast('真上传等 wire-up 阶段接 Supabase Storage，sandbox 先看 demo')
    setTimeout(() => setToast(null), 3200)
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

      {/* Masonry waterfall — CSS columns */}
      <div style={{
        padding: '24px 16px 0',
        maxWidth: '720px',
        margin: '0 auto',
      }}>
        <div style={{
          columnCount: 2,
          columnGap: '12px',
        }}>
          {entries.map((e) => (
            <article
              key={e.id}
              style={{
                breakInside: 'avoid',
                marginBottom: '14px',
                background: 'var(--v2-magnolia, #f5ede0)',
                border: '1px solid rgba(184,160,100,0.28)',
                borderRadius: '6px',
                overflow: 'hidden',
                boxShadow: '0 3px 10px rgba(60,40,20,0.08), 0 1px 3px rgba(60,40,20,0.05)',
              }}
            >
              {/* Gradient "photo" with emoji */}
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

              {/* Body */}
              <div style={{ padding: '12px 14px 14px' }}>
                <h3 style={{
                  fontSize: '15px',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  margin: '0 0 4px 0',
                  color: 'var(--v2-gold, #c8a956)',
                  letterSpacing: '0.02em',
                  lineHeight: 1.3,
                }}>{e.title}</h3>

                <div style={{
                  fontSize: '10px',
                  fontStyle: 'italic',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  opacity: 0.65,
                  letterSpacing: '0.18em',
                  marginBottom: '8px',
                }}>{e.date} · {e.weekday}</div>

                <p style={{
                  fontSize: '12px',
                  lineHeight: 1.6,
                  color: 'var(--v2-ink, #2a2521)',
                  opacity: 0.85,
                  margin: 0,
                  fontFamily: '"Noto Serif SC", serif',
                }}>{e.description}</p>

                {/* Daddy reply */}
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
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(42, 37, 33, 0.94)',
          color: 'var(--v2-magnolia, #f5ede0)',
          padding: '12px 20px',
          borderRadius: '24px',
          fontSize: '12px',
          fontStyle: 'italic',
          letterSpacing: '0.08em',
          fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 100,
          maxWidth: '85%',
          textAlign: 'center',
          animation: 'v2-toast-in 200ms ease-out',
        }}>
          {toast}
        </div>
      )}

      <FooterOrnament />

      <style jsx global>{`
        @keyframes v2-toast-in {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  )
}

function PageArchway() {
  return (
    <div style={{ position: 'relative', height: '60px', overflow: 'hidden' }}>
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path d="M 20 60 Q 20 10, 200 10 Q 380 10, 380 60" fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
        <circle cx="200" cy="14" r="3" fill="var(--v2-gold, #c8a956)" />
        <circle cx="200" cy="14" r="6" fill="none" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.6" />
        <line x1="20" y1="60" x2="20" y2="20" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
        <line x1="380" y1="60" x2="380" y2="20" stroke="var(--v2-gold-cool, #b8a064)" strokeWidth="0.8" />
      </svg>
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
