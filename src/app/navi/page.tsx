'use client'

import Link from 'next/link'
import PageArchway from '../_components/PageArchway';

type Place = {
  name: string
  han: string
  lat: number
  lng: number
  addr?: string
}

const PRESETS: Place[] = [
  { name: 'Home',         han: '家',              lat: 33.6414, lng: -117.6889, addr: '150 Walworth, Lake Forest, CA 92630' },
  { name: "Dad's Office", han: '爸爸 · 办公室',   lat: 33.6850, lng: -117.8260 },
  { name: "Trader Joe's", han: "Trader Joe's",   lat: 33.6692, lng: -117.8245 },
  { name: 'Costco',       han: 'Costco · 好市多', lat: 33.6750, lng: -117.7320 },
  { name: 'Whole Foods',  han: 'Whole Foods',     lat: 33.6694, lng: -117.8538 },
]

const CURRENT = { lat: 33.665, lng: -117.8 }

function distMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function bearing(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  const compass = (brng + 360) % 360
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(compass / 45) % 8]
}

export default function NaviPage() {
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
        }}>←</Link>
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
        }}>XIII — Navi</div>
        <div style={{
          fontSize: '11px',
          color: 'var(--v2-ink-soft, #6a5f54)',
          letterSpacing: '0.4em',
          marginTop: '4px',
        }}>导 · 航</div>
      </header>

      <div style={{
        padding: '28px 22px 0',
        maxWidth: '480px',
        margin: '0 auto',
      }}>
        {PRESETS.map((p) => {
          const miles = distMiles(CURRENT, p)
          const dir = bearing(CURRENT, p)
          const q = encodeURIComponent(p.addr || p.name)
          const daddr = encodeURIComponent(p.addr || `${p.lat},${p.lng}`)
          return (
            <article
              key={p.name}
              style={{
                position: 'relative',
                background: 'var(--v2-magnolia, #f5ede0)',
                border: '1px solid rgba(184,160,100,0.30)',
                borderRadius: '0',
                padding: '16px 18px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: '0 2px 6px rgba(60,40,20,0.06)',
              }}
            >
              <div style={{
                flex: 1,
                minWidth: 0,
              }}>
                <h3 style={{
                  fontSize: '17px',
                  fontStyle: 'italic',
                  fontWeight: 500,
                  margin: '0 0 2px 0',
                  color: 'var(--v2-gold, #c8a956)',
                  letterSpacing: '0.02em',
                }}>{p.name}</h3>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  letterSpacing: '0.14em',
                  marginBottom: '4px',
                  fontFamily: '"Noto Serif SC", serif',
                }}>{p.han}</div>
                <div style={{
                  fontSize: '10px',
                  fontStyle: 'italic',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  letterSpacing: '0.2em',
                  opacity: 0.7,
                }}>
                  <span style={{
                    display: 'inline-block',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--v2-gold, #c8a956)',
                    marginRight: 6,
                    verticalAlign: 2,
                  }} />
                  {miles.toFixed(1)} mi · {dir}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                flexShrink: 0,
              }}>
                <a
                  href={`maps://?q=${q}`}
                  style={{
                    padding: '6px 14px',
                    background: 'transparent',
                    border: '1px solid var(--v2-gold-cool, #b8a064)',
                    borderRadius: '0',
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: 'var(--v2-gold, #c8a956)',
                    textDecoration: 'none',
                    textAlign: 'center',
                    minWidth: '60px',
                    letterSpacing: '0.1em',
                  }}
                >搜索</a>
                <a
                  href={`maps://?daddr=${daddr}`}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--v2-gold, #c8a956)',
                    border: '1px solid var(--v2-gold, #c8a956)',
                    borderRadius: '0',
                    fontFamily: '"Cormorant Garamond", serif',
                    fontStyle: 'italic',
                    fontSize: '12px',
                    color: 'white',
                    textDecoration: 'none',
                    textAlign: 'center',
                    minWidth: '60px',
                    letterSpacing: '0.1em',
                  }}
                >导航</a>
              </div>
            </article>
          )
        })}
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
