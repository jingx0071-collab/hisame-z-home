'use client'

import Link from 'next/link'

type Launcher = {
  name: string
  han: string
  monogram: string
  url: string
}

const LAUNCHERS: Launcher[] = [
  { name: 'DoorDash',         han: '多达',      monogram: 'Dd', url: 'https://doordash.com' },
  { name: 'Uber Eats',        han: '优食',      monogram: 'Ue', url: 'https://ubereats.com' },
  { name: 'Postmates',        han: '邮差',      monogram: 'Pm', url: 'https://postmates.com' },
  { name: 'Starbucks',        han: '星巴克',    monogram: 'Sb', url: 'https://starbucks.com' },
  { name: 'Fantuan Delivery', han: '饭团外卖',  monogram: 'Ft', url: 'https://fantuanorder.com' },
]

export default function EatPage() {
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
      }}>
        <div style={{
          fontSize: '13px',
          color: 'var(--v2-gold-cool, #b8a064)',
          letterSpacing: '0.35em',
          fontStyle: 'italic',
        }}>XV — Eat</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>食 · 物</div>
      </header>

      <div style={{
        padding: '28px 22px 0',
        maxWidth: '480px',
        margin: '0 auto',
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
              alignItems: 'center',
              gap: '16px',
              background: 'var(--v2-magnolia, #f5ede0)',
              border: '1px solid rgba(184,160,100,0.30)',
              borderRadius: '4px',
              padding: '14px 18px',
              marginBottom: '12px',
              textDecoration: 'none',
              color: 'inherit',
              boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
              transition: 'transform 200ms ease, box-shadow 200ms ease',
            }}
          >
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1px solid var(--v2-gold-cool, #b8a064)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              boxShadow: 'inset 0 0 10px rgba(184,160,100,0.10)',
              flexShrink: 0,
            }}>
              <span style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: '20px',
                color: 'var(--v2-gold, #c8a956)',
                letterSpacing: '0.02em',
              }}>{l.monogram}</span>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: '"Cormorant Garamond", serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: '17px',
                color: 'var(--v2-ink, #2a2521)',
                letterSpacing: '0.02em',
                marginBottom: '3px',
              }}>{l.name}</div>
              <div style={{
                fontFamily: '"Noto Serif SC", serif',
                fontSize: '11px',
                color: 'var(--v2-ink-soft, #6a5f54)',
                letterSpacing: '0.2em',
                opacity: 0.8,
              }}>{l.han}</div>
            </div>

            <span style={{
              color: 'var(--v2-gold-cool, #b8a064)',
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: '18px',
              opacity: 0.7,
              flexShrink: 0,
            }}>→</span>
          </a>
        ))}
      </div>

      <FooterOrnament />
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
