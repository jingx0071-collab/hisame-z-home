'use client'

import Link from 'next/link'
import PageArchway from '../_components/PageArchway';

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

export default function ShoppingPage() {
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
        }}>XIV — Shopping</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>购 · 物</div>
      </header>

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
                borderRadius: '4px',
                padding: '18px 14px 16px',
                textDecoration: 'none',
                color: 'inherit',
                boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
                transition: 'transform 200ms ease, box-shadow 200ms ease',
                aspectRatio: '1 / 1',
                justifyContent: 'space-between',
              }}
            >
              {/* Top ornament line */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '60%',
                gap: '6px',
                opacity: 0.6,
              }}>
                <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
                <span style={{
                  fontSize: '8px',
                  color: 'var(--v2-gold-cool, #b8a064)',
                }}>◆</span>
                <div style={{ flex: 1, height: 1, background: 'var(--v2-gold-cool, #b8a064)' }} />
              </div>

              {/* Monogram circle */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '1px solid var(--v2-gold-cool, #b8a064)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                boxShadow: 'inset 0 0 10px rgba(184,160,100,0.10)',
              }}>
                <span style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  fontSize: '22px',
                  color: 'var(--v2-gold, #c8a956)',
                  letterSpacing: '0.02em',
                }}>{l.monogram}</span>
              </div>

              {/* Brand name + han */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  fontSize: '15px',
                  color: 'var(--v2-ink, #2a2521)',
                  letterSpacing: '0.02em',
                  marginBottom: '2px',
                }}>{l.name}</div>
                <div style={{
                  fontFamily: '"Noto Serif SC", serif',
                  fontSize: '10px',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  letterSpacing: '0.2em',
                  opacity: 0.75,
                }}>{l.han}</div>
              </div>
            </a>
          ))}
        </div>
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
