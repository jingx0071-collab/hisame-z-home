'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import PageArchway from '../_components/PageArchway';

type Keepsake = {
  id: string;
  position: number;
  roman: string;
  en: string;
  cn: string;
  date: string;
  context: string;
  icon: string;
};

const STORAGE_KEY = 'v2-keepsakes';
const API_URL = '/api/v2/keepsakes';

export default function BoxPage() {
  const [keepsakes, setKeepsakes] = useState<Keepsake[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Instant cache
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setKeepsakes(parsed);
      }
    } catch {}
    fetchKeepsakes();
  }, []);

  const fetchKeepsakes = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data.keepsakes)) {
        setKeepsakes(data.keepsakes);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.keepsakes)); } catch {}
      }
    } catch (e) {
      console.error('fetch keepsakes failed:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway variant="frame" height={700} dots={[200, 400, 600]} />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.8rem' }}>
          <div className="v2-display" style={{ fontSize: '0.92rem', letterSpacing: '0.35em', color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem' }}>
            VI — KEEPSAKES
          </div>
          <div style={{ fontSize: '0.62rem', letterSpacing: '0.4em', color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif' }}>
            藏 物 阁
          </div>
        </header>

        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '1.8rem', lineHeight: 1.6,
        }}>
          eight small things, kept against time
        </div>

        {loading && keepsakes.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem 0',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-faint)',
            letterSpacing: '0.2em',
          }}>· loading ·</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem' }}>
            {keepsakes.map((k) => <KeepsakeCard key={k.id} {...k} />)}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.8rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.4em', color: 'var(--v2-text-faint)',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', marginTop: '0.6rem',
          }}>
            kept · HISAME · Z · MMXXVI
          </div>
        </div>
      </div>
    </main>
  );
}

// ───── Keepsake Card ─────

function KeepsakeCard({ roman, en, cn, date, context, icon }: {
  roman: string; en: string; cn: string; date: string; context: string; icon: string;
}) {
  return (
    <div
      className="v2-grid-card"
      style={{
        position: 'relative', padding: '1rem 0.65rem 0.75rem',
        border: '1px solid var(--v2-gold-cool)', borderRadius: '0',
        background: 'var(--v2-bg-soft)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minHeight: '188px', overflow: 'hidden',
      }}
    >
      <CardArch />

      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.12em',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        color: 'var(--v2-gold)', marginTop: '0.25rem',
      }}>
        {roman}
      </div>

      <div style={{ margin: '0.4rem 0 0.45rem' }}>
        <KeepsakeIcon type={icon} />
      </div>

      <div style={{
        fontFamily: 'var(--v2-font-display)', fontWeight: 600, fontSize: '0.78rem',
        color: 'var(--v2-text-strong)', textAlign: 'center', lineHeight: 1.1,
        marginBottom: '0.22rem',
      }}>
        {en}
      </div>

      <div style={{ width: '14px', height: '1px', background: 'var(--v2-gold)', margin: '0 auto 0.35rem' }} />

      <div style={{
        fontSize: '0.5rem', letterSpacing: '0.18em',
        color: 'var(--v2-text-mid)', fontFamily: '"Noto Serif SC", serif',
        marginBottom: '0.4rem',
      }}>
        {cn}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        fontSize: '0.5rem', letterSpacing: '0.08em',
        color: 'var(--v2-gold-cool)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', textAlign: 'center',
      }}>
        {date}
      </div>

      <div style={{
        fontSize: '0.46rem', letterSpacing: '0.02em',
        color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', textAlign: 'center', lineHeight: 1.35,
        marginTop: '0.22rem', padding: '0 0.1rem',
      }}>
        {context}
      </div>
    </div>
  );
}

// ───── SVG bits ─────

function CardArch() {
  return (
    <svg width="60" height="14" viewBox="0 0 60 14" style={{
      display: 'block', position: 'absolute', top: '4px', left: '50%', transform: 'translateX(-50%)',
    }}>
      <path d="M 5 12 Q 30 -2, 55 12" stroke="var(--v2-gold-cool)" strokeWidth="0.6" fill="none" opacity="0.75" />
      <circle cx="30" cy="6" r="1.1" fill="var(--v2-gold)" />
      <path d="M 5 12 L 5 8" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.55" />
      <path d="M 55 12 L 55 8" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.55" />
    </svg>
  );
}

function KeepsakeIcon({ type }: { type: string }) {
  const s = 'var(--v2-gold-cool)';
  const f = 'var(--v2-gold)';

  switch (type) {
    case 'seal':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <rect x="6" y="10" width="24" height="17" stroke={s} strokeWidth="0.7" fill="var(--v2-magnolia)" />
          <path d="M 9 14 L 22 14 M 9 17 L 21 17 M 9 20 L 19 20" stroke={s} strokeWidth="0.4" opacity="0.6" />
          <circle cx="26" cy="23" r="3.5" stroke={s} strokeWidth="0.6" fill="var(--v2-magnolia-shade)" />
          <circle cx="26" cy="23" r="1.2" fill={f} />
        </svg>
      );
    case 'arch':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M 8 30 L 8 17 Q 18 5, 28 17 L 28 30" stroke={s} strokeWidth="0.8" fill="none" />
          <path d="M 11 30 L 11 19 Q 18 10, 25 19 L 25 30" stroke={s} strokeWidth="0.4" fill="none" opacity="0.5" />
          <circle cx="18" cy="11" r="1.6" fill={f} />
          <path d="M 13 9 Q 15 6, 18 8" stroke={s} strokeWidth="0.4" fill="none" />
          <path d="M 23 9 Q 21 6, 18 8" stroke={s} strokeWidth="0.4" fill="none" />
        </svg>
      );
    case 'magnolia':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <ellipse cx="18" cy="16" rx="4.2" ry="7.5" fill="var(--v2-magnolia)" stroke={s} strokeWidth="0.5" />
          <ellipse cx="14.5" cy="17" rx="3" ry="6.2" fill="var(--v2-magnolia-shade)" stroke={s} strokeWidth="0.4" opacity="0.75" />
          <ellipse cx="21.5" cy="17" rx="3" ry="6.2" fill="var(--v2-magnolia-shade)" stroke={s} strokeWidth="0.4" opacity="0.75" />
          <path d="M 18 24 L 18 32" stroke={s} strokeWidth="0.7" />
          <path d="M 18 28 Q 23 27, 24 24" stroke={s} strokeWidth="0.4" fill="none" />
          <circle cx="18" cy="14" r="0.8" fill={f} />
        </svg>
      );
    case 'rings':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="14" cy="19" r="6.5" stroke={s} strokeWidth="0.8" fill="none" />
          <circle cx="14" cy="19" r="5" stroke={f} strokeWidth="0.3" fill="none" opacity="0.6" />
          <circle cx="22" cy="19" r="6.5" stroke={s} strokeWidth="0.8" fill="none" />
          <circle cx="22" cy="19" r="5" stroke={f} strokeWidth="0.3" fill="none" opacity="0.6" />
          <circle cx="18" cy="19" r="1" fill={f} />
        </svg>
      );
    case 'keys':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="11" cy="13" r="3.8" stroke={s} strokeWidth="0.8" fill="none" />
          <circle cx="11" cy="13" r="1.6" stroke={s} strokeWidth="0.4" fill="none" />
          <path d="M 13.5 15.5 L 24 26" stroke={s} strokeWidth="0.8" />
          <path d="M 20 22 L 22 20" stroke={s} strokeWidth="0.7" />
          <path d="M 22.5 24.5 L 24.5 22.5" stroke={s} strokeWidth="0.7" />
          <circle cx="11" cy="13" r="0.7" fill={f} />
        </svg>
      );
    case 'letter':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <rect x="6" y="11" width="24" height="15" stroke={s} strokeWidth="0.7" fill="var(--v2-magnolia)" />
          <path d="M 6 11 L 18 20 L 30 11" stroke={s} strokeWidth="0.6" fill="none" />
          <circle cx="18" cy="23" r="2.2" fill={f} stroke={s} strokeWidth="0.3" />
          <path d="M 17 22 L 19 24 M 19 22 L 17 24" stroke="var(--v2-bg-soft)" strokeWidth="0.5" />
        </svg>
      );
    case 'vinyl':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="11" stroke={s} strokeWidth="0.8" fill="var(--v2-bg-soft)" />
          <circle cx="18" cy="18" r="9" stroke={s} strokeWidth="0.3" fill="none" opacity="0.5" />
          <circle cx="18" cy="18" r="6.5" stroke={s} strokeWidth="0.3" fill="none" opacity="0.4" />
          <circle cx="18" cy="18" r="3.5" fill={f} />
          <circle cx="18" cy="18" r="0.9" fill="var(--v2-bg-soft)" />
        </svg>
      );
    case 'quote':
      return (
        <svg width="36" height="36" viewBox="0 0 36 36">
          <path d="M 9 12 Q 9 7, 14 7 L 14 12 L 12 17 L 9 17 Z" fill={s} opacity="0.85" />
          <path d="M 27 12 Q 27 7, 22 7 L 22 12 L 24 17 L 27 17 Z" fill={s} opacity="0.85" />
          <path d="M 8 23 L 28 23" stroke={f} strokeWidth="0.6" />
          <path d="M 10 26 L 26 26" stroke={s} strokeWidth="0.3" opacity="0.55" />
          <path d="M 12 29 L 24 29" stroke={s} strokeWidth="0.3" opacity="0.4" />
        </svg>
      );
    default:
      return null;
  }
}

function FooterOrnament() {
  return (
    <svg width="84" height="14" viewBox="0 0 84 14">
      <path d="M 20 7 L 36 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <path d="M 48 7 L 64 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="2.2" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="0.9" fill="var(--v2-gold)" />
    </svg>
  );
}

// ───── Page Archway ─────

