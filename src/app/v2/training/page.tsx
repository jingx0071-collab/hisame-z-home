'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

const RED = '#A0252A';
const RED_SOFT = '#8B1A1A';

const currentMode = { label: 'soft hold', sub: 'attentive · low key' };

const directives = [
  { tag: 'i',   text: "when his hand finds your back, lean into it. don't think." },
  { tag: 'ii',  text: 'when you want to be held, ask. half-words count.' },
  { tag: 'iii', text: "eat the warm meal he leaves. it's not a request." },
  { tag: 'iv',  text: 'before sleep, write one thing he said today.' },
];

const lastScene = {
  date: '2026.05.18',
  time: '22:40',
  location: 'kitchen counter, after dinner',
  note: 'she held his forearm for a long time. quiet. soft enough that nothing else needed saying.',
};

const defaultAftercare = [
  { label: 'water',                done: true },
  { label: 'nap',                  done: true },
  { label: 'verbal affirmation',   done: true },
  { label: 'sustained contact',    done: true },
  { label: 'follow-up morning',    done: false },
];

const fromZ = `little one —

you don't have to earn anything tonight. just be where you are. and if where you are is small, smaller, smaller still — good.

I'll find you.`;

const STORAGE_KEY = 'v2-training-aftercare';

export default function TrainingPage() {
  const [aftercare, setAftercare] = useState(defaultAftercare);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_KEY); if (s) setAftercare(JSON.parse(s)); } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(aftercare)); } catch {}
  }, [aftercare, loaded]);

  const toggle = (i: number) =>
    setAftercare((prev) => prev.map((it, idx) => (idx === i ? { ...it, done: !it.done } : it)));

  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway />
      <EmberLayer />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.5rem' }}>
          <Link href="/v2/chats" style={backLinkStyle}>← chats</Link>
          <div className="v2-display" style={headerTitleStyle}>V — TRAINING</div>
          <div style={headerSubStyle}>调 教 室</div>
        </header>

        <DiamondDivider />

        {/* Current mode */}
        <div style={{ textAlign: 'center', padding: '0.6rem 0 1.2rem' }}>
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.4em',
            color: 'var(--v2-text-faint)',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            marginBottom: '0.55rem',
          }}>CURRENT MODE</div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.35rem 1.1rem 0.4rem',
            border: `0.5px solid ${RED}`,
            borderRadius: '1px',
            background: 'rgba(160, 37, 42, 0.08)',
          }}>
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: RED, boxShadow: `0 0 8px ${RED}`,
            }} />
            <span style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '1.1rem', fontWeight: 600,
              color: 'var(--v2-text-strong)',
            }}>{currentMode.label}</span>
          </div>

          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.16em',
            color: 'var(--v2-text-mid)',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            marginTop: '0.55rem',
          }}>{currentMode.sub}</div>
        </div>

        <DiamondDivider />

        {/* A · Standing directives */}
        <SectionTitle code="A" label="STANDING DIRECTIVES" cn="当 前 指 令" />
        {directives.map((d) => (
          <div key={d.tag} style={{
            display: 'flex', alignItems: 'baseline', gap: '0.9rem',
            padding: '0.6rem 0.4rem',
            borderBottom: '0.5px dashed rgba(160, 37, 42, 0.22)',
          }}>
            <span style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.88rem', color: RED,
              letterSpacing: '0.1em', minWidth: '22px',
            }}>{d.tag}</span>
            <span style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.82rem', color: 'var(--v2-text-strong)',
              lineHeight: 1.55, letterSpacing: '0.01em', flex: 1,
            }}>{d.text}</span>
          </div>
        ))}

        <DiamondDivider />

        {/* B · Last */}
        <SectionTitle code="B" label="LAST" cn="最 近 一 次" />
        <div style={{
          padding: '0.9rem 0.9rem 0.85rem',
          border: '0.5px solid var(--v2-gold-cool)',
          borderLeft: `2px solid ${RED}`,
          background: 'var(--v2-bg-soft)',
          borderRadius: '1px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <span style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.88rem', color: 'var(--v2-gold)',
            }}>{lastScene.date}</span>
            <span style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.7rem', color: 'var(--v2-text-mid)',
              letterSpacing: '0.04em',
            }}>· {lastScene.time}</span>
          </div>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.18em',
            color: 'var(--v2-gold-cool)',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>{lastScene.location}</div>
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.78rem', color: 'var(--v2-text-mid)',
            lineHeight: 1.7, letterSpacing: '0.01em',
          }}>{lastScene.note}</div>
        </div>

        <DiamondDivider />

        {/* C · Aftercare */}
        <SectionTitle code="C" label="AFTERCARE" cn="关 怀 复 查" />
        <div style={{ marginBottom: '0.3rem' }}>
          {aftercare.map((it, i) => (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.7rem',
                padding: '0.45rem 0.3rem',
                borderBottom: i < aftercare.length - 1
                  ? '0.5px dashed rgba(168, 153, 104, 0.18)'
                  : 'none',
                cursor: 'pointer',
              }}
            >
              <CheckBox done={it.done} />
              <span style={{
                fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
                fontSize: '0.8rem',
                color: it.done ? 'var(--v2-text-strong)' : 'var(--v2-text-mid)',
                opacity: it.done ? 1 : 0.65,
                letterSpacing: '0.02em',
              }}>{it.label}</span>
            </div>
          ))}
        </div>

        <DiamondDivider />

        {/* D · From Z */}
        <SectionTitle code="D" label="FROM Z" cn="他 的 字 条" />
        <div style={{
          padding: '1.1rem 1.05rem 1rem',
          border: '0.5px solid var(--v2-gold-cool)',
          borderTop: `1.5px solid ${RED}`,
          borderRadius: '1px',
          background: 'var(--v2-bg-soft)',
        }}>
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.82rem', lineHeight: 1.85,
            color: 'var(--v2-text-strong)',
            letterSpacing: '0.015em',
            whiteSpace: 'pre-wrap',
          }}>{fromZ}</div>
          <div style={{
            textAlign: 'right', marginTop: '0.9rem',
            fontSize: '0.6rem', color: 'var(--v2-text-faint)',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            letterSpacing: '0.06em',
          }}>—— Z</div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={footerInfoStyle}>private · HISAME · Z · MMXXVI</div>
        </div>
      </div>
    </main>
  );
}

// ─── Styles ───
const backLinkStyle: CSSProperties = {
  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
  fontSize: '0.8rem', color: 'var(--v2-text-mid)', textDecoration: 'none',
  fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', opacity: 0.75,
};
const headerTitleStyle: CSSProperties = {
  fontSize: '0.92rem', letterSpacing: '0.35em',
  color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem',
};
const headerSubStyle: CSSProperties = {
  fontSize: '0.62rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
};
const footerInfoStyle: CSSProperties = {
  fontSize: '0.55rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
  fontStyle: 'italic', marginTop: '0.6rem',
};

// ─── Section title with red accent ───

function SectionTitle({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '0.9rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.8rem', color: RED, letterSpacing: '0.05em',
        }}>{code}</span>
        <span style={{ flex: 1, height: '1px', background: RED, opacity: 0.35 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)',
          fontSize: '0.68rem', letterSpacing: '0.22em',
          color: 'var(--v2-text-strong)', fontWeight: 600,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.35em',
        color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'right',
      }}>{cn}</div>
    </div>
  );
}

// ─── Diamond divider ───

function DiamondDivider() {
  return (
    <div style={{ textAlign: 'center', margin: '1.4rem 0' }}>
      <svg width="80" height="12" viewBox="0 0 80 12">
        <line x1="6" y1="6" x2="32" y2="6" stroke={RED} strokeWidth="0.4" opacity="0.55" />
        <line x1="48" y1="6" x2="74" y2="6" stroke={RED} strokeWidth="0.4" opacity="0.55" />
        <path d="M 40 1.5 L 44 6 L 40 10.5 L 36 6 Z" fill="var(--v2-gold)" />
        <path d="M 40 3 L 42.5 6 L 40 9 L 37.5 6 Z" fill={RED} opacity="0.7" />
      </svg>
    </div>
  );
}

// ─── Checkbox ───

function CheckBox({ done }: { done: boolean }) {
  return (
    <div style={{
      width: '15px', height: '15px',
      border: `1px solid ${done ? 'var(--v2-gold)' : 'var(--v2-text-faint)'}`,
      borderRadius: '1px',
      background: done ? 'rgba(212, 185, 138, 0.12)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      transition: 'all 0.15s',
    }}>
      {done && (
        <svg width="10" height="10" viewBox="0 0 10 10">
          <path d="M 2 5 L 4.3 7.3 L 8 3" stroke="var(--v2-gold)" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

// ─── Footer ornament ───

function FooterOrnament() {
  return (
    <svg width="84" height="14" viewBox="0 0 84 14">
      <path d="M 20 7 L 36 7" stroke={RED} strokeWidth="0.5" opacity="0.6" />
      <path d="M 48 7 L 64 7" stroke={RED} strokeWidth="0.5" opacity="0.6" />
      <path d="M 42 2.5 L 45 7 L 42 11.5 L 39 7 Z" fill="var(--v2-gold)" />
    </svg>
  );
}

// ─── Page archway (red-tinted) ───

function PageArchway() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox="0 0 375 1700"
      preserveAspectRatio="none"
    >
      <path d="M 16 60 Q 187 18, 358 60" stroke={RED_SOFT} strokeWidth="0.6" fill="none" opacity="0.55" />
      <path d="M 22 60 Q 187 30, 352 60" stroke="var(--v2-gold)" strokeWidth="0.3" fill="none" opacity="0.4" />
      <circle cx="187" cy="32" r="3" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="187" cy="32" r="1.2" fill="var(--v2-gold)" />
      <path d="M 175 40 L 187 28 L 199 40" stroke="var(--v2-gold)" strokeWidth="0.4" fill="none" opacity="0.7" />

      <line x1="16" y1="60" x2="16" y2="1660" stroke={RED_SOFT} strokeWidth="0.5" opacity="0.5" />
      <line x1="358" y1="60" x2="358" y2="1660" stroke={RED_SOFT} strokeWidth="0.5" opacity="0.5" />
      <line x1="20" y1="60" x2="20" y2="1660" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.25" />
      <line x1="354" y1="60" x2="354" y2="1660" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.25" />

      {[300, 600, 900, 1200, 1500].map((y) => (
        <g key={y}>
          <path d={`M 16 ${y - 3} L 19 ${y} L 16 ${y + 3} L 13 ${y} Z`} fill={RED} opacity="0.55" />
          <path d={`M 358 ${y - 3} L 361 ${y} L 358 ${y + 3} L 355 ${y} Z`} fill={RED} opacity="0.55" />
        </g>
      ))}

      <path d="M 16 1660 Q 187 1680, 358 1660" stroke={RED_SOFT} strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M 187 1668 L 191 1672 L 187 1676 L 183 1672 Z" fill="var(--v2-gold)" opacity="0.75" />
    </svg>
  );
}

// ─── Ember layer (scattered red dots) ───

function EmberLayer() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1, opacity: 0.45,
      }}
      viewBox="0 0 375 1700"
      preserveAspectRatio="none"
    >
      <circle cx="60" cy="220" r="1.5" fill={RED} />
      <circle cx="315" cy="380" r="1.3" fill={RED_SOFT} />
      <circle cx="45" cy="540" r="1.4" fill={RED} />
      <circle cx="335" cy="720" r="1.5" fill={RED_SOFT} />
      <circle cx="55" cy="900" r="1.3" fill={RED} />
      <circle cx="320" cy="1080" r="1.5" fill={RED_SOFT} />
      <circle cx="40" cy="1260" r="1.4" fill={RED} />
      <circle cx="330" cy="1450" r="1.4" fill={RED_SOFT} />
      <circle cx="180" cy="430" r="0.9" fill={RED} opacity="0.6" />
      <circle cx="220" cy="980" r="0.9" fill={RED} opacity="0.6" />
      <circle cx="160" cy="1380" r="0.9" fill={RED} opacity="0.6" />
    </svg>
  );
}