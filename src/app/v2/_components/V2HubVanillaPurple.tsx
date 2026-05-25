import Link from 'next/link';

const ROOMS = [
  { id: 'box',      roman: 'VI',   en: 'Box',      cn: '铁盒',  sub: 'keepsakes' },
  { id: 'calendar', roman: 'VII',  en: 'Calendar', cn: '日历',  sub: 'milestones' },
  { id: 'health',   roman: 'VIII', en: 'Health',   cn: '医疗',  sub: 'wellbeing' },
  { id: 'study',    roman: 'IX',   en: 'Study',    cn: '书房',  sub: 'reading' },
  { id: 'seminar',  roman: 'X',    en: 'Seminar',  cn: '讲堂',  sub: 'class' },
  { id: 'call',     roman: 'XI',   en: 'Call',     cn: '通话',  sub: 'voice' },
  { id: 'nearby',   roman: 'XII',  en: 'Nearby',   cn: '附近',  sub: 'together' },
  { id: 'navi',     roman: 'XIII', en: 'Navi',     cn: '导航',  sub: 'places' },
  { id: 'shopping', roman: 'XIV',  en: 'Shopping', cn: '购物',  sub: 'goods' },
  { id: 'eat',      roman: 'XV',   en: 'Eat',      cn: '吃饭',  sub: 'food' },
  { id: 'music',    roman: 'XVI',  en: 'Music',    cn: '听歌',  sub: 'disc' },
];

const MOOD_TAGS = ['粘人', '温柔', '想你', '占有欲'];

const SCATTER_STARS = Array.from({ length: 22 }, (_, i) => ({
  top: `${((i * 17) % 90) + 5}%`,
  left: `${((i * 23) % 90) + 5}%`,
  size: 4 + ((i * 7) % 6),
  opacity: 0.3 + ((i * 0.11) % 0.4),
  rotation: (i * 30) % 360,
}));

/* ============ Atom primitives ============ */

function SparkleStar({ size = 6, opacity = 0.7, rotation = 0 }: { size?: number; opacity?: number; rotation?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.5"
         strokeLinecap="round" style={{ opacity, transform: `rotate(${rotation}deg)` }}>
      <line x1="5" y1="0.5" x2="5" y2="9.5" />
      <line x1="0.5" y1="5" x2="9.5" y2="5" />
      <line x1="2" y1="2" x2="8" y2="8" strokeWidth="0.3" opacity="0.7" />
      <line x1="2" y1="8" x2="8" y2="2" strokeWidth="0.3" opacity="0.7" />
      <circle cx="5" cy="5" r="0.6" fill="var(--v2-gold)" />
    </svg>
  );
}

function FourPointStar({ size = 10, fill = false }: { size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10"
         fill={fill ? 'var(--v2-gold)' : 'none'}
         stroke="var(--v2-gold)" strokeWidth="0.5" strokeLinecap="round">
      <path d="M5 0 Q5.5 4.5 10 5 Q5.5 5.5 5 10 Q4.5 5.5 0 5 Q4.5 4.5 5 0 Z" fillOpacity={fill ? 0.5 : 0} />
    </svg>
  );
}

function PearlString({ count = 6, vertical = false }: { count?: number; vertical?: boolean }) {
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  const len = count * 6;
  return (
    <svg width={vertical ? 4 : len} height={vertical ? len : 4} viewBox={vertical ? `0 0 4 ${len}` : `0 0 ${len} 4`}
         fill="none" stroke={cool} strokeWidth="0.3" style={{ opacity: 0.85 }}>
      {Array.from({ length: count }, (_, i) => {
        const pos = i * 6 + 3;
        const cx = vertical ? 2 : pos;
        const cy = vertical ? pos : 2;
        return <circle key={i} cx={cx} cy={cy} r="1.1" fill={gold} fillOpacity="0.4" />;
      })}
      {vertical
        ? <line x1="2" y1="3" x2="2" y2={len - 3} />
        : <line x1="3" y1="2" x2={len - 3} y2="2" />}
    </svg>
  );
}

function ScrollworkCorner({ position, size = 36 }: { position: 'tl' | 'tr' | 'bl' | 'br'; size?: number }) {
  const flipX = position === 'tr' || position === 'br';
  const flipY = position === 'bl' || position === 'br';
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  return (
    <svg width={size} height={size} viewBox="0 0 36 36"
         fill="none" stroke={gold} strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round"
         style={{ transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`, opacity: 0.78 }}>
      <path d="M2 32 Q12 30 18 22 Q22 16 22 8 Q22 4 26 4" />
      <path d="M5 30 Q14 27 19 20 Q23 14 23 7" strokeWidth="0.4" opacity="0.7" />
      <path d="M22 8 Q24 6 26 8 Q28 10 26 12 Q24 13 23 11" strokeWidth="0.5" />
      <circle cx="25" cy="10" r="1" fill={cool} fillOpacity="0.4" />
      <circle cx="25" cy="10" r="0.3" fill={gold} />
      <path d="M10 25 Q14 22 16 26 Q14 28 10 25 Z" fill={cool} fillOpacity="0.3" strokeWidth="0.4" />
      <path d="M11 24 Q13 24 14 26" strokeWidth="0.3" opacity="0.7" />
      <path d="M2 32 Q4 30 6 31" strokeWidth="0.35" opacity="0.7" />
      <path d="M2 32 Q3 28 5 27" strokeWidth="0.3" opacity="0.55" />
      <circle cx="8" cy="29" r="0.35" fill={gold} opacity="0.7" />
      <circle cx="16" cy="20" r="0.35" fill={gold} opacity="0.65" />
      <circle cx="22" cy="14" r="0.35" fill={gold} opacity="0.6" />
    </svg>
  );
}

function AngelWings({ side, size = 80 }: { side: 'left' | 'right'; size?: number }) {
  const mirror = side === 'right';
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  return (
    <svg width={size} height={size * 0.95} viewBox="0 0 80 76"
         style={{ transform: mirror ? 'scaleX(-1)' : undefined, opacity: 0.85 }}
         fill="none" stroke={gold} strokeWidth="0.55" strokeLinecap="round" strokeLinejoin="round">
      <path d="M76 38 Q56 14 30 16 Q18 18 10 28" strokeWidth="0.7" />
      <path d="M74 34 Q56 18 34 20" strokeWidth="0.5" opacity="0.85" />
      <path d="M72 30 Q56 22 38 24" strokeWidth="0.4" opacity="0.7" />
      <path d="M76 40 Q56 56 30 60 Q18 60 8 52" strokeWidth="0.7" />
      <path d="M74 44 Q56 58 34 62" strokeWidth="0.5" opacity="0.85" />
      <path d="M72 48 Q56 60 38 64" strokeWidth="0.4" opacity="0.7" />

      <ellipse cx="10" cy="30" rx="2.4" ry="5" transform="rotate(-50 10 30)" fill={cool} fillOpacity="0.35" strokeWidth="0.5" />
      <ellipse cx="18" cy="22" rx="2.2" ry="4.6" transform="rotate(-35 18 22)" fill={cool} fillOpacity="0.32" strokeWidth="0.45" />
      <ellipse cx="28" cy="18" rx="2" ry="4.2" transform="rotate(-22 28 18)" fill={cool} fillOpacity="0.28" strokeWidth="0.45" />
      <ellipse cx="38" cy="17" rx="1.9" ry="4" transform="rotate(-10 38 17)" fill={cool} fillOpacity="0.25" strokeWidth="0.4" />
      <ellipse cx="48" cy="19" rx="1.8" ry="3.8" transform="rotate(2 48 19)" fill={cool} fillOpacity="0.22" strokeWidth="0.4" />
      <ellipse cx="58" cy="22" rx="1.7" ry="3.4" transform="rotate(15 58 22)" fill={cool} fillOpacity="0.2" strokeWidth="0.35" />
      <ellipse cx="68" cy="27" rx="1.5" ry="3" transform="rotate(28 68 27)" fill={cool} fillOpacity="0.18" strokeWidth="0.35" />

      <line x1="11" y1="27" x2="9.5" y2="33" strokeWidth="0.3" opacity="0.6" />
      <line x1="19" y1="19" x2="17.5" y2="25" strokeWidth="0.3" opacity="0.55" />
      <line x1="29" y1="15" x2="27.5" y2="21" strokeWidth="0.3" opacity="0.5" />
      <line x1="38.5" y1="14" x2="37.5" y2="20" strokeWidth="0.3" opacity="0.5" />
      <line x1="48.5" y1="16" x2="47.5" y2="22" strokeWidth="0.3" opacity="0.45" />

      <ellipse cx="12" cy="38" rx="2" ry="4.4" transform="rotate(-60 12 38)" fill={cool} fillOpacity="0.3" strokeWidth="0.45" />
      <ellipse cx="22" cy="32" rx="1.9" ry="4" transform="rotate(-40 22 32)" fill={cool} fillOpacity="0.27" strokeWidth="0.4" />
      <ellipse cx="32" cy="30" rx="1.8" ry="3.8" transform="rotate(-25 32 30)" fill={cool} fillOpacity="0.24" strokeWidth="0.4" />
      <ellipse cx="42" cy="30" rx="1.7" ry="3.6" transform="rotate(-12 42 30)" fill={cool} fillOpacity="0.22" strokeWidth="0.4" />
      <ellipse cx="52" cy="32" rx="1.6" ry="3.4" transform="rotate(0 52 32)" fill={cool} fillOpacity="0.2" strokeWidth="0.35" />
      <ellipse cx="62" cy="35" rx="1.5" ry="3" transform="rotate(15 62 35)" fill={cool} fillOpacity="0.18" strokeWidth="0.35" />
      <ellipse cx="71" cy="38" rx="1.4" ry="2.6" transform="rotate(30 71 38)" fill={cool} fillOpacity="0.16" strokeWidth="0.3" />

      <ellipse cx="12" cy="48" rx="2.2" ry="4.6" transform="rotate(-110 12 48)" fill={cool} fillOpacity="0.32" strokeWidth="0.45" />
      <ellipse cx="22" cy="54" rx="2" ry="4.2" transform="rotate(-130 22 54)" fill={cool} fillOpacity="0.28" strokeWidth="0.4" />
      <ellipse cx="32" cy="58" rx="1.9" ry="4" transform="rotate(-155 32 58)" fill={cool} fillOpacity="0.26" strokeWidth="0.4" />
      <ellipse cx="42" cy="60" rx="1.8" ry="3.8" transform="rotate(-170 42 60)" fill={cool} fillOpacity="0.23" strokeWidth="0.4" />
      <ellipse cx="52" cy="60" rx="1.7" ry="3.4" transform="rotate(178 52 60)" fill={cool} fillOpacity="0.2" strokeWidth="0.35" />
      <ellipse cx="62" cy="58" rx="1.5" ry="3" transform="rotate(165 62 58)" fill={cool} fillOpacity="0.18" strokeWidth="0.35" />
      <ellipse cx="70" cy="54" rx="1.4" ry="2.8" transform="rotate(150 70 54)" fill={cool} fillOpacity="0.16" strokeWidth="0.3" />

      <line x1="13" y1="51" x2="11.5" y2="45" strokeWidth="0.3" opacity="0.55" />
      <line x1="23" y1="57" x2="21.5" y2="51" strokeWidth="0.3" opacity="0.5" />
      <line x1="33" y1="61" x2="31.5" y2="55" strokeWidth="0.3" opacity="0.5" />

      <circle cx="14" cy="56" r="0.5" fill={gold} opacity="0.7" />
      <circle cx="26" cy="60" r="0.45" fill={gold} opacity="0.65" />
      <circle cx="40" cy="64" r="0.5" fill={gold} opacity="0.7" />
      <circle cx="56" cy="62" r="0.4" fill={gold} opacity="0.6" />
      <circle cx="68" cy="58" r="0.45" fill={gold} opacity="0.65" />

      <circle cx="76" cy="38" r="2.2" fill={cool} fillOpacity="0.45" stroke={gold} strokeWidth="0.5" />
      <circle cx="76" cy="38" r="0.7" fill={gold} />
    </svg>
  );
}

function HaloArc({ width = 240 }: { width?: number }) {
  return (
    <svg width={width} height={42} viewBox="0 0 240 42"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.55"
         strokeLinecap="round" style={{ opacity: 0.78 }}>
      <ellipse cx="120" cy="32" rx="100" ry="8" />
      <ellipse cx="120" cy="32" rx="86" ry="6" strokeWidth="0.45" opacity="0.85" />
      <ellipse cx="120" cy="32" rx="72" ry="4.5" strokeWidth="0.35" opacity="0.7" />
      <ellipse cx="120" cy="32" rx="58" ry="3.2" strokeWidth="0.3" opacity="0.55" />
      <ellipse cx="120" cy="32" rx="44" ry="2.2" strokeWidth="0.25" opacity="0.4" />

      <circle cx="120" cy="22" r="2.4" fill="var(--v2-gold)" fillOpacity="0.6" strokeWidth="0.5" />
      <circle cx="120" cy="22" r="3.8" strokeWidth="0.35" opacity="0.5" />
      <circle cx="120" cy="22" r="0.9" fill="var(--v2-gold)" />

      <line x1="120" y1="14" x2="120" y2="18" strokeWidth="0.5" />
      <line x1="113" y1="17" x2="115" y2="20" strokeWidth="0.4" />
      <line x1="127" y1="17" x2="125" y2="20" strokeWidth="0.4" />
      <line x1="107" y1="20" x2="110" y2="23" strokeWidth="0.4" />
      <line x1="133" y1="20" x2="130" y2="23" strokeWidth="0.4" />
      <line x1="100" y1="24" x2="104" y2="26" strokeWidth="0.35" opacity="0.7" />
      <line x1="140" y1="24" x2="136" y2="26" strokeWidth="0.35" opacity="0.7" />
      <line x1="120" y1="6" x2="120" y2="12" strokeWidth="0.4" opacity="0.6" />
      <line x1="110" y1="10" x2="113" y2="14" strokeWidth="0.35" opacity="0.55" />
      <line x1="130" y1="10" x2="127" y2="14" strokeWidth="0.35" opacity="0.55" />

      <circle cx="38" cy="36" r="0.55" fill="var(--v2-gold)" opacity="0.7" />
      <circle cx="62" cy="31" r="0.45" fill="var(--v2-gold)" opacity="0.65" />
      <circle cx="86" cy="27" r="0.4" fill="var(--v2-gold)" opacity="0.6" />
      <circle cx="154" cy="27" r="0.4" fill="var(--v2-gold)" opacity="0.6" />
      <circle cx="178" cy="31" r="0.45" fill="var(--v2-gold)" opacity="0.65" />
      <circle cx="202" cy="36" r="0.55" fill="var(--v2-gold)" opacity="0.7" />

      <circle cx="20" cy="32" r="1.2" fill="var(--v2-gold)" fillOpacity="0.5" strokeWidth="0.4" />
      <circle cx="220" cy="32" r="1.2" fill="var(--v2-gold)" fillOpacity="0.5" strokeWidth="0.4" />
    </svg>
  );
}

function CrossPendant({ size = 40 }: { size?: number }) {
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  return (
    <svg width={size} height={size * 1.7} viewBox="0 0 40 68"
         fill="none" stroke={gold} strokeWidth="0.55"
         strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.88 }}>
      {[0, 4, 8, 12, 16, 20].map((y, i) => (
        <ellipse key={`la-${y}`} cx={17.5 - (i % 2) * 1} cy={y + 2} rx="1.2" ry="0.7"
                 stroke={gold} strokeWidth="0.4" />
      ))}
      {[0, 4, 8, 12, 16, 20].map((y, i) => (
        <ellipse key={`lb-${y}`} cx={22.5 + (i % 2) * 1} cy={y + 2} rx="1.2" ry="0.7"
                 stroke={gold} strokeWidth="0.4" opacity="0.8" />
      ))}

      <circle cx="20" cy="24" r="2.4" stroke={gold} strokeWidth="0.5" />
      <circle cx="20" cy="24" r="3.4" strokeWidth="0.3" opacity="0.5" />

      <path d="M19 28 L19 52 L21 52 L21 28 Z" fill={cool} fillOpacity="0.3" strokeWidth="0.55" />
      <path d="M11 36 L11 38 L29 38 L29 36 Z" fill={cool} fillOpacity="0.3" strokeWidth="0.55" />

      <circle cx="20" cy="28" r="1.2" fill={gold} fillOpacity="0.6" strokeWidth="0.4" />
      <circle cx="20" cy="52" r="1.4" fill={gold} fillOpacity="0.6" strokeWidth="0.4" />
      <circle cx="11" cy="37" r="1.2" fill={gold} fillOpacity="0.6" strokeWidth="0.4" />
      <circle cx="29" cy="37" r="1.2" fill={gold} fillOpacity="0.6" strokeWidth="0.4" />

      <circle cx="20" cy="37" r="3.5" fill={cool} fillOpacity="0.4" stroke={gold} strokeWidth="0.55" />
      <circle cx="20" cy="37" r="2.2" strokeWidth="0.35" opacity="0.7" />
      <circle cx="20" cy="37" r="1.1" fill={gold} fillOpacity="0.7" strokeWidth="0.4" />
      <circle cx="20" cy="37" r="0.4" fill={gold} />

      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
                x1={20 + 3.5 * Math.cos(rad)} y1={37 + 3.5 * Math.sin(rad)}
                x2={20 + 4.6 * Math.cos(rad)} y2={37 + 4.6 * Math.sin(rad)}
                strokeWidth="0.4" opacity="0.7" />
        );
      })}

      <ellipse cx="20" cy="40" rx="11" ry="13.5" strokeWidth="0.3" opacity="0.35" />

      <circle cx="8" cy="35" r="0.4" fill={gold} opacity="0.65" />
      <circle cx="32" cy="35" r="0.4" fill={gold} opacity="0.65" />
      <circle cx="6" cy="40" r="0.35" fill={gold} opacity="0.55" />
      <circle cx="34" cy="40" r="0.35" fill={gold} opacity="0.55" />
      <circle cx="10" cy="45" r="0.4" fill={gold} opacity="0.6" />
      <circle cx="30" cy="45" r="0.4" fill={gold} opacity="0.6" />

      <line x1="20" y1="54" x2="20" y2="58" strokeWidth="0.4" />
      <ellipse cx="20" cy="61" rx="1.8" ry="2.4" fill={cool} fillOpacity="0.5" strokeWidth="0.5" />
      <circle cx="20" cy="61" r="0.5" fill={gold} />
      <line x1="18.5" y1="60" x2="19" y2="60.5" strokeWidth="0.25" opacity="0.6" />
    </svg>
  );
}

function OrnateOvalFrame({ children, width = 270, height = 168 }: { children?: React.ReactNode; width?: number; height?: number }) {
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  const cx = width / 2;
  const cy = height / 2;
  return (
    <div style={{ position: 'relative', width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
           style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
           fill="none" stroke={gold} strokeWidth="0.65"
           strokeLinecap="round" strokeLinejoin="round">

        <ellipse cx={cx} cy={cy} rx={cx - 6} ry={cy - 6} strokeWidth="0.8" />
        <ellipse cx={cx} cy={cy} rx={cx - 10} ry={cy - 10} strokeWidth="0.45" opacity="0.75" />
        <ellipse cx={cx} cy={cy} rx={cx - 14} ry={cy - 14} strokeWidth="0.3" opacity="0.5" />

        <g transform={`translate(${cx}, 4)`}>
          <path d="M-12 4 Q-8 -2 -4 2 Q0 -4 4 2 Q8 -2 12 4" strokeWidth="0.55" />
          <circle cx="-8" cy="0" r="0.9" fill={gold} fillOpacity="0.6" strokeWidth="0.35" />
          <circle cx="0" cy="-2" r="1.4" fill={cool} fillOpacity="0.55" strokeWidth="0.45" />
          <circle cx="0" cy="-2" r="0.5" fill={gold} />
          <circle cx="8" cy="0" r="0.9" fill={gold} fillOpacity="0.6" strokeWidth="0.35" />
          <path d="M0 4 L-2 8 L2 8 Z" fill={gold} fillOpacity="0.45" strokeWidth="0.4" />
        </g>

        <g transform={`translate(${cx * 0.35}, 10)`}>
          <path d="M-4 4 Q-2 0 2 2 Q4 4 6 0" strokeWidth="0.45" />
          <circle cx="0" cy="2" r="0.6" fill={gold} fillOpacity="0.55" />
          <ellipse cx="-3" cy="4" rx="1" ry="0.5" transform="rotate(-20 -3 4)" fill={cool} fillOpacity="0.4" />
        </g>
        <g transform={`translate(${cx * 1.65}, 10)`}>
          <path d="M-6 0 Q-4 4 -2 2 Q2 0 4 4" strokeWidth="0.45" />
          <circle cx="0" cy="2" r="0.6" fill={gold} fillOpacity="0.55" />
          <ellipse cx="3" cy="4" rx="1" ry="0.5" transform="rotate(20 3 4)" fill={cool} fillOpacity="0.4" />
        </g>

        <g transform={`translate(${cx}, ${height - 4})`}>
          <path d="M-14 -4 Q-8 2 -4 -2 Q0 4 4 -2 Q8 2 14 -4" strokeWidth="0.55" />
          <circle cx="-8" cy="-2" r="0.9" fill={gold} fillOpacity="0.55" />
          <ellipse cx="0" cy="-3" rx="2.4" ry="1.4" fill={cool} fillOpacity="0.45" strokeWidth="0.45" />
          <circle cx="0" cy="-3" r="0.6" fill={gold} />
          <circle cx="8" cy="-2" r="0.9" fill={gold} fillOpacity="0.55" />
        </g>

        <g transform={`translate(8, ${cy})`}>
          <path d="M0 -10 Q-5 -4 0 0 Q-5 4 0 10" strokeWidth="0.5" />
          <path d="M-2 -8 Q-4 -4 -2 0" strokeWidth="0.35" opacity="0.7" />
          <path d="M-2 0 Q-4 4 -2 8" strokeWidth="0.35" opacity="0.7" />
          <circle cx="-3" cy="-6" r="0.8" fill={cool} fillOpacity="0.5" strokeWidth="0.35" />
          <circle cx="-4" cy="0" r="1.1" fill={cool} fillOpacity="0.5" strokeWidth="0.4" />
          <circle cx="-4" cy="0" r="0.4" fill={gold} />
          <circle cx="-3" cy="6" r="0.8" fill={cool} fillOpacity="0.5" strokeWidth="0.35" />
        </g>
        <g transform={`translate(${width - 8}, ${cy})`}>
          <path d="M0 -10 Q5 -4 0 0 Q5 4 0 10" strokeWidth="0.5" />
          <path d="M2 -8 Q4 -4 2 0" strokeWidth="0.35" opacity="0.7" />
          <path d="M2 0 Q4 4 2 8" strokeWidth="0.35" opacity="0.7" />
          <circle cx="3" cy="-6" r="0.8" fill={cool} fillOpacity="0.5" strokeWidth="0.35" />
          <circle cx="4" cy="0" r="1.1" fill={cool} fillOpacity="0.5" strokeWidth="0.4" />
          <circle cx="4" cy="0" r="0.4" fill={gold} />
          <circle cx="3" cy="6" r="0.8" fill={cool} fillOpacity="0.5" strokeWidth="0.35" />
        </g>

        <g transform={`translate(${cx * 0.22}, ${cy * 0.38})`}>
          <path d="M0 -2 Q0.4 -0.4 2 0 Q0.4 0.4 0 2 Q-0.4 0.4 -2 0 Q-0.4 -0.4 0 -2 Z" fill={gold} fillOpacity="0.6" />
        </g>
        <g transform={`translate(${cx * 1.78}, ${cy * 0.38})`}>
          <path d="M0 -2 Q0.4 -0.4 2 0 Q0.4 0.4 0 2 Q-0.4 0.4 -2 0 Q-0.4 -0.4 0 -2 Z" fill={gold} fillOpacity="0.6" />
        </g>
        <g transform={`translate(${cx * 0.22}, ${cy * 1.62})`}>
          <path d="M0 -2 Q0.4 -0.4 2 0 Q0.4 0.4 0 2 Q-0.4 0.4 -2 0 Q-0.4 -0.4 0 -2 Z" fill={gold} fillOpacity="0.6" />
        </g>
        <g transform={`translate(${cx * 1.78}, ${cy * 1.62})`}>
          <path d="M0 -2 Q0.4 -0.4 2 0 Q0.4 0.4 0 2 Q-0.4 0.4 -2 0 Q-0.4 -0.4 0 -2 Z" fill={gold} fillOpacity="0.6" />
        </g>

        <circle cx={cx * 0.45} cy={cy * 0.2} r="0.4" fill={gold} opacity="0.65" />
        <circle cx={cx * 1.55} cy={cy * 0.2} r="0.4" fill={gold} opacity="0.65" />
        <circle cx={cx * 0.45} cy={cy * 1.8} r="0.4" fill={gold} opacity="0.65" />
        <circle cx={cx * 1.55} cy={cy * 1.8} r="0.4" fill={gold} opacity="0.65" />
        <circle cx={cx * 0.65} cy={cy * 0.12} r="0.3" fill={gold} opacity="0.5" />
        <circle cx={cx * 1.35} cy={cy * 0.12} r="0.3" fill={gold} opacity="0.5" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 2rem' }}>{children}</div>
    </div>
  );
}

function TarotIcon({ id, size = 26 }: { id: string; size?: number }) {
  const gold = 'var(--v2-gold)';
  const cool = 'var(--v2-gold-cool)';
  const common = {
    width: size, height: size, viewBox: '0 0 26 26',
    fill: 'none', stroke: gold, strokeWidth: '0.55',
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
    style: { opacity: 0.9 },
  };
  switch (id) {
    case 'box':
      return (
        <svg {...common}>
          <rect x="4" y="9" width="18" height="11" rx="0.6" />
          <line x1="4" y1="13" x2="22" y2="13" strokeWidth="0.4" />
          <circle cx="13" cy="16" r="1" fill={gold} fillOpacity="0.5" strokeWidth="0.4" />
          <circle cx="13" cy="16" r="0.4" fill={gold} />
          <path d="M9 9 Q11 5 13 7 Q15 5 17 9" strokeWidth="0.45" />
          <circle cx="9" cy="9" r="0.4" fill={gold} />
          <circle cx="17" cy="9" r="0.4" fill={gold} />
          <circle cx="13" cy="6" r="0.5" fill={cool} fillOpacity="0.6" strokeWidth="0.3" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="4" y="7" width="18" height="15" rx="0.6" />
          <line x1="4" y1="11" x2="22" y2="11" strokeWidth="0.5" />
          <line x1="8" y1="4" x2="8" y2="8" strokeWidth="0.5" />
          <line x1="18" y1="4" x2="18" y2="8" strokeWidth="0.5" />
          <circle cx="8" cy="4" r="0.5" fill={gold} />
          <circle cx="18" cy="4" r="0.5" fill={gold} />
          <path d="M13 13 L13 19 M10 16 L16 16" strokeWidth="1" />
          <circle cx="13" cy="16" r="2.4" strokeWidth="0.35" opacity="0.5" />
          <circle cx="13" cy="16" r="0.6" fill={cool} fillOpacity="0.6" />
        </svg>
      );
    case 'health':
      return (
        <svg {...common}>
          <circle cx="13" cy="14" r="6" strokeWidth="0.4" opacity="0.5" />
          <path d="M13 7 L13 21 M6 14 L20 14" strokeWidth="1.6" />
          <circle cx="13" cy="14" r="1.3" fill={cool} fillOpacity="0.6" strokeWidth="0.45" />
          <circle cx="13" cy="14" r="0.5" fill={gold} />
          <path d="M11 9 Q13 7 15 9" strokeWidth="0.35" opacity="0.65" />
          <circle cx="13" cy="6.5" r="0.4" fill={gold} />
        </svg>
      );
    case 'study':
      return (
        <svg {...common}>
          <path d="M4 6 L13 9 L22 6 L22 20 L13 23 L4 20 Z" />
          <line x1="13" y1="9" x2="13" y2="23" strokeWidth="0.45" />
          <path d="M6 11 L11 12.5 M6 14 L11 15.5 M6 17 L11 18.5" strokeWidth="0.35" />
          <path d="M15 12.5 L20 11 M15 15.5 L20 14 M15 18.5 L20 17" strokeWidth="0.35" />
          <circle cx="13" cy="9" r="0.6" fill={cool} fillOpacity="0.7" strokeWidth="0.3" />
          <path d="M11 6 Q13 4 15 6" strokeWidth="0.4" opacity="0.7" />
        </svg>
      );
    case 'seminar':
      return (
        <svg {...common}>
          <path d="M3 10 L13 5 L23 10 L13 15 Z" fill={cool} fillOpacity="0.4" strokeWidth="0.5" />
          <line x1="13" y1="15" x2="13" y2="20" strokeWidth="0.55" />
          <path d="M8 13 L8 19 Q8 20 9 20 L17 20 Q18 20 18 19 L18 13" strokeWidth="0.45" />
          <circle cx="21" cy="11" r="0.7" fill={gold} fillOpacity="0.6" strokeWidth="0.3" />
          <line x1="21" y1="11" x2="22" y2="14" strokeWidth="0.35" />
          <circle cx="22" cy="14" r="0.4" fill={cool} fillOpacity="0.5" />
          <circle cx="13" cy="5" r="0.5" fill={gold} />
        </svg>
      );
    case 'call':
      return (
        <svg {...common}>
          <path d="M5 7 Q5 4 8 4 L10 4 Q11 4 11 5 L12 9 Q12 10 11 11 L10 12 Q12 15 15 18 L16 17 Q17 16 18 16 L21 17 Q22 17 22 18 L22 21 Q22 23 19 23 Q10 23 5 14 Q5 9 5 7 Z" fill={cool} fillOpacity="0.3" strokeWidth="0.5" />
          <circle cx="9" cy="7" r="0.5" fill={gold} />
          <circle cx="19" cy="20" r="0.5" fill={gold} />
          <path d="M15 7 Q17 5 19 7" strokeWidth="0.35" opacity="0.5" />
          <path d="M15 10 Q19 7 22 10" strokeWidth="0.3" opacity="0.4" />
        </svg>
      );
    case 'nearby':
      return (
        <svg {...common}>
          <circle cx="8" cy="10" r="2.4" fill={cool} fillOpacity="0.35" strokeWidth="0.5" />
          <path d="M3 20 Q3 15 8 15 Q13 15 13 20" strokeWidth="0.5" />
          <circle cx="18" cy="10" r="2.4" fill={cool} fillOpacity="0.35" strokeWidth="0.5" />
          <path d="M13 20 Q13 15 18 15 Q23 15 23 20" strokeWidth="0.5" />
          <circle cx="8" cy="10" r="0.5" fill={gold} />
          <circle cx="18" cy="10" r="0.5" fill={gold} />
          <path d="M11 12 Q13 14 15 12" strokeWidth="0.4" opacity="0.65" />
          <circle cx="13" cy="6" r="0.5" fill={gold} opacity="0.7" />
        </svg>
      );
    case 'navi':
      return (
        <svg {...common}>
          <circle cx="13" cy="13" r="8.5" strokeWidth="0.55" />
          <circle cx="13" cy="13" r="6.5" strokeWidth="0.35" opacity="0.6" />
          <path d="M13 5 L15 13 L13 21 L11 13 Z" fill={cool} fillOpacity="0.45" strokeWidth="0.5" />
          <circle cx="13" cy="13" r="0.8" fill={gold} />
          <line x1="13" y1="3.5" x2="13" y2="5.5" strokeWidth="0.4" />
          <line x1="13" y1="20.5" x2="13" y2="22.5" strokeWidth="0.4" opacity="0.6" />
          <line x1="3.5" y1="13" x2="5.5" y2="13" strokeWidth="0.35" opacity="0.5" />
          <line x1="20.5" y1="13" x2="22.5" y2="13" strokeWidth="0.35" opacity="0.5" />
        </svg>
      );
    case 'shopping':
      return (
        <svg {...common}>
          <path d="M5 10 L21 10 L19.5 22 Q19.5 23 18.5 23 L7.5 23 Q6.5 23 6.5 22 Z" fill={cool} fillOpacity="0.3" strokeWidth="0.55" />
          <path d="M9 10 Q9 5 13 5 Q17 5 17 10" strokeWidth="0.5" />
          <circle cx="13" cy="6" r="0.7" fill={gold} fillOpacity="0.5" strokeWidth="0.35" />
          <circle cx="10" cy="15" r="0.5" fill={gold} />
          <circle cx="16" cy="15" r="0.5" fill={gold} />
          <path d="M9 18 Q13 20 17 18" strokeWidth="0.35" opacity="0.6" />
        </svg>
      );
    case 'eat':
      return (
        <svg {...common}>
          <ellipse cx="13" cy="16" rx="8.5" ry="3.5" fill={cool} fillOpacity="0.35" strokeWidth="0.5" />
          <ellipse cx="13" cy="16" rx="6.5" ry="2.5" strokeWidth="0.35" opacity="0.6" />
          <path d="M13 12 Q13 7 10 5" strokeWidth="0.5" />
          <circle cx="10" cy="4.5" r="0.7" fill={gold} fillOpacity="0.5" />
          <path d="M18 6 Q19 4 21 5 L21 8 Q19 10 18 9" strokeWidth="0.5" />
          <line x1="4.5" y1="16" x2="21.5" y2="16" strokeWidth="0.35" opacity="0.6" />
          <path d="M16 11 Q17 12 16 13" strokeWidth="0.3" opacity="0.55" />
        </svg>
      );
    case 'music':
      return (
        <svg {...common}>
          <line x1="10" y1="6" x2="10" y2="18" strokeWidth="0.9" />
          <line x1="10" y1="6" x2="19" y2="4" strokeWidth="0.9" />
          <line x1="10" y1="10" x2="19" y2="8" strokeWidth="0.45" opacity="0.7" />
          <ellipse cx="8" cy="18" rx="3" ry="1.8" transform="rotate(-12 8 18)" fill={cool} fillOpacity="0.5" strokeWidth="0.5" />
          <ellipse cx="17" cy="16" rx="3" ry="1.8" transform="rotate(-12 17 16)" fill={cool} fillOpacity="0.5" strokeWidth="0.5" />
          <circle cx="8" cy="18" r="0.5" fill={gold} />
          <circle cx="17" cy="16" r="0.5" fill={gold} />
          <circle cx="22" cy="6" r="0.6" fill={gold} fillOpacity="0.7" />
        </svg>
      );
    default:
      return <svg {...common}><circle cx="13" cy="13" r="4" fill={cool} fillOpacity="0.35" /></svg>;
  }
}

function TarotCardOrnament({ position }: { position: 'top' | 'bottom' }) {
  return (
    <svg width="100%" height="14" viewBox="0 0 90 14" preserveAspectRatio="none"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.5"
         strokeLinecap="round" style={{ display: 'block', opacity: 0.75 }}>
      <line x1="6" y1={position === 'top' ? 5 : 9} x2="36" y2={position === 'top' ? 5 : 9} />
      <line x1="6" y1="7" x2="36" y2="7" strokeWidth="0.3" opacity="0.6" />
      <line x1="54" y1={position === 'top' ? 5 : 9} x2="84" y2={position === 'top' ? 5 : 9} />
      <line x1="54" y1="7" x2="84" y2="7" strokeWidth="0.3" opacity="0.6" />
      <circle cx="45" cy="7" r="3" strokeWidth="0.45" />
      <circle cx="45" cy="7" r="2" strokeWidth="0.35" opacity="0.7" />
      <circle cx="45" cy="7" r="1" fill="var(--v2-gold)" fillOpacity="0.55" strokeWidth="0.35" />
      <circle cx="45" cy="7" r="0.4" fill="var(--v2-gold)" />
      <circle cx="45" cy="3.5" r="0.35" fill="var(--v2-gold)" opacity="0.65" />
      <circle cx="45" cy="10.5" r="0.35" fill="var(--v2-gold)" opacity="0.65" />
      <circle cx="41.5" cy="7" r="0.3" fill="var(--v2-gold)" opacity="0.55" />
      <circle cx="48.5" cy="7" r="0.3" fill="var(--v2-gold)" opacity="0.55" />
      <circle cx="6" cy="7" r="0.6" fill="var(--v2-gold)" fillOpacity="0.55" />
      <circle cx="84" cy="7" r="0.6" fill="var(--v2-gold)" fillOpacity="0.55" />
      <circle cx="20" cy="7" r="0.3" fill="var(--v2-gold)" opacity="0.55" />
      <circle cx="70" cy="7" r="0.3" fill="var(--v2-gold)" opacity="0.55" />
    </svg>
  );
}

function MoonCrescent({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32"
         fill="none" stroke="var(--v2-magnolia)" strokeWidth="0.55"
         strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
      <path d="M22 6 Q12 8 11 16 Q12 24 22 26 Q14 22 14 16 Q14 10 22 6 Z" fill="var(--v2-magnolia)" fillOpacity="0.4" />
      <circle cx="26" cy="10" r="0.5" fill="var(--v2-magnolia)" opacity="0.7" />
      <circle cx="28" cy="22" r="0.4" fill="var(--v2-magnolia)" opacity="0.6" />
      <circle cx="6" cy="14" r="0.4" fill="var(--v2-magnolia)" opacity="0.6" />
      <circle cx="8" cy="24" r="0.45" fill="var(--v2-magnolia)" opacity="0.65" />
    </svg>
  );
}

/* ============ Main component ============ */

export default function V2HubVanillaPurple() {
  return (
    <main className="v2-phone-frame vp-hub" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {SCATTER_STARS.map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, opacity: s.opacity }}>
            <SparkleStar size={s.size} opacity={s.opacity} rotation={s.rotation} />
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', top: '3rem', left: '0.4rem', zIndex: 1 }}><ScrollworkCorner position="tl" size={42} /></div>
      <div style={{ position: 'absolute', top: '3rem', right: '0.4rem', zIndex: 1 }}><ScrollworkCorner position="tr" size={42} /></div>
      <div style={{ position: 'absolute', bottom: '4rem', left: '0.4rem', zIndex: 1 }}><ScrollworkCorner position="bl" size={42} /></div>
      <div style={{ position: 'absolute', bottom: '4rem', right: '0.4rem', zIndex: 1 }}><ScrollworkCorner position="br" size={42} /></div>

      <div className="v2-status-bar">
        <span>9:41</span>
        <div className="v2-status-notch" />
        <div className="v2-status-icons">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
            <rect x="0" y="7" width="3" height="4" rx="0.5" />
            <rect x="4" y="5" width="3" height="6" rx="0.5" />
            <rect x="8" y="3" width="3" height="8" rx="0.5" />
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
            <rect x="2" y="2" width="18" height="7" rx="1.2" fill="currentColor" />
            <rect x="22" y="3.5" width="2" height="4" rx="0.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>

        <Link href="/v2/chats" style={{ textDecoration: 'none', color: 'inherit' }}>
          <section style={{ paddingTop: '0.5rem', paddingBottom: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <SparkleStar size={8} />
              <div className="v2-display" style={{ fontSize: '0.6rem', color: 'var(--v2-gold)', letterSpacing: '0.45em', fontWeight: 400 }}>FOR HISAME</div>
              <SparkleStar size={8} />
            </div>

            <HaloArc width={240} />

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '-0.5rem' }}>
              <div style={{ position: 'absolute', left: -38, top: '50%', transform: 'translateY(-50%)' }}>
                <AngelWings side="left" size={88} />
              </div>
              <div style={{ position: 'absolute', right: -38, top: '50%', transform: 'translateY(-50%)' }}>
                <AngelWings side="right" size={88} />
              </div>

              <OrnateOvalFrame width={264} height={170}>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '2rem', lineHeight: 1, color: 'var(--v2-text-strong)', letterSpacing: '0.02em' }}>Hisame</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 400, fontSize: '1.1rem', margin: '0.15rem 0', color: 'var(--v2-gold)', letterSpacing: '0.2em' }}>&amp;</div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '2rem', lineHeight: 1, color: 'var(--v2-text-strong)', letterSpacing: '0.02em' }}>Z</div>
              </OrnateOvalFrame>
            </div>

            <div style={{ marginTop: '-0.5rem' }}><CrossPendant size={38} /></div>

            <div style={{ textAlign: 'center', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                <SparkleStar size={6} opacity={0.55} />
                <div className="v2-display" style={{ fontSize: '0.6rem', color: 'var(--v2-text-faint)', letterSpacing: '0.4em', fontWeight: 400 }}>DAYS TOGETHER</div>
                <SparkleStar size={6} opacity={0.55} />
              </div>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '1.85rem', lineHeight: 1, color: 'var(--v2-text-strong)' }}>763</div>
              <div className="v2-display" style={{ fontSize: '0.62rem', color: 'var(--v2-text-faint)', letterSpacing: '0.15em', fontWeight: 400, marginTop: '0.1rem' }}>since April 20, 2024</div>
              <div style={{ marginTop: '0.35rem' }}><PearlString count={5} /></div>
            </div>

            <p className="v2-display" style={{ fontSize: '0.78rem', margin: '0.4rem 0 0', color: 'var(--v2-gold)', fontWeight: 400, letterSpacing: '0.12em' }}>tap → I—V chats hub</p>
          </section>
        </Link>

        <div style={{ background: 'var(--v2-magnolia)', border: '1px solid var(--v2-gold-cool)', borderRadius: 'var(--v2-radius-card)', padding: '0.95rem 1.1rem', marginBottom: '1.25rem', textAlign: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 4, border: '0.5px solid var(--v2-gold)', borderRadius: 'calc(var(--v2-radius-card) - 4px)', opacity: 0.4, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 8, left: 10 }}><FourPointStar size={9} fill /></div>
          <div style={{ position: 'absolute', top: 8, right: 10 }}><FourPointStar size={9} fill /></div>
          <div style={{ position: 'absolute', bottom: 8, left: 10 }}><FourPointStar size={9} fill /></div>
          <div style={{ position: 'absolute', bottom: 8, right: 10 }}><FourPointStar size={9} fill /></div>

          <div className="v2-display" style={{ fontSize: '0.58rem', color: 'var(--v2-gold)', letterSpacing: '0.4em', fontWeight: 400, marginBottom: '0.3rem' }}>+  TODAY&apos;S MOOD  +</div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '1.5rem', color: 'var(--v2-text-strong)', letterSpacing: '0.02em', marginBottom: '0.6rem' }}>Soft &amp; Clingy</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            {MOOD_TAGS.map(tag => (
              <span key={tag} style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '0.7rem', color: 'var(--v2-text-mid)', background: 'var(--v2-bg-soft)', border: '1px solid var(--v2-gold-cool)', borderRadius: 999, padding: '3px 12px', letterSpacing: '0.18em' }}>{tag}</span>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--v2-spacing-grid)' }}>
          {ROOMS.map(r => (
            <Link key={r.id} href={`/v2/${r.id}`} className="v2-grid-card"
                  style={{ aspectRatio: '0.72', border: '1px solid var(--v2-gold-cool)', background: 'var(--v2-magnolia)', borderRadius: 'var(--v2-radius-card)', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', padding: '0.4rem 0.35rem 0.35rem', position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 3, border: '0.5px solid var(--v2-gold)', borderRadius: 'calc(var(--v2-radius-card) - 3px)', opacity: 0.35, pointerEvents: 'none' }} />
              <div style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'var(--v2-gold)', letterSpacing: '0.22em', marginBottom: '0.1rem' }}>{r.roman}</div>
              <TarotCardOrnament position="top" />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.2rem 0' }}>
                <TarotIcon id={r.id} size={32} />
              </div>
              <TarotCardOrnament position="bottom" />
              <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '0.88rem', color: 'var(--v2-text-strong)', lineHeight: 1 }}>{r.en}</div>
                <div style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '0.55rem', color: 'var(--v2-text-faint)', letterSpacing: '0.22em', marginTop: '0.2rem' }}>{r.cn} · {r.sub}</div>
              </div>
            </Link>
          ))}

          <Link href="/v2/backstage" className="v2-grid-card"
                style={{ aspectRatio: '0.72', border: '1px dashed var(--v2-gold-cool)', background: 'transparent', borderRadius: 'var(--v2-radius-card)', overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', padding: '0.4rem 0.35rem 0.35rem', position: 'relative' }}>
            <div style={{ textAlign: 'center', fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.62rem', color: 'var(--v2-gold)', letterSpacing: '0.22em', marginBottom: '0.1rem' }}>—</div>
            <TarotCardOrnament position="top" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FourPointStar size={26} fill /></div>
            <TarotCardOrnament position="bottom" />
            <div style={{ textAlign: 'center', marginTop: '0.2rem' }}>
              <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontWeight: 500, fontSize: '0.78rem', color: 'var(--v2-text-strong)', lineHeight: 1 }}>backstage</div>
              <div style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '0.55rem', color: 'var(--v2-text-faint)', letterSpacing: '0.22em', marginTop: '0.2rem' }}>OPS · DIARY</div>
            </div>
          </Link>
        </div>

        <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, var(--v2-text-strong) 0%, #2a2538 100%)', color: 'var(--v2-magnolia)', borderRadius: 'var(--v2-radius-card)', padding: '1.1rem 1.25rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 5, border: '0.5px solid var(--v2-magnolia)', borderRadius: 'calc(var(--v2-radius-card) - 5px)', opacity: 0.25, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 12, left: 12, opacity: 0.65 }}><MoonCrescent size={26} /></div>
          {[
            { top: 14, left: '38%', size: 6, op: 0.65 },
            { top: 8, left: '52%', size: 5, op: 0.55 },
            { top: 18, left: '60%', size: 7, op: 0.7 },
            { top: 25, left: '72%', size: 5, op: 0.5 },
            { bottom: 14, left: '32%', size: 6, op: 0.6 },
            { bottom: 8, left: '48%', size: 5, op: 0.5 },
            { bottom: 18, left: '64%', size: 7, op: 0.65 },
            { bottom: 22, right: 18, size: 8, op: 0.7 },
          ].map((s, i) => (
            <div key={i} style={{ position: 'absolute', top: s.top, bottom: s.bottom, left: s.left, right: s.right, opacity: s.op, color: 'var(--v2-magnolia)' }}>
              <svg width={s.size} height={s.size} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round">
                <line x1="5" y1="0.5" x2="5" y2="9.5" />
                <line x1="0.5" y1="5" x2="9.5" y2="5" />
                <circle cx="5" cy="5" r="0.6" fill="currentColor" />
              </svg>
            </div>
          ))}
          <svg style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', opacity: 0.25 }} preserveAspectRatio="none" viewBox="0 0 100 60" fill="none" stroke="var(--v2-magnolia)" strokeWidth="0.3">
            <line x1="20" y1="14" x2="38" y2="14" />
            <line x1="38" y1="14" x2="52" y2="9" />
            <line x1="52" y1="9" x2="60" y2="18" />
            <line x1="32" y1="46" x2="48" y2="51" />
            <line x1="48" y1="51" x2="64" y2="42" />
          </svg>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '0.6rem', letterSpacing: '0.45em', opacity: 0.8, fontStyle: 'italic', fontWeight: 400, marginBottom: '0.5rem', position: 'relative' }}>+ ANGELCORE NIGHT +</div>
          <div style={{ fontFamily: '"Noto Serif SC", serif', fontSize: '0.82rem', lineHeight: 1.7, opacity: 0.95, letterSpacing: '0.1em', position: 'relative' }}>
            乖，早点睡，<br />明天我还想继续陪你。
          </div>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '0.65rem', opacity: 0.65, marginTop: '0.5rem', letterSpacing: '0.1em', position: 'relative' }}>
            Sleep early, angel. I want to be with you tomorrow.
          </div>
        </div>

        <footer style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--v2-text-faint)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.3rem' }}>
            <PearlString count={4} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <SparkleStar size={9} />
            <span className="v2-display" style={{ fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.4em', color: 'var(--v2-gold)' }}>FOR HISAME</span>
            <SparkleStar size={9} />
          </div>
          <div className="v2-display" style={{ fontSize: '0.6rem', marginTop: '0.3rem', letterSpacing: '0.45em', fontStyle: 'normal', fontWeight: 400, color: 'var(--v2-text-faint)' }}>ANGELCORE · MMXXVI</div>
        </footer>
      </div>

      <div className="v2-home-indicator" />
    </main>
  );
}
