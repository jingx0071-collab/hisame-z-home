'use client';
import { useState, useEffect } from 'react';

function getMoonPhase(date: Date): number {
  // Jan 6 2000 18:14 UTC = known new moon reference
  const ref = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const synodic = 29.530588853;
  const days = (date.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24);
  return (((days % synodic) + synodic) % synodic) / synodic;
}

export default function MoonPhase({ size = 120 }: { size?: number }) {
  const [phase, setPhase] = useState(0.5);

  useEffect(() => {
    setPhase(getMoonPhase(new Date()));
  }, []);

  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const terminatorRx = Math.abs(r * Math.cos(phase * 2 * Math.PI));
  const waxing = phase < 0.5;
  const sweep1 = waxing ? 1 : 0;
  const illuminated = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
  const sweep2 = illuminated > 0.5 ? sweep1 : 1 - sweep1;

  const litPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${sweep1} ${cx} ${cy + r} A ${terminatorRx} ${r} 0 0 ${sweep2} ${cx} ${cy - r} Z`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="v2-moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="40%" stopColor="var(--v2-moon)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--v2-moon)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r + 8} fill="url(#v2-moon-glow)" />
      <circle cx={cx} cy={cy} r={r} fill="var(--v2-bg-soft)" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <path d={litPath} fill="var(--v2-moon)" />
    </svg>
  );
}