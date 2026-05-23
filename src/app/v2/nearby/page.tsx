'use client';

/**
 * /v2/nearby — XII · 附近
 *
 * Sub-page of the v2 PWA. Follows the v2 design system tokens:
 *   --v2-paper / --v2-ink / --v2-gold / --v2-gold-cool / --v2-magnolia
 * Day/night switching is driven by the global v2 theme provider (this page
 * does NOT toggle it locally — kept consistent with the other 11 sub-pages).
 *
 * Only external libs allowed here: react-leaflet + leaflet.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// react-leaflet has window references — must be client-only
const NearbyMap = dynamic(() => import('./NearbyMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 320,
        background: 'var(--v2-paper-deep, var(--v2-paper))',
      }}
    />
  ),
});

const TOGETHER_KEY = 'v2-nearby-together-mode';

const CURRENT = { lat: 33.665, lng: -117.8, name: 'Irvine, CA', han: '尔湾 · 加州' };

export default function NearbyPage() {
  const [together, setTogether] = useState(false);
  const [now, setNow] = useState<string>('');

  // hydrate from localStorage
  useEffect(() => {
    try {
      setTogether(localStorage.getItem(TOGETHER_KEY) === 'true');
    } catch {}
  }, []);

  // ticking timestamp
  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      );
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const onToggleTogether = () => {
    setTogether((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(TOGETHER_KEY, String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div
      style={{
        maxWidth: 420,
        margin: '0 auto',
        padding: '0 0 56px',
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--v2-paper)',
        color: 'var(--v2-ink)',
        fontFamily: '"Noto Serif SC", "Songti SC", serif',
        fontWeight: 300,
      }}
    >
      {/* 1. PageArchway */}
      <PageArchway />

      {/* 2. Back link */}
      <Link
        href="/v2"
        style={{
          position: 'absolute',
          top: 72,
          left: 22,
          fontFamily: '"Cormorant Garamond", serif',
          fontStyle: 'italic',
          fontSize: 13,
          letterSpacing: '0.08em',
          color: 'var(--v2-gold)',
          textDecoration: 'none',
          zIndex: 3,
        }}
      >
        ← back
      </Link>

      {/* 3. Header */}
      <header
        style={{ textAlign: 'center', padding: '22px 24px 0', marginTop: 28 }}
      >
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: 13,
            letterSpacing: '0.35em',
            color: 'var(--v2-gold)',
            margin: 0,
          }}
        >
          XII — Nearby
        </h1>
        <p
          style={{
            fontFamily: '"Noto Serif SC", serif',
            fontWeight: 300,
            fontSize: 11,
            letterSpacing: '0.4em',
            color: 'var(--v2-ink-soft, var(--v2-ink))',
            margin: '10px 0 18px',
          }}
        >
          附 · 近
        </p>
        <div
          style={{
            width: 56,
            height: 1,
            background: 'var(--v2-gold)',
            margin: '0 auto',
            opacity: 0.85,
          }}
        />
      </header>

      {/* 4. Together pill */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          margin: '26px 0 22px',
        }}
      >
        <button
          type="button"
          onClick={onToggleTogether}
          aria-pressed={together}
          style={{
            appearance: 'none',
            background: together ? 'var(--v2-gold)' : 'transparent',
            border: '1px solid var(--v2-gold)',
            color: together
              ? 'var(--v2-magnolia)'
              : 'var(--v2-ink-soft, var(--v2-ink))',
            height: 44,
            padding: '0 28px',
            borderRadius: 22,
            fontFamily: '"Noto Serif SC", serif',
            fontWeight: 300,
            fontSize: 13,
            letterSpacing: together ? '0.22em' : '0.18em',
            fontStyle: 'italic',
            cursor: 'pointer',
            transition:
              'background .35s ease, color .35s ease, letter-spacing .35s ease',
          }}
        >
          {together ? '我 · 们 · 在 · 一 · 起' : '我 · 们 · 各 · 自'}
        </button>
      </div>

      {/* 5. Map */}
      <div
        style={{
          margin: '0 24px',
          padding: 6,
          border: '1px solid var(--v2-gold)',
          borderRadius: 6,
          background: 'var(--v2-paper)',
        }}
      >
        <div
          style={{
            border: '1px solid var(--v2-gold-cool)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <NearbyMap current={CURRENT} />
        </div>
      </div>

      {/* 6. Current-location card */}
      <div
        style={{
          margin: '18px 24px 0',
          padding: '14px 18px',
          background: 'var(--v2-magnolia)',
          border: '1px solid var(--v2-gold-cool)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontSize: 10,
              letterSpacing: '0.3em',
              color: 'var(--v2-ink-faint, var(--v2-ink))',
              textTransform: 'uppercase',
            }}
          >
            current location
          </span>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontStyle: 'italic',
              fontWeight: 500,
              fontSize: 17,
              color: 'var(--v2-gold)',
              letterSpacing: '0.02em',
            }}
          >
            {CURRENT.name}
          </span>
          <span
            style={{
              fontFamily: '"Noto Serif SC", serif',
              fontSize: 11,
              color: 'var(--v2-ink-soft, var(--v2-ink))',
              letterSpacing: '0.2em',
              marginTop: 2,
            }}
          >
            {CURRENT.han}
          </span>
        </div>
        <div
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontStyle: 'italic',
            fontSize: 11,
            color: 'var(--v2-ink-faint, var(--v2-ink))',
            textAlign: 'right',
            letterSpacing: '0.06em',
            lineHeight: 1.45,
          }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'var(--v2-gold)',
              marginRight: 6,
              verticalAlign: 1,
            }}
          />
          <span>updated {now}</span>
          <br />
          <span style={{ color: 'var(--v2-ink-faint, var(--v2-ink))' }}>
            ±18 m
          </span>
        </div>
      </div>

      {/* 7. FooterOrnament */}
      <div
        aria-hidden
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          margin: '42px 0 0',
          color: 'var(--v2-gold)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--v2-gold)',
              display: 'inline-block',
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────── PageArchway ─────────── */
function PageArchway() {
  return (
    <svg
      viewBox="0 0 420 60"
      preserveAspectRatio="none"
      aria-hidden
      style={{
        width: '100%',
        height: 60,
        display: 'block',
        color: 'var(--v2-gold)',
      }}
    >
      <line x1="22" y1="10" x2="22" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <line x1="398" y1="10" x2="398" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <line x1="38" y1="18" x2="38" y2="42" stroke="currentColor" strokeWidth="0.5" opacity="0.55" />
      <line x1="382" y1="18" x2="382" y2="42" stroke="currentColor" strokeWidth="0.5" opacity="0.55" />
      <path d="M 22 50 Q 210 -22 398 50" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.85" />
      <path d="M 60 50 Q 210 -2 360 50" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
      <circle cx="120" cy="22" r="1.2" fill="currentColor" opacity="0.7" />
      <circle cx="300" cy="22" r="1.2" fill="currentColor" opacity="0.7" />
      <line x1="210" y1="2" x2="210" y2="14" stroke="currentColor" strokeWidth="0.75" opacity="0.85" />
      <circle cx="210" cy="18" r="3.2" fill="currentColor" />
      <circle cx="210" cy="18" r="6" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.55" />
    </svg>
  );
}
