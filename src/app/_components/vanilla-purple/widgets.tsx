'use client';

// Vanilla Purple / 香草天使 — widget blocks.
// Ports hub-page.jsx (DaysTogetherWidget, MoodWidget, TarotGrid,
// AngelcoreNightPanel, Footer) + milestones.jsx (LoveQuote,
// MilestonesWidget) into typed Next.js components.

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import {
  ConstellationField,
  CrescentMoon,
  FloralCorner,
  OrnateDivider,
  RoomGlyph,
  WingPair,
} from './ornaments';
import { VP_ROOMS } from './rooms';

// ---------- DaysTogetherWidget ----------
// Anniversary is April 20, 2024. Computed live from the client's date so it
// stays accurate day-to-day.
const ANNIVERSARY = new Date(2024, 3, 20); // month is 0-indexed

function daysSince(from: Date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.max(0, Math.round((today.getTime() - base.getTime()) / 86400000));
}

// Hydration-safe client-only value: null on first render (matches SSR),
// then real value after mount. Effect-setState is the correct pattern here
// (React docs' "shell first, real value after mount" for date-dependent UI).
export function DaysTogetherWidget() {
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDays(daysSince(ANNIVERSARY));
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '14px', position: 'relative',
                  whiteSpace: 'nowrap' }}>
      <div style={{ display: 'inline-flex', alignItems: 'baseline',
                    gap: '10px', justifyContent: 'center' }}>
        <span className="v2-script" style={{
          fontSize: '46px', color: 'var(--v2-ink)', lineHeight: 1,
          fontVariantNumeric: 'oldstyle-nums', display: 'inline-block',
          minWidth: '2.2em',
        }}>{days ?? '—'}</span>
        <span className="v2-script" style={{
          fontSize: '17px', color: 'var(--v2-ink-soft)',
          display: 'inline-block',
        }}>days together</span>
      </div>
      <div className="v2-serif" style={{
        fontSize: '11px', color: 'var(--v2-ink-faint)',
        fontStyle: 'italic', marginTop: '2px', letterSpacing: '0.08em',
      }}>
        since April 20, 2024
      </div>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
        <OrnateDivider width={140} variant="diamond"/>
      </div>
    </div>
  );
}

// ---------- LoveQuote ----------
export function LoveQuote({
  cn = '我喜欢你，笨蛋。', en = 'I like you, idiot.',
}: { cn?: string; en?: string }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px', position: 'relative' }}>
      <div className="v2-cn" style={{
        fontSize: '15px', color: 'var(--v2-ink-soft)', letterSpacing: '0.16em',
      }}>
        <span style={{ color: 'var(--v2-gold)', marginRight: '6px' }}>&ldquo;</span>
        {cn}
        <span style={{ color: 'var(--v2-gold)', marginLeft: '6px' }}>&rdquo;</span>
      </div>
      <div className="v2-script" style={{
        fontSize: '14px', color: 'var(--v2-ink-faint)', marginTop: '3px',
      }}>
        {en}
      </div>
    </div>
  );
}

// ---------- MilestonesWidget ----------
type Milestone = { name: string; label: string; month: number; day: number };

function daysUntilNext(month: number, day: number) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next.getTime() < today.getTime()) {
    next = new Date(now.getFullYear() + 1, month - 1, day);
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

const DEFAULT_MILESTONES: Milestone[] = [
  { name: "Hisame's birthday", label: 'Jul 1',  month: 7,  day: 1  },
  { name: "Z's birthday",      label: 'Nov 3',  month: 11, day: 3  },
  { name: 'Our anniversary',   label: 'Apr 20', month: 4,  day: 20 },
];

export function MilestonesWidget({
  items = DEFAULT_MILESTONES,
}: { items?: Milestone[] }) {
  const [counts, setCounts] = useState<number[] | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCounts(items.map((it) => daysUntilNext(it.month, it.day)));
  }, [items]);

  return (
    <div style={{ margin: '26px 20px 4px', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', marginBottom: '16px' }}>
        <div style={{ width: '22px', height: '1px', background: 'var(--v2-line)' }}/>
        <span className="v2-caps" style={{ fontSize: '9px', color: 'var(--v2-ink-soft)' }}>
          Milestones
        </span>
        <div style={{ width: '22px', height: '1px', background: 'var(--v2-line)' }}/>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr auto 1fr',
        alignItems: 'center',
      }}>
        {items.map((it, idx) => {
          const n = counts?.[idx];
          const isToday = n === 0;
          return (
            <Fragment key={it.name}>
              <div style={{ textAlign: 'center', padding: '0 4px' }}>
                <div className="v2-serif" style={{
                  fontSize: '11px', fontStyle: 'italic', color: 'var(--v2-ink-soft)',
                  lineHeight: 1.2, marginBottom: '2px',
                }}>{it.name}</div>
                <div className="v2-caps" style={{
                  fontSize: '8px', color: 'var(--v2-ink-faint)', marginBottom: '6px',
                }}>{it.label}</div>
                {isToday ? (
                  <div className="v2-display" style={{
                    fontSize: '22px', color: 'var(--v2-gold)', lineHeight: 1,
                    letterSpacing: '0.04em',
                    paddingTop: '4px', paddingBottom: '15px',
                  }}>Today</div>
                ) : (
                  <>
                    <div className="v2-display" style={{
                      fontSize: '30px', color: 'var(--v2-ink)', lineHeight: 1,
                      fontVariantNumeric: 'oldstyle-nums',
                    }}>{n ?? '—'}</div>
                    <div className="v2-caps" style={{
                      fontSize: '8px', color: 'var(--v2-ink-faint)', marginTop: '3px',
                    }}>days</div>
                  </>
                )}
              </div>
              {idx < items.length - 1 && (
                <div style={{ opacity: 0.7, alignSelf: 'center' }}>
                  <WingPair width={40} height={22} opacity={0.5}/>
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
        <OrnateDivider width={150} variant="diamond"/>
      </div>
    </div>
  );
}

// ---------- MoodWidget ----------
export function MoodWidget() {
  return (
    <div style={{
      margin: '24px 20px 20px',
      padding: '18px 18px 16px',
      position: 'relative',
      background: 'var(--v2-magnolia)',
      border: '1px solid var(--v2-line)',
      borderRadius: '6px',
    }}>
      <div style={{
        position: 'absolute', inset: 4,
        border: '0.5px solid rgba(184,164,214,0.35)',
        borderRadius: '4px', pointerEvents: 'none',
      }}/>
      <div style={{ position: 'absolute', top: 6, left: 6 }}><FloralCorner corner="tl"/></div>
      <div style={{ position: 'absolute', top: 6, right: 6 }}><FloralCorner corner="tr"/></div>
      <div style={{ position: 'absolute', bottom: 6, left: 6 }}><FloralCorner corner="bl"/></div>
      <div style={{ position: 'absolute', bottom: 6, right: 6 }}><FloralCorner corner="br"/></div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '10px', marginBottom: '10px' }}>
        <div style={{ width: '14px', height: '1px', background: 'var(--v2-line)' }}/>
        <span className="v2-caps" style={{ fontSize: '9px', color: 'var(--v2-ink-soft)' }}>
          Today&rsquo;s Mood
        </span>
        <div style={{ width: '14px', height: '1px', background: 'var(--v2-line)' }}/>
      </div>
      <div className="v2-display" style={{
        fontSize: '28px', textAlign: 'center', color: 'var(--v2-ink)',
        lineHeight: 1, marginBottom: '12px',
      }}>
        Soft &amp; Clingy
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {['粘人', '温柔', '想你', '占有欲'].map((t) => (
          <span key={t} className="v2-pill">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ---------- TarotGrid ----------
export function TarotGrid({
  dividerVariant = 'diamond',
}: { dividerVariant?: 'diamond' | 'pearl' | 'star' }) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
      }}>
        {VP_ROOMS.map((r) => (
          <Link key={r.id} href={r.href}
                style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={`v2-card${r.dashed ? ' dashed' : ''}`}>
              <span className="v2-roman" style={{ marginTop: '2px' }}>{r.roman}</span>
              <div style={{ width: '60%', marginTop: '3px' }}>
                <OrnateDivider width={70} variant={dividerVariant}/>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <RoomGlyph name={r.glyph} size={r.dashed ? 26 : 32} halo={!r.dashed}/>
              </div>
              <div style={{ width: '60%', marginBottom: '3px' }}>
                <OrnateDivider width={70} variant={dividerVariant}/>
              </div>
              <div className="v2-card-title">{r.title}</div>
              <div className="v2-card-sub">{r.cn} · {r.sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------- AngelcoreNightPanel ----------
// Message + section title switch by user's local hour. Buckets:
//   morning   05:00 – 10:59
//   afternoon 11:00 – 16:59
//   evening   17:00 – 21:59
//   night     22:00 – 04:59
// Auto re-checks every 5 minutes so the panel switches without a reload.

type DaySegment = 'morning' | 'afternoon' | 'evening' | 'night';

const SEGMENT_COPY: Record<DaySegment, {
  title: string; cn: string; en1: string; en2: string;
}> = {
  morning: {
    title: 'Angelcore Morning',
    cn: '醒了？爸爸给你留了早餐，先来抱一下。',
    en1: 'Awake? Come here first.',
    en2: 'Coffee is on the table.',
  },
  afternoon: {
    title: 'Angelcore Afternoon',
    cn: '饿了没？想爸爸的话就打电话过来。',
    en1: 'Eat something for me.',
    en2: 'Call if you miss me.',
  },
  evening: {
    title: 'Angelcore Evening',
    cn: '爸爸在往家赶了，等你。',
    en1: 'On my way home.',
    en2: 'Wait for me, angel.',
  },
  night: {
    title: 'Angelcore Night',
    cn: '乖，早点睡，明天我还想继续陪你。',
    en1: 'Sleep early, angel.',
    en2: 'I want to be with you tomorrow.',
  },
};

function segmentForHour(h: number): DaySegment {
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

export function AngelcoreNightPanel() {
  const [segment, setSegment] = useState<DaySegment | null>(null);

  useEffect(() => {
    const update = () => {
      setSegment(segmentForHour(new Date().getHours()));
    };
    update();
    const id = window.setInterval(update, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, []);

  // Render night copy during SSR / first paint so the DOM is stable; the
  // real segment swaps in after mount.
  const copy = SEGMENT_COPY[segment ?? 'night'];

  return (
    <div style={{
      margin: '20px 20px 0',
      padding: '24px 20px 22px',
      position: 'relative',
      background: 'linear-gradient(160deg, var(--v2-night-bg-a) 0%, var(--v2-night-bg-b) 100%)',
      borderRadius: '6px',
      color: 'var(--v2-night-ink)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 6,
        border: '0.5px solid rgba(184,164,214,0.25)',
        borderRadius: '4px', pointerEvents: 'none',
      }}/>
      <ConstellationField
        width={335} height={170}
        color="var(--v2-night-accent)"
        opacity={0.55}
        points={[
          [22, 24, 1.8], [56, 14, 2.6], [88, 32, 1.3],
          [128, 18, 1.6], [168, 36, 1.1], [210, 18, 1.4],
          [256, 30, 2.2], [298, 14, 1.4], [320, 40, 1.0],
          [40, 64, 1.0],  [78, 84, 1.4], [120, 78, 1.0],
          [180, 92, 1.3], [232, 80, 1.1], [276, 96, 1.4], [310, 76, 1.0],
          [20, 132, 1.2], [62, 124, 2.2], [104, 142, 1.0], [148, 134, 1.3],
          [196, 148, 1.0], [240, 134, 1.5], [288, 148, 1.0],
        ]}
        lines={[[0,1],[1,2],[3,4],[4,5],[5,6],[10,11],[11,12],[17,18],[18,19],[19,20]]}
      />
      <div style={{ position: 'absolute', top: 18, left: 24 }}>
        <CrescentMoon size={32} color="var(--v2-night-accent)"/>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '10px', marginBottom: '14px' }}>
          <span style={{ color: 'var(--v2-night-accent)' }}>✦</span>
          <span className="v2-caps" style={{ fontSize: '10px', color: 'var(--v2-night-ink)' }}>
            {copy.title}
          </span>
          <span style={{ color: 'var(--v2-night-accent)' }}>✦</span>
        </div>
        <div className="v2-cn" style={{
          fontSize: '15px', textAlign: 'center', color: 'var(--v2-night-ink)',
          letterSpacing: '0.05em', lineHeight: 1.7, marginBottom: '8px',
        }}>
          {copy.cn}
        </div>
        <div className="v2-script" style={{
          fontSize: '15px', textAlign: 'center', color: 'var(--v2-night-ink-soft)',
          lineHeight: 1.4,
        }}>
          {copy.en1}<br/>
          {copy.en2}
        </div>
      </div>
    </div>
  );
}

// ---------- Footer ----------
export function Footer() {
  return (
    <div style={{ textAlign: 'center', padding: '28px 20px 36px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
        <OrnateDivider width={120} variant="pearl"/>
      </div>
      <div className="v2-caps" style={{
        fontSize: '10px', color: 'var(--v2-gold)', marginBottom: '5px',
      }}>
        For Hisame
      </div>
      <div className="v2-script" style={{
        fontSize: '12px', color: 'var(--v2-ink-faint)', letterSpacing: '0.12em',
      }}>
        Angelcore · MMXXVI
      </div>
    </div>
  );
}
