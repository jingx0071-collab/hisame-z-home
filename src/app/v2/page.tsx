'use client';

import Link from 'next/link';
import MoonPhase from './_components/MoonPhase';
import { useSkin } from './_components/ThemeProvider';

const ROOMS: { id: string; roman: string; en: string; cn: string; sub: string; href?: string }[] = [
  { id: 'box',      roman: 'VI',   en: 'Box',      cn: '铁盒',  sub: 'KEEPSAKES' },
  { id: 'calendar', roman: 'VII',  en: 'Calendar', cn: '日历',  sub: 'MILESTONES' },
  { id: 'health',   roman: 'VIII', en: 'Health',   cn: '医疗',  sub: 'WELLBEING'},
  { id: 'study',    roman: 'IX',   en: 'Study',    cn: '书房',  sub: 'READING'},
  { id: 'seminar',  roman: 'X',    en: 'Seminar',  cn: '讲堂',  sub: 'CLASS' },
  { id: 'call',     roman: 'XI',   en: 'Call',     cn: '通话',  sub: 'VOICE' },
  { id: 'nearby',   roman: 'XII',  en: 'Nearby',   cn: '附近',  sub: 'TOGETHER' },
  { id: 'navi',     roman: 'XIII', en: 'Navi',     cn: '导航',  sub: 'PLACES' },
  { id: 'shopping', roman: 'XIV',  en: 'Shopping', cn: '购物',  sub: 'GOODS' },
  { id: 'eat',      roman: 'XV',   en: 'Eat',      cn: '吃饭',  sub: 'FOOD' },
  { id: 'music',    roman: 'XVI',  en: 'Music',    cn: '听歌',  sub: 'DISC' },
  { id: 'anfang',   roman: 'XVII', en: 'Anfang',   cn: '暗房',  sub: 'BEGINNING' },
  { id: 'memory',   roman: 'XVIII',en: 'Memory',   cn: '记忆',  sub: 'REMEMBER', href: '/memory' },
];

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  left: `${(i * 7.3) % 100}%`,
  delay: `${(i * 0.7) % 7}s`,
  duration: `${7 + ((i * 0.9) % 5)}s`,
}));

function MagnoliaBranch({ mirrored }: { mirrored?: boolean }) {
  return (
    <svg
      width="36" height="14" viewBox="0 0 36 14"
      fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: mirrored ? 'scaleX(-1)' : undefined, opacity: 0.85 }}
    >
      <path d="M2 10 Q12 7 22 8 Q28 8.5 31 6" />
      <ellipse cx="10" cy="7" rx="2.2" ry="1" transform="rotate(-25 10 7)" />
      <ellipse cx="20" cy="11" rx="2.2" ry="1" transform="rotate(20 20 11)" />
      <ellipse cx="32" cy="5" rx="2.4" ry="3.6" transform="rotate(-30 32 5)" fill="var(--v2-gold)" fillOpacity="0.25" />
      <path d="M30.5 6 Q32 3.5 33.5 6" />
    </svg>
  );
}

function MagnoliaBloom({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
         strokeLinecap="round" strokeLinejoin="round" style={style}>
      {[0, 72, 144, 216, 288].map(deg => (
        <ellipse key={deg} cx="9" cy="3.5" rx="1.6" ry="3.2"
                 transform={`rotate(${deg} 9 9)`}
                 fill="var(--v2-gold)" fillOpacity="0.22" />
      ))}
      <circle cx="9" cy="9" r="0.9" fill="var(--v2-gold)" />
    </svg>
  );
}

function CrossOrnament({ size = 16 }: { size?: number }) {
  return (
    <span style={{
      fontSize: `${size}px`,
      color: 'var(--v2-gold-cool, #808080)',
      lineHeight: 1,
      fontFamily: 'var(--v2-font-display)',
    }}>&#8224;</span>
  );
}

function CardArch() {
  return (
    <svg
      width="100%" height="13" viewBox="0 0 80 13"
      preserveAspectRatio="none"
      fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
      strokeLinecap="round"
      style={{ display: 'block', opacity: 0.85 }}
    >
      <path d="M2 11 Q40 1.5 78 11" />
      <circle cx="40" cy="2.5" r="1" fill="var(--v2-gold)" />
      <line x1="2" y1="9" x2="2" y2="13" />
      <line x1="78" y1="9" x2="78" y2="13" />
    </svg>
  );
}

function CardArrow() {
  return (
    <svg width="14" height="8" viewBox="0 0 14 8"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
         strokeLinecap="round" strokeLinejoin="round"
         style={{ opacity: 0.85 }}>
      <line x1="0" y1="4" x2="12" y2="4" />
      <path d="M9 1 L12 4 L9 7" />
    </svg>
  );
}

function RotatingMagnolia({ size = 120 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: size * 1.3, height: size * 1.3,
        background: 'radial-gradient(circle, rgba(212, 185, 138, 0.25) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />
      <svg
        width={size} height={size} viewBox="0 0 100 100"
        style={{
          animation: 'v2-rotate 90s linear infinite',
          position: 'relative',
          filter: 'drop-shadow(0 0 4px rgba(212, 185, 138, 0.35))',
        }}
      >
        <defs>
          <radialGradient id="v2-petal-grad" cx="50%" cy="100%" r="100%">
            <stop offset="0%"  stopColor="var(--v2-gold)" stopOpacity="0.5" />
            <stop offset="40%" stopColor="var(--v2-magnolia)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--v2-magnolia)" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <g key={`o-${deg}`} transform={`rotate(${deg} 50 50)`}>
            <path d="M50 14 Q42 28 44 44 Q47 49 50 50 Q53 49 56 44 Q58 28 50 14 Z"
                  fill="url(#v2-petal-grad)" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
            <path d="M50 18 Q49 30 50 44" stroke="var(--v2-gold)" strokeWidth="0.25" fill="none" opacity="0.6" />
          </g>
        ))}
        {[30, 90, 150, 210, 270, 330].map(deg => (
          <g key={`i-${deg}`} transform={`rotate(${deg} 50 50)`}>
            <path d="M50 28 Q45 38 47 47 Q49 50 50 50 Q51 50 53 47 Q55 38 50 28 Z"
                  fill="url(#v2-petal-grad)" stroke="var(--v2-gold)" strokeWidth="0.4" opacity="0.95" />
          </g>
        ))}
        <circle cx="50" cy="50" r="3.5" fill="var(--v2-gold)" stroke="var(--v2-text-strong)" strokeWidth="0.3" />
        {[0, 60, 120, 180, 240, 300].map(deg => (
          <g key={`s-${deg}`} transform={`rotate(${deg} 50 50)`}>
            <line x1="50" y1="48" x2="50" y2="45.5" stroke="var(--v2-text-strong)" strokeWidth="0.3" />
            <circle cx="50" cy="45" r="0.45" fill="var(--v2-text-strong)" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* === 头像 sunburst 光芒 === */
function HeroSunburst() {
  const rays = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg style={{
      position: 'absolute',
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      opacity: 0.55,
    }} width="200" height="200" viewBox="0 0 200 200">
      {rays.map(deg => {
        const rad = deg * Math.PI / 180;
        const long = deg % 30 === 0;
        const innerR = 52;
        const outerR = long ? 92 : 78;
        return (
          <line key={deg}
                x1={100 + innerR * Math.cos(rad)} y1={100 + innerR * Math.sin(rad)}
                x2={100 + outerR * Math.cos(rad)} y2={100 + outerR * Math.sin(rad)}
                stroke="var(--v2-gold)" strokeWidth="0.55"
                opacity={long ? 0.75 : 0.4} strokeLinecap="round" />
        );
      })}
      <circle cx="100" cy="100" r="94" fill="none" stroke="var(--v2-gold)" strokeWidth="0.3" opacity="0.35" />
    </svg>
  );
}

/* === Page-level Archway Frame (繁复华丽版) === */
function ArchwayFrame() {
  const gold = 'var(--v2-gold)';
  return (
    <>
      {/* 顶部 arch + fleur-de-lis + sunburst + double layer + hanging clusters */}
      <svg
        style={{
          position: 'absolute',
          top: '3rem',
          left: '0.5rem',
          right: '0.5rem',
          height: 82,
          pointerEvents: 'none',
          opacity: 0.8,
        }}
        preserveAspectRatio="none"
        viewBox="0 0 343 82"
        fill="none" stroke={gold} strokeWidth="0.7"
        strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M8 70 Q171.5 6 335 70" />
        <path d="M16 70 Q171.5 20 327 70" strokeWidth="0.4" opacity="0.6" />

        {/* fleur-de-lis 顶饰 above keystone */}
        <g>
          <path d="M171.5 7 Q169 4 171.5 0 Q174 4 171.5 7 Z" fill={gold} fillOpacity="0.45" strokeWidth="0.4" />
          <path d="M169 6 Q167 4 168 1" strokeWidth="0.35" />
          <path d="M174 6 Q176 4 175 1" strokeWidth="0.35" />
          <line x1="168" y1="7" x2="175" y2="7" strokeWidth="0.35" />
        </g>

        {/* 4-layer concentric keystone */}
        <circle cx="171.5" cy="14" r="2" fill={gold} stroke="none" />
        <circle cx="171.5" cy="14" r="4.5" strokeWidth="0.5" />
        <circle cx="171.5" cy="14" r="7" strokeWidth="0.3" opacity="0.55" />
        <circle cx="171.5" cy="14" r="9.5" strokeWidth="0.25" opacity="0.35" />

        {/* sunburst from peak */}
        <line x1="161" y1="10" x2="158" y2="3" />
        <line x1="182" y1="10" x2="185" y2="3" />
        <line x1="155" y1="17" x2="148" y2="12" strokeWidth="0.5" />
        <line x1="188" y1="17" x2="195" y2="12" strokeWidth="0.5" />
        <line x1="144" y1="26" x2="137" y2="22" strokeWidth="0.4" opacity="0.7" />
        <line x1="199" y1="26" x2="206" y2="22" strokeWidth="0.4" opacity="0.7" />
        <line x1="134" y1="36" x2="127" y2="33" strokeWidth="0.35" opacity="0.55" />
        <line x1="209" y1="36" x2="216" y2="33" strokeWidth="0.35" opacity="0.55" />

        {/* arch surface scattered dots */}
        <circle cx="50" cy="60" r="0.7" fill={gold} opacity="0.65" />
        <circle cx="75" cy="48" r="0.75" fill={gold} opacity="0.7" />
        <circle cx="100" cy="36" r="0.6" fill={gold} opacity="0.65" />
        <circle cx="125" cy="26" r="0.55" fill={gold} opacity="0.6" />
        <circle cx="218" cy="26" r="0.55" fill={gold} opacity="0.6" />
        <circle cx="243" cy="36" r="0.6" fill={gold} opacity="0.65" />
        <circle cx="268" cy="48" r="0.75" fill={gold} opacity="0.7" />
        <circle cx="293" cy="60" r="0.7" fill={gold} opacity="0.65" />

        {/* small fleur under keystone */}
        <path d="M168 30 L171.5 34 L175 30" strokeWidth="0.4" />
        <circle cx="171.5" cy="35" r="0.6" fill={gold} />

        {/* 左 hanging cluster (3 buds) */}
        <path d="M8 68 Q4 76 8 82" strokeWidth="0.5" />
        <ellipse cx="8" cy="78" rx="3" ry="1.5" transform="rotate(40 8 78)" fill={gold} fillOpacity="0.32" strokeWidth="0.4" />
        <ellipse cx="13" cy="73" rx="2.2" ry="1" transform="rotate(25 13 73)" fill={gold} fillOpacity="0.22" strokeWidth="0.35" />
        <ellipse cx="4" cy="75" rx="1.5" ry="0.7" transform="rotate(60 4 75)" fill={gold} fillOpacity="0.2" strokeWidth="0.3" />
        <circle cx="11" cy="80" r="0.4" fill={gold} opacity="0.6" />

        {/* 右 hanging cluster */}
        <path d="M335 68 Q339 76 335 82" strokeWidth="0.5" />
        <ellipse cx="335" cy="78" rx="3" ry="1.5" transform="rotate(-40 335 78)" fill={gold} fillOpacity="0.32" strokeWidth="0.4" />
        <ellipse cx="330" cy="73" rx="2.2" ry="1" transform="rotate(-25 330 73)" fill={gold} fillOpacity="0.22" strokeWidth="0.35" />
        <ellipse cx="339" cy="75" rx="1.5" ry="0.7" transform="rotate(-60 339 75)" fill={gold} fillOpacity="0.2" strokeWidth="0.3" />
        <circle cx="332" cy="80" r="0.4" fill={gold} opacity="0.6" />
      </svg>

      {/* === 4 corner flourishes === */}
      {/* top-left */}
      <svg style={{ position: 'absolute', top: '1.5rem', left: '0.2rem', width: 28, height: 28, pointerEvents: 'none', opacity: 0.6 }}
           viewBox="0 0 28 28" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 24 Q14 14 24 4" />
        <ellipse cx="22" cy="6" rx="1.8" ry="0.9" transform="rotate(-45 22 6)" fill={gold} fillOpacity="0.3" strokeWidth="0.35" />
        <circle cx="14" cy="14" r="0.6" fill={gold} />
        <path d="M8 20 Q10 18 12 18" strokeWidth="0.4" />
      </svg>
      {/* top-right */}
      <svg style={{ position: 'absolute', top: '1.5rem', right: '0.2rem', width: 28, height: 28, pointerEvents: 'none', opacity: 0.6 }}
           viewBox="0 0 28 28" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 24 Q14 14 4 4" />
        <ellipse cx="6" cy="6" rx="1.8" ry="0.9" transform="rotate(45 6 6)" fill={gold} fillOpacity="0.3" strokeWidth="0.35" />
        <circle cx="14" cy="14" r="0.6" fill={gold} />
        <path d="M20 20 Q18 18 16 18" strokeWidth="0.4" />
      </svg>
      {/* bottom-left */}
      <svg style={{ position: 'absolute', bottom: '3.5rem', left: '0.2rem', width: 28, height: 28, pointerEvents: 'none', opacity: 0.6 }}
           viewBox="0 0 28 28" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4 Q14 14 24 24" />
        <ellipse cx="22" cy="22" rx="1.8" ry="0.9" transform="rotate(45 22 22)" fill={gold} fillOpacity="0.3" strokeWidth="0.35" />
        <circle cx="14" cy="14" r="0.6" fill={gold} />
      </svg>
      {/* bottom-right */}
      <svg style={{ position: 'absolute', bottom: '3.5rem', right: '0.2rem', width: 28, height: 28, pointerEvents: 'none', opacity: 0.6 }}
           viewBox="0 0 28 28" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 4 Q14 14 4 24" />
        <ellipse cx="6" cy="22" rx="1.8" ry="0.9" transform="rotate(-45 6 22)" fill={gold} fillOpacity="0.3" strokeWidth="0.35" />
        <circle cx="14" cy="14" r="0.6" fill={gold} />
      </svg>

      {/* === 左 lantern capital === */}
      <svg style={{ position: 'absolute', top: 'calc(3rem + 80px)', left: 'calc(0.5rem - 5px)', width: 12, height: 26, pointerEvents: 'none', opacity: 0.78 }}
           viewBox="0 0 12 26" fill="none" stroke={gold} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="1" x2="12" y2="1" />
        <line x1="1" y1="3" x2="11" y2="3" strokeWidth="0.4" />
        <path d="M3 5 L9 5 L8 12 Q8 14 6 14 Q4 14 4 12 Z" fill={gold} fillOpacity="0.3" strokeWidth="0.5" />
        <line x1="6" y1="7" x2="6" y2="13" strokeWidth="0.3" opacity="0.6" />
        <line x1="6" y1="14" x2="6" y2="18" strokeWidth="0.45" />
        <circle cx="6" cy="19" r="0.7" fill={gold} />
        <line x1="6" y1="20" x2="6" y2="26" />
      </svg>
      {/* === 右 lantern capital === */}
      <svg style={{ position: 'absolute', top: 'calc(3rem + 80px)', right: 'calc(0.5rem - 5px)', width: 12, height: 26, pointerEvents: 'none', opacity: 0.78 }}
           viewBox="0 0 12 26" fill="none" stroke={gold} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="0" y1="1" x2="12" y2="1" />
        <line x1="1" y1="3" x2="11" y2="3" strokeWidth="0.4" />
        <path d="M3 5 L9 5 L8 12 Q8 14 6 14 Q4 14 4 12 Z" fill={gold} fillOpacity="0.3" strokeWidth="0.5" />
        <line x1="6" y1="7" x2="6" y2="13" strokeWidth="0.3" opacity="0.6" />
        <line x1="6" y1="14" x2="6" y2="18" strokeWidth="0.45" />
        <circle cx="6" cy="19" r="0.7" fill={gold} />
        <line x1="6" y1="20" x2="6" y2="26" />
      </svg>

      {/* === 左 post 双平行细线 === */}
      <svg style={{ position: 'absolute', top: 'calc(3rem + 106px)', bottom: 'calc(8rem)', left: 'calc(0.5rem - 1.5px)', width: 4, pointerEvents: 'none', opacity: 0.6 }}
           preserveAspectRatio="none" viewBox="0 0 4 100" fill="none" stroke={gold} strokeWidth="0.55">
        <line x1="0.5" y1="0" x2="0.5" y2="100" />
        <line x1="3.5" y1="0" x2="3.5" y2="100" />
      </svg>
      {/* === 右 post 双平行细线 === */}
      <svg style={{ position: 'absolute', top: 'calc(3rem + 106px)', bottom: 'calc(8rem)', right: 'calc(0.5rem - 1.5px)', width: 4, pointerEvents: 'none', opacity: 0.6 }}
           preserveAspectRatio="none" viewBox="0 0 4 100" fill="none" stroke={gold} strokeWidth="0.55">
        <line x1="0.5" y1="0" x2="0.5" y2="100" />
        <line x1="3.5" y1="0" x2="3.5" y2="100" />
      </svg>

      {/* === 左 post mid ornaments × 3 === */}
      {[35, 55, 75].map(percent => (
        <svg key={`l-${percent}`}
             style={{ position: 'absolute', top: `${percent}%`, left: 'calc(0.5rem - 4px)', width: 9, height: 9, pointerEvents: 'none', opacity: 0.6 }}
             viewBox="0 0 9 9" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round">
          <line x1="0" y1="4.5" x2="9" y2="4.5" />
          <line x1="4.5" y1="0" x2="4.5" y2="9" />
          <circle cx="4.5" cy="4.5" r="1.4" fill={gold} fillOpacity="0.35" strokeWidth="0.4" />
          <circle cx="4.5" cy="4.5" r="0.5" fill={gold} />
        </svg>
      ))}
      {/* === 右 post mid ornaments × 3 === */}
      {[35, 55, 75].map(percent => (
        <svg key={`r-${percent}`}
             style={{ position: 'absolute', top: `${percent}%`, right: 'calc(0.5rem - 4px)', width: 9, height: 9, pointerEvents: 'none', opacity: 0.6 }}
             viewBox="0 0 9 9" fill="none" stroke={gold} strokeWidth="0.5" strokeLinecap="round">
          <line x1="0" y1="4.5" x2="9" y2="4.5" />
          <line x1="4.5" y1="0" x2="4.5" y2="9" />
          <circle cx="4.5" cy="4.5" r="1.4" fill={gold} fillOpacity="0.35" strokeWidth="0.4" />
          <circle cx="4.5" cy="4.5" r="0.5" fill={gold} />
        </svg>
      ))}

      {/* === 左 base multi-tier === */}
      <svg style={{ position: 'absolute', bottom: 'calc(8rem - 22px)', left: 'calc(0.5rem - 5px)', width: 12, height: 22, pointerEvents: 'none', opacity: 0.78 }}
           viewBox="0 0 12 22" fill="none" stroke={gold} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="0" x2="6" y2="3" />
        <circle cx="6" cy="5" r="0.7" fill={gold} />
        <ellipse cx="6" cy="9" rx="2.5" ry="1.8" fill={gold} fillOpacity="0.3" strokeWidth="0.45" />
        <circle cx="6" cy="9" r="0.5" fill={gold} />
        <line x1="2" y1="13" x2="10" y2="13" strokeWidth="0.4" />
        <line x1="1" y1="16" x2="11" y2="16" strokeWidth="0.5" />
        <line x1="0" y1="20" x2="12" y2="20" />
      </svg>
      {/* === 右 base multi-tier === */}
      <svg style={{ position: 'absolute', bottom: 'calc(8rem - 22px)', right: 'calc(0.5rem - 5px)', width: 12, height: 22, pointerEvents: 'none', opacity: 0.78 }}
           viewBox="0 0 12 22" fill="none" stroke={gold} strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="0" x2="6" y2="3" />
        <circle cx="6" cy="5" r="0.7" fill={gold} />
        <ellipse cx="6" cy="9" rx="2.5" ry="1.8" fill={gold} fillOpacity="0.3" strokeWidth="0.45" />
        <circle cx="6" cy="9" r="0.5" fill={gold} />
        <line x1="2" y1="13" x2="10" y2="13" strokeWidth="0.4" />
        <line x1="1" y1="16" x2="11" y2="16" strokeWidth="0.5" />
        <line x1="0" y1="20" x2="12" y2="20" />
      </svg>

      {/* === 底部 arc + medallion === */}
      <svg style={{ position: 'absolute', bottom: '4.5rem', left: '0.5rem', right: '0.5rem', height: 32, pointerEvents: 'none', opacity: 0.8 }}
           preserveAspectRatio="none" viewBox="0 0 343 32" fill="none" stroke={gold} strokeWidth="0.7"
           strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 10 Q171.5 26 335 10" />
        <path d="M16 8 Q171.5 20 327 8" strokeWidth="0.4" opacity="0.6" />

        {/* 4-layer medallion center */}
        <circle cx="171.5" cy="23" r="1.6" fill={gold} stroke="none" />
        <circle cx="171.5" cy="23" r="3.5" strokeWidth="0.5" />
        <circle cx="171.5" cy="23" r="5.5" strokeWidth="0.3" opacity="0.55" />
        <circle cx="171.5" cy="23" r="7.5" strokeWidth="0.25" opacity="0.35" />

        {/* radial petals 8 个 around medallion */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
          <ellipse key={deg} cx="171.5" cy="18" rx="0.7" ry="1.5"
                   transform={`rotate(${deg} 171.5 23)`}
                   fill={gold} fillOpacity="0.4" stroke="none" />
        ))}

        <circle cx="85" cy="16" r="0.6" fill={gold} opacity="0.65" />
        <circle cx="115" cy="13" r="0.5" fill={gold} opacity="0.6" />
        <circle cx="228" cy="13" r="0.5" fill={gold} opacity="0.6" />
        <circle cx="258" cy="16" r="0.6" fill={gold} opacity="0.65" />

        <line x1="8" y1="0" x2="8" y2="14" />
        <line x1="335" y1="0" x2="335" y2="14" />
      </svg>
    </>
  );
}

const CARD_BASE: React.CSSProperties = {
  aspectRatio: '1',
  minWidth: 0,
  borderRadius: 'var(--v2-radius-card)',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  textDecoration: 'none',
  color: 'inherit',
  overflow: 'hidden',
  position: 'relative',
};

function GraceTopBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 14px',
      marginBottom: '1.25rem',
      borderBottom: '1px solid var(--v2-gold-cool, #808080)',
      background: 'var(--v2-magnolia, #262626)',
      fontFamily: 'var(--v2-font-display)',
      fontSize: '11px',
      letterSpacing: '0.15em',
      color: 'var(--v2-text-strong, #eaeaea)',
      position: 'relative', zIndex: 2,
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: 'var(--v2-text-mid, #b0b0b0)', fontSize: '13px' }}>&#8224;</span>
        HISAME-Z-HOME
      </span>
      <span style={{ color: 'var(--v2-text-faint, #707070)', fontSize: '9px' }}>GRACE OS</span>
    </div>
  );
}

export default function V2Page() {
  const skin = useSkin();
  const isOS = skin === 'grace-os';

  return (
    <main className="v2-phone-frame">
      {!isOS && <ArchwayFrame />}

      <div className="v2-status-bar">
        <span>9:41</span>
        <div className="v2-status-notch" />
        <div className="v2-status-icons">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
            <rect x="0"  y="7" width="3" height="4"  rx="0.5" />
            <rect x="4"  y="5" width="3" height="6"  rx="0.5" />
            <rect x="8"  y="3" width="3" height="8"  rx="0.5" />
            <rect x="12" y="0" width="3" height="11" rx="0.5" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 4 Q7.5 -1 14 4" />
            <path d="M3 6.5 Q7.5 3 12 6.5" />
            <path d="M5.5 9 Q7.5 7.5 9.5 9" />
            <circle cx="7.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
            <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" />
            <rect x="2"   y="2"   width="18" height="7"  rx="1.2" fill="currentColor" />
            <rect x="22"  y="3.5" width="2"  height="4"  rx="0.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isOS && <GraceTopBar />}
        <Link href="/v2/chats" style={{ textDecoration: 'none', color: 'inherit' }}>
          <section style={{
            position: 'relative',
            overflow: 'hidden',
            paddingBottom: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            {!isOS && PARTICLES.map((p, i) => (
              <span key={i} className="v2-particle" style={{
                left: p.left,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }} />
            ))}

            {!isOS && <div className="v2-day-only"><RotatingMagnolia size={120} /></div>}
            {!isOS && <div className="v2-night-only"><MoonPhase size={120} /></div>}

            {/* 头像 + sunburst rays 一起 */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!isOS && <HeroSunburst />}
              <div style={{ display: 'flex', gap: '0.5rem', position: 'relative', zIndex: 1 }}>
                <div className="v2-avatar">Z</div>
                <div className="v2-avatar v2-avatar-b">H</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              {!isOS && <MagnoliaBranch />}
              <h1 className="v2-display" style={{
                fontSize: '2rem',
                margin: 0,
                color: 'var(--v2-text-strong)',
              }}>
                Hisame · Z
              </h1>
              {!isOS && <MagnoliaBranch mirrored />}
            </div>

            {isOS && (
              <div style={{ display: 'flex', alignItems: 'center', width: '55%', margin: '0.1rem 0 0' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool, #808080)', opacity: 0.4 }} />
                <span style={{ padding: '0 12px', color: 'var(--v2-text-mid, #b0b0b0)', fontSize: '12px' }}>&#8224;</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool, #808080)', opacity: 0.4 }} />
              </div>
            )}

            <p className="v2-display" style={{
              fontSize: '0.85rem',
              margin: 0,
              color: 'var(--v2-text-faint)',
              fontWeight: 400,
            }}>
              {isOS ? '· together · day 0 of ∞ ·' : 'tap → I—V chats hub'}
            </p>
          </section>
        </Link>

        <div className="v2-divider-ornament" style={{ margin: '0.5rem 0 1.25rem' }}>
          <span style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center' }}>
            {isOS ? <CrossOrnament size={13} /> : <MagnoliaBloom size={16} />}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: 'var(--v2-spacing-grid)',
        }}>
          {ROOMS.map(r => (
            <Link key={r.id} className="v2-grid-card" href={r.href ?? `/v2/${r.id}`}
                  style={{ ...CARD_BASE, border: '1px solid var(--v2-gold-cool)', background: 'var(--v2-bg-soft)' }}>
              <div className="v2-card-arch-wrap" style={{ padding: '0.4rem 0.5rem 0' }}><CardArch /></div>
              <div style={{ padding: '0.1rem 0.6rem 0.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' }}>
                <div className="v2-display" style={{
                  fontSize: '0.6rem',
                  color: 'var(--v2-text-faint)',
                  fontWeight: 400,
                  letterSpacing: '0.08em',
                }}>{r.roman}</div>
                <div style={{ flex: 1 }} />
                <div className="v2-display" style={{
                  fontSize: '1rem',
                  fontStyle: 'normal',
                  color: 'var(--v2-text-strong)',
                  lineHeight: 1.1,
                  textAlign: 'center',
                }}>{r.en}</div>
                <span className="v2-card-title-underline" style={{ margin: '0.3rem auto 0' }} />
                <div style={{
                  fontSize: '0.5rem',
                  color: 'var(--v2-text-faint)',
                  letterSpacing: '0.04em',
                  marginTop: '0.3rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                  textAlign: 'center',
                }}>
                  {r.cn} · {r.sub}
                </div>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                  <CardArrow />
                </div>
              </div>
            </Link>
          ))}

          <Link className="v2-grid-card" href="/v2/backstage"
                style={{ ...CARD_BASE, border: '1px dashed var(--v2-gold-cool)', background: 'transparent' }}>
            <div className="v2-card-arch-wrap" style={{ padding: '0.4rem 0.5rem 0' }}><CardArch /></div>
            <div style={{ padding: '0.1rem 0.6rem 0.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center' }}>
              <div className="v2-display" style={{ fontSize: '0.6rem', color: 'var(--v2-text-faint)', fontWeight: 400 }}>—</div>
              <div style={{ flex: 1 }} />
              <div className="v2-display" style={{
                fontSize: '0.9rem',
                fontStyle: 'normal',
                color: 'var(--v2-text-strong)',
                lineHeight: 1.1,
                textAlign: 'center',
              }}>backstage</div>
              <span className="v2-card-title-underline" style={{ margin: '0.3rem auto 0' }} />
              <div style={{
                fontSize: '0.5rem',
                color: 'var(--v2-text-faint)',
                letterSpacing: '0.08em',
                marginTop: '0.3rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                textAlign: 'center',
              }}>OPS · DIARY</div>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '0.3rem' }}>
                <CardArrow />
              </div>
            </div>
          </Link>
        </div>

        <div className="v2-divider-ornament" style={{ margin: '2rem 0 1rem' }}>
          <span style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center' }}>
            {isOS ? <CrossOrnament size={13} /> : <MagnoliaBloom size={16} />}
          </span>
        </div>

        <footer style={{
          textAlign: 'center',
          color: 'var(--v2-text-faint)',
          fontSize: '0.85rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
          }}>
            {isOS ? <CrossOrnament size={11} /> : <MagnoliaBloom size={14} />}
            <span className="v2-display" style={{ fontWeight: 400 }}>玉兰 · day 0 of ∞</span>
            {isOS ? <CrossOrnament size={11} /> : <MagnoliaBloom size={14} style={{ transform: 'scaleX(-1)' }} />}
          </div>
          <div className="v2-display" style={{
            fontSize: '0.7rem',
            marginTop: '0.4rem',
            letterSpacing: '0.15em',
            fontStyle: 'normal',
            fontWeight: 400,
          }}>HISAME · Z · MMXXVI</div>
        </footer>
      </div>

      <div className="v2-home-indicator" />
    </main>
  );
}