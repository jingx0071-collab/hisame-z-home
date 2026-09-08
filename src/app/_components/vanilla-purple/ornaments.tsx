'use client';

// Vanilla Purple / 香草天使 — SVG ornament primitives.
// Ported from the design-canvas ornaments.jsx; every function typed and
// exported as an ES module. All linework is stroke-only, no filled blobs.
// Stroke conventions:
//   primary linework  : 1.0–1.2 px @ var(--v2-line)/var(--v2-gold)
//   secondary detail  : 0.55–0.7 px @ var(--v2-ink-faint)
//   accent cabochons  : 1px stroke, no fill OR fill=var(--v2-accent)

import type { ReactNode } from 'react';

const inkLine  = 'var(--v2-line)';
const inkFaint = 'var(--v2-ink-faint)';
const gold     = 'var(--v2-gold)';
const accent   = 'var(--v2-accent)';
const paper    = 'var(--v2-paper)';

// ---------- HaloArcs ----------
export function HaloArcs({ width = 130, color = gold }: { width?: number; color?: string }) {
  const h = width * 0.42;
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} fill="none" aria-hidden="true" className="vp-halo">
      <defs>
        <linearGradient id="vp-halo-grad" x1="0" x2="1">
          <stop offset="0"   stopColor={color} stopOpacity="0"/>
          <stop offset="0.5" stopColor={color} stopOpacity="1"/>
          <stop offset="1"   stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 6, 12].map((dy, i) => {
        const r = (width / 2) - 6 - dy * 1.6;
        const cy = h - 4 + dy * 0.6;
        const sw = 0.7 + i * 0.15;
        return (
          <path key={i}
            d={`M ${width/2 - r} ${cy} A ${r} ${r * 0.85} 0 0 1 ${width/2 + r} ${cy}`}
            stroke="url(#vp-halo-grad)" strokeWidth={sw} strokeLinecap="round"/>
        );
      })}
      <line x1={width/2} y1={2} x2={width/2} y2={10} stroke={color} strokeWidth="0.6"/>
      <circle cx={width/2} cy={1.5} r="1.2" fill={color}/>
    </svg>
  );
}

// ---------- OrnateOvalFrame ----------
type OvalProps = {
  width?: number;
  height?: number;
  crown?: boolean;
  tail?: boolean;
  children?: ReactNode;
};
export function OrnateOvalFrame({
  width = 260, height = 320, crown = true, tail = true, children,
}: OvalProps) {
  const w = width, h = height;
  const cx = w / 2, cy = h / 2 + 4;
  const rx = w * 0.36, ry = h * 0.39;

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}
           style={{ position: 'absolute', inset: 0 }}
           fill="none" aria-hidden="true">
        {crown && (() => {
          const topY = cy - ry;
          return (
            <g stroke={gold} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d={`M ${cx-20} ${topY+6}
                        C ${cx-18} ${topY-10}, ${cx-8} ${topY-18}, ${cx} ${topY-22}
                        C ${cx+8} ${topY-18}, ${cx+18} ${topY-10}, ${cx+20} ${topY+6}`}
                    strokeWidth="1.1"/>
              <line x1={cx} y1={topY-22} x2={cx} y2={topY-30} strokeWidth="0.7"/>
              <circle cx={cx} cy={topY-31} r="1.1" fill={gold} stroke="none"/>
              <path d={`M ${cx-2} ${topY-20} C ${cx-7} ${topY-17}, ${cx-9} ${topY-13}, ${cx-7} ${topY-9}`}
                    strokeWidth="0.6"/>
              <path d={`M ${cx+2} ${topY-20} C ${cx+7} ${topY-17}, ${cx+9} ${topY-13}, ${cx+7} ${topY-9}`}
                    strokeWidth="0.6"/>
              <circle cx={cx} cy={topY-12} r="3.6" stroke={gold} strokeWidth="0.9" fill={accent}/>
              <circle cx={cx-0.9} cy={topY-12.9} r="1.1" fill={paper} stroke="none"/>
              <path d={`M ${cx-20} ${topY+6}
                        C ${cx-32} ${topY+4}, ${cx-42} ${topY-2}, ${cx-50} ${topY+4}
                        C ${cx-54} ${topY+10}, ${cx-50} ${topY+16}, ${cx-44} ${topY+14}
                        C ${cx-40} ${topY+12}, ${cx-40} ${topY+8}, ${cx-44} ${topY+8}`}
                    strokeWidth="0.85"/>
              <path d={`M ${cx+20} ${topY+6}
                        C ${cx+32} ${topY+4}, ${cx+42} ${topY-2}, ${cx+50} ${topY+4}
                        C ${cx+54} ${topY+10}, ${cx+50} ${topY+16}, ${cx+44} ${topY+14}
                        C ${cx+40} ${topY+12}, ${cx+40} ${topY+8}, ${cx+44} ${topY+8}`}
                    strokeWidth="0.85"/>
              <circle cx={cx-50} cy={topY+4} r="1.3" stroke={gold} strokeWidth="0.6" fill={paper}/>
              <circle cx={cx+50} cy={topY+4} r="1.3" stroke={gold} strokeWidth="0.6" fill={paper}/>
              {[-12, -6, 0, 6, 12].map((dx, i) => (
                <circle key={i} cx={cx+dx} cy={topY+5.5} r="0.6" fill={gold} stroke="none" opacity="0.7"/>
              ))}
            </g>
          );
        })()}

        {/* --- oval double-stroke --- */}
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
                 stroke={gold} strokeWidth="1.1"/>
        <ellipse cx={cx} cy={cy} rx={rx - 5} ry={ry - 5}
                 stroke={inkLine} strokeWidth="0.55" opacity="0.7"/>

        {/* --- side scroll flourishes --- */}
        <g stroke={gold} strokeWidth="0.85" strokeLinecap="round" fill="none">
          <path d={`M ${cx-rx-1} ${cy-ry*0.15}
                    C ${cx-rx-10} ${cy-ry*0.05}, ${cx-rx-14} ${cy+ry*0.05}, ${cx-rx-10} ${cy+ry*0.18}
                    C ${cx-rx-6} ${cy+ry*0.28}, ${cx-rx-2} ${cy+ry*0.24}, ${cx-rx+1} ${cy+ry*0.18}`}/>
          <path d={`M ${cx-rx-9} ${cy+ry*0.04}
                    C ${cx-rx-16} ${cy-ry*0.02}, ${cx-rx-18} ${cy-ry*0.15}, ${cx-rx-12} ${cy-ry*0.22}`} strokeWidth="0.6"/>
          <path d={`M ${cx+rx+1} ${cy-ry*0.15}
                    C ${cx+rx+10} ${cy-ry*0.05}, ${cx+rx+14} ${cy+ry*0.05}, ${cx+rx+10} ${cy+ry*0.18}
                    C ${cx+rx+6} ${cy+ry*0.28}, ${cx+rx+2} ${cy+ry*0.24}, ${cx+rx-1} ${cy+ry*0.18}`}/>
          <path d={`M ${cx+rx+9} ${cy+ry*0.04}
                    C ${cx+rx+16} ${cy-ry*0.02}, ${cx+rx+18} ${cy-ry*0.15}, ${cx+rx+12} ${cy-ry*0.22}`} strokeWidth="0.6"/>
        </g>

        {/* --- bottom cartouche / tail --- */}
        {tail && (
          <g stroke={gold} strokeWidth="1" strokeLinecap="round" fill="none">
            <path d={`M ${cx-18} ${cy+ry-2}
                      C ${cx-14} ${cy+ry+10}, ${cx-6} ${cy+ry+16}, ${cx} ${cy+ry+18}
                      C ${cx+6} ${cy+ry+16}, ${cx+14} ${cy+ry+10}, ${cx+18} ${cy+ry-2}`} />
            <path d={`M ${cx-6} ${cy+ry+12} L ${cx} ${cy+ry+22} L ${cx+6} ${cy+ry+12}`} strokeWidth="0.7"/>
            <circle cx={cx} cy={cy+ry+18} r="1.6" fill={gold}/>
          </g>
        )}
      </svg>

      <div style={{
        position: 'absolute',
        left: `${(cx - rx + 14)}px`,
        right: `${w - (cx + rx - 14)}px`,
        top: `${cy - ry + 14}px`,
        height: `${(ry - 14) * 2}px`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        {children}
      </div>
    </div>
  );
}

// ---------- RosaryChain ----------
export function RosaryChain({
  length = 110, side = 'left', color = gold, beads = 7,
}: { length?: number; side?: 'left' | 'right'; color?: string; beads?: number }) {
  const w = 18;
  const h = length;
  const step = h / (beads + 1);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true"
         className={`vp-rosary vp-rosary--${side}`}
         style={{ pointerEvents: 'none' }}>
      <path d={`M ${w/2} 0 Q ${side === 'left' ? w/2 - 4 : w/2 + 4} ${h/2} ${w/2} ${h}`}
            stroke={color} strokeWidth="0.55" opacity="0.7"/>
      {Array.from({ length: beads }).map((_, i) => {
        const y = step * (i + 1);
        const big = i % 2 === 0;
        const r = big ? 2.6 : 1.5;
        const t = (i + 1) / (beads + 1);
        const sway = Math.sin(t * Math.PI) * (side === 'left' ? -3 : 3);
        const cx = w / 2 + sway;
        return (
          <g key={i}>
            <circle cx={cx} cy={y} r={r} stroke={color} strokeWidth="0.7" fill={paper}/>
            <circle cx={cx - r*0.35} cy={y - r*0.35} r={r*0.28}
                    fill={color} opacity="0.45"/>
          </g>
        );
      })}
      <circle cx={w/2} cy="1" r="1.2" fill={color} opacity="0.7"/>
    </svg>
  );
}

// ---------- CrossPendant ----------
export function CrossPendant({ size = 38, color = gold }: { size?: number; color?: string }) {
  const s = size;
  return (
    <svg width={s} height={s * 1.6} viewBox={`0 0 ${s} ${s*1.6}`} fill="none" aria-hidden="true">
      <line x1={s/2} y1="0" x2={s/2} y2="10" stroke={color} strokeWidth="0.5"/>
      <circle cx={s/2} cy="3" r="1.2" fill={color} opacity="0.7"/>
      <line x1={s/2} y1="10" x2={s/2} y2={s*1.5 - 6} stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      <line x1={s/2 - s*0.28} y1={s*0.55} x2={s/2 + s*0.28} y2={s*0.55} stroke={color} strokeWidth="1.1" strokeLinecap="round"/>
      {[
        [s/2, 10],
        [s/2, s*1.5 - 6],
        [s/2 - s*0.28, s*0.55],
        [s/2 + s*0.28, s*0.55],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.6" stroke={color} strokeWidth="0.6" fill={paper}/>
        </g>
      ))}
      <circle cx={s/2} cy={s*0.55} r="4.5" stroke={color} strokeWidth="0.9" fill={paper}/>
      <circle cx={s/2} cy={s*0.55} r="2.2" stroke={color} strokeWidth="0.5" fill={accent} opacity="0.8"/>
      <line x1={s/2} y1={s*1.5 - 6} x2={s/2} y2={s*1.5} stroke={color} strokeWidth="0.5"/>
      <ellipse cx={s/2} cy={s*1.55} rx="2.4" ry="3" stroke={color} strokeWidth="0.7" fill={paper}/>
      <circle cx={s/2 - 0.6} cy={s*1.53} r="0.5" fill={color} opacity="0.5"/>
    </svg>
  );
}

// ---------- WingPair ----------
export function WingPair({
  width = 240, height = 80, color = inkFaint, opacity = 0.55,
}: { width?: number; height?: number; color?: string; opacity?: number }) {
  const w = width, h = height;
  const cx = w / 2;
  const half = (mirror: boolean) => {
    const s = mirror ? -1 : 1;
    const ox = cx + s * 18;
    const oy = h * 0.32;
    return [
      `M ${ox} ${oy}
       C ${ox + s*30} ${oy - 14}, ${ox + s*70} ${oy - 18}, ${ox + s*110} ${oy + 6}`,
      `M ${ox + s*8} ${oy + 4}
       C ${ox + s*30} ${oy + 6}, ${ox + s*60} ${oy + 12}, ${ox + s*100} ${oy + 24}`,
      `M ${ox + s*10} ${oy + 14}
       C ${ox + s*30} ${oy + 18}, ${ox + s*55} ${oy + 28}, ${ox + s*92} ${oy + 40}`,
      `M ${ox + s*12} ${oy + 24}
       C ${ox + s*28} ${oy + 30}, ${ox + s*48} ${oy + 40}, ${ox + s*80} ${oy + 52}`,
      `M ${ox + s*4} ${oy + 6} C ${ox + s*16} ${oy + 12}, ${ox + s*28} ${oy + 18}, ${ox + s*44} ${oy + 24}`,
      `M ${ox + s*4} ${oy + 16} C ${ox + s*14} ${oy + 22}, ${ox + s*26} ${oy + 30}, ${ox + s*40} ${oy + 38}`,
    ];
  };
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
         aria-hidden="true" style={{ pointerEvents: 'none', opacity }}>
      {[...half(false), ...half(true)].map((d, i) => (
        <path key={i} d={d} stroke={color}
              strokeWidth={i % 6 === 0 ? 0.9 : 0.55}
              strokeLinecap="round"/>
      ))}
    </svg>
  );
}

// ---------- CornerOrnaments ----------
// Absolutely-positioned quartet of FloralCorners, meant to be dropped inside
// any card / block whose parent is position:relative.
export function CornerOrnaments({
  size = 14, color = inkLine, inset = 6,
}: { size?: number; color?: string; inset?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      className="vp-corner-ornaments"
    >
      <div style={{ position: 'absolute', top: inset, left: inset }}>
        <FloralCorner size={size} color={color} corner="tl"/>
      </div>
      <div style={{ position: 'absolute', top: inset, right: inset }}>
        <FloralCorner size={size} color={color} corner="tr"/>
      </div>
      <div style={{ position: 'absolute', bottom: inset, left: inset }}>
        <FloralCorner size={size} color={color} corner="bl"/>
      </div>
      <div style={{ position: 'absolute', bottom: inset, right: inset }}>
        <FloralCorner size={size} color={color} corner="br"/>
      </div>
    </div>
  );
}

// ---------- FloralCorner ----------
export function FloralCorner({
  size = 22, color = inkLine, corner = 'tl',
}: { size?: number; color?: string; corner?: 'tl' | 'tr' | 'br' | 'bl' }) {
  const s = size;
  const rotations: Record<string, number> = { tl: 0, tr: 90, br: 180, bl: 270 };
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none"
         style={{ transform: `rotate(${rotations[corner]}deg)`, transformOrigin: 'center' }}
         aria-hidden="true">
      <g stroke={color} strokeWidth="0.7" fill="none" strokeLinecap="round">
        <path d={`M 2 ${s*0.7} C 2 ${s*0.4}, ${s*0.4} 2, ${s*0.7} 2`}/>
        <path d={`M 2 ${s*0.55} C ${s*0.15} ${s*0.55}, ${s*0.25} ${s*0.45}, ${s*0.3} ${s*0.3}
                  C ${s*0.35} ${s*0.18}, ${s*0.45} ${s*0.12}, ${s*0.55} 2`} strokeWidth="0.5"/>
        <circle cx="2" cy="2" r="0.8" fill={color}/>
      </g>
    </svg>
  );
}

// ---------- OrnateDivider ----------
export function OrnateDivider({
  width = 220, color = inkLine, variant = 'diamond',
}: { width?: number; color?: string; variant?: 'diamond' | 'pearl' | 'star' }) {
  const w = width, h = 14;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" aria-hidden="true">
      <line x1="0" y1={h/2} x2={w/2 - 12} y2={h/2} stroke={color} strokeWidth="0.6"/>
      <line x1={w/2 + 12} y1={h/2} x2={w} y2={h/2} stroke={color} strokeWidth="0.6"/>
      {variant === 'diamond' && (
        <g stroke={color} strokeWidth="0.7" fill="none">
          <path d={`M ${w/2 - 8} ${h/2} L ${w/2} ${h/2 - 4} L ${w/2 + 8} ${h/2} L ${w/2} ${h/2 + 4} Z`}/>
          <circle cx={w/2} cy={h/2} r="1.2" fill={color}/>
        </g>
      )}
      {variant === 'pearl' && (
        <g stroke={color} strokeWidth="0.6" fill="none">
          <circle cx={w/2 - 6} cy={h/2} r="1.5"/>
          <circle cx={w/2}     cy={h/2} r="2.2"/>
          <circle cx={w/2 + 6} cy={h/2} r="1.5"/>
        </g>
      )}
      {variant === 'star' && (
        <g stroke={color} strokeWidth="0.7" fill={color}>
          <path d={`M ${w/2} ${h/2 - 5} L ${w/2 + 1.5} ${h/2 - 1.5} L ${w/2 + 5} ${h/2}
                    L ${w/2 + 1.5} ${h/2 + 1.5} L ${w/2} ${h/2 + 5}
                    L ${w/2 - 1.5} ${h/2 + 1.5} L ${w/2 - 5} ${h/2}
                    L ${w/2 - 1.5} ${h/2 - 1.5} Z`}/>
        </g>
      )}
    </svg>
  );
}

// ---------- SparkleDust ----------
type SparklePoint = [number, number, number?, number?];
export function SparkleDust({
  points = [], color = gold, opacity = 0.85,
}: { points?: SparklePoint[]; color?: string; opacity?: number }) {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%',
                  pointerEvents: 'none' }} fill="none" aria-hidden="true">
      {points.map(([x, y, sz = 4, op = 1], i) => (
        <g key={i} transform={`translate(${x} ${y})`} opacity={op * opacity}
           className="vp-sparkle" style={{ animationDelay: `${(i * 0.7) % 4}s` }}>
          <path d={`M 0 -${sz} L ${sz*0.18} -${sz*0.18} L ${sz} 0
                    L ${sz*0.18} ${sz*0.18} L 0 ${sz}
                    L -${sz*0.18} ${sz*0.18} L -${sz} 0 L -${sz*0.18} -${sz*0.18} Z`}
                fill={color}/>
        </g>
      ))}
    </svg>
  );
}

// ---------- CrescentMoon ----------
export function CrescentMoon({
  size = 26, color = gold, fill = 'none',
}: { size?: number; color?: string; fill?: string }) {
  const s = size, r = s * 0.42;
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true">
      <defs>
        <mask id="vp-m-cres">
          <rect width={s} height={s} fill="white"/>
          <circle cx={s*0.62} cy={s*0.42} r={r * 0.92} fill="black"/>
        </mask>
      </defs>
      <circle cx={s*0.5} cy={s*0.5} r={r}
              fill={fill} stroke={color} strokeWidth="0.9"
              mask="url(#vp-m-cres)"/>
    </svg>
  );
}

// ---------- ConstellationField ----------
type StarPoint = [number, number, number?];
type StarLine = [number, number];
export function ConstellationField({
  points = [], lines = [], width = 200, height = 80,
  color = gold, opacity = 0.85,
}: {
  points?: StarPoint[]; lines?: StarLine[];
  width?: number; height?: number; color?: string; opacity?: number;
}) {
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
         fill="none" aria-hidden="true"
         style={{ pointerEvents: 'none', opacity }}>
      {lines.map(([i, j], k) => {
        const a = points[i], b = points[j];
        if (!a || !b) return null;
        return <line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
                     stroke={color} strokeWidth="0.4" opacity="0.6"/>;
      })}
      {points.map(([x, y, sz = 1.5], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={sz * 0.5} fill={color}/>
          {sz > 2 && (
            <g stroke={color} strokeWidth="0.5">
              <line x1={x - sz*1.4} y1={y} x2={x + sz*1.4} y2={y}/>
              <line x1={x} y1={y - sz*1.4} x2={x} y2={y + sz*1.4}/>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

// ---------- RoomGlyph ----------
type GlyphName =
  | 'box' | 'calendar' | 'health' | 'study' | 'seminar' | 'call'
  | 'nearby' | 'navi' | 'shopping' | 'eat' | 'music' | 'ops';

export function RoomGlyph({
  name, size = 30, color = 'var(--v2-ink-soft)', halo = true,
}: { name: string; size?: number; color?: string; halo?: boolean }) {
  const s = size;
  const sw = 0.95;
  const commonProps = {
    stroke: color,
    strokeWidth: sw,
    fill: 'none' as const,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const glyphs: Record<GlyphName, ReactNode> = {
    box: (
      <g {...commonProps}>
        <rect x="6" y="9" width="16" height="13" rx="1"/>
        <line x1="6" y1="13" x2="22" y2="13"/>
        <path d="M 12 9 C 12 6, 16 6, 16 9"/>
      </g>
    ),
    calendar: (
      <g {...commonProps}>
        <rect x="6" y="8" width="16" height="14" rx="1"/>
        <line x1="6" y1="12" x2="22" y2="12"/>
        <line x1="10" y1="6" x2="10" y2="10"/>
        <line x1="18" y1="6" x2="18" y2="10"/>
        <circle cx="14" cy="17" r="1.3"/>
      </g>
    ),
    health: (
      <g {...commonProps}>
        <path d="M 14 8 C 11 5, 6 7, 7 12 C 8 17, 14 21, 14 21 C 14 21, 20 17, 21 12 C 22 7, 17 5, 14 8 Z"/>
        <path d="M 14 11 L 14 17 M 11 14 L 17 14" strokeWidth="0.8"/>
      </g>
    ),
    study: (
      <g {...commonProps}>
        <path d="M 6 9 C 9 8, 12 8, 14 10 C 16 8, 19 8, 22 9 L 22 20 C 19 19, 16 19, 14 21 C 12 19, 9 19, 6 20 Z"/>
        <line x1="14" y1="10" x2="14" y2="21"/>
      </g>
    ),
    seminar: (
      <g {...commonProps}>
        <path d="M 4 12 L 14 8 L 24 12 L 14 16 Z"/>
        <path d="M 9 14 L 9 18 C 9 19.5, 18 19.5, 18 18 L 18 14"/>
        <line x1="24" y1="12" x2="24" y2="17"/>
      </g>
    ),
    call: (
      <g {...commonProps}>
        <path d="M 9 6 C 7 6, 6 8, 7 11 C 8 15, 12 19, 16 21 C 19 22, 21 21, 22 19 L 19 16 L 17 17 C 15 16, 13 14, 12 12 L 13 10 Z"/>
      </g>
    ),
    nearby: (
      <g {...commonProps}>
        <path d="M 14 5 C 9 5, 6 9, 6 13 C 6 18, 14 23, 14 23 C 14 23, 22 18, 22 13 C 22 9, 19 5, 14 5 Z"/>
        <circle cx="14" cy="12" r="2.5"/>
      </g>
    ),
    navi: (
      <g {...commonProps}>
        <path d="M 14 5 L 22 22 L 14 18 L 6 22 Z"/>
      </g>
    ),
    shopping: (
      <g {...commonProps}>
        <path d="M 7 9 L 9 9 L 11 19 L 21 19 L 23 11 L 11 11"/>
        <circle cx="13" cy="22" r="1.2"/>
        <circle cx="19" cy="22" r="1.2"/>
      </g>
    ),
    eat: (
      <g {...commonProps}>
        <path d="M 9 6 L 9 14 M 7 6 L 7 10 C 7 12, 9 12, 9 10 M 11 6 L 11 10 C 11 12, 9 12, 9 10"/>
        <path d="M 9 14 L 9 22"/>
        <path d="M 17 6 C 14 7, 13 11, 14 14 L 17 14 L 17 6 Z"/>
        <line x1="17" y1="14" x2="17" y2="22"/>
      </g>
    ),
    music: (
      <g {...commonProps}>
        <circle cx="14" cy="14" r="8"/>
        <circle cx="14" cy="14" r="2"/>
        <path d="M 14 6 L 14 9 M 14 19 L 14 22 M 6 14 L 9 14 M 19 14 L 22 14"/>
      </g>
    ),
    ops: (
      <g {...commonProps}>
        <circle cx="14" cy="14" r="3"/>
        <path d="M 14 6 L 14 9 M 14 19 L 14 22 M 6 14 L 9 14 M 19 14 L 22 14
                 M 8.5 8.5 L 10.5 10.5 M 17.5 17.5 L 19.5 19.5
                 M 8.5 19.5 L 10.5 17.5 M 17.5 10.5 L 19.5 8.5"/>
      </g>
    ),
  };

  const isKnown = (v: string): v is GlyphName =>
    v === 'box' || v === 'calendar' || v === 'health' || v === 'study' ||
    v === 'seminar' || v === 'call' || v === 'nearby' || v === 'navi' ||
    v === 'shopping' || v === 'eat' || v === 'music' || v === 'ops';

  const glyph = isKnown(name) ? glyphs[name] : glyphs.box;

  return (
    <svg width={s} height={s} viewBox="0 0 28 28" fill="none" aria-hidden="true">
      {halo && (
        <g stroke="var(--v2-line)" strokeWidth="0.5" opacity="0.55" fill="none">
          <circle cx="14" cy="14" r="11"/>
          <circle cx="14" cy="2" r="0.8" fill="var(--v2-gold)" stroke="none"/>
        </g>
      )}
      {glyph}
    </svg>
  );
}
