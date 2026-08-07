'use client';

// src/app/pulse/page.tsx
// 脉搏 —— 六个房间的心境面板。
// 深色底 + 玉兰白进度条 + 金色高亮最强维度。

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────

interface Dimension {
  dimension: string;
  weight: number;
  meaning: string;
}

interface Obsession {
  content: string;
  dimension: string | null;
  weight: number;
  count: number;
  last_touched: string;
}

interface RoomState {
  room: string;
  displayName: string;
  drives: Dimension[];
  obsessions: Obsession[];
  topDimension: string | null;
}

// ─── Design tokens ────────────────────────────────────────────────────────

const C = {
  bg: '#0f0d12',
  bgSoft: '#171419',
  line: 'rgba(212,196,168,0.14)',
  lineStrong: 'rgba(212,196,168,0.3)',
  magnolia: '#EDE4D6',
  magnoliaDim: 'rgba(237,228,214,0.45)',
  gold: '#C9A978',
  goldDim: 'rgba(201,169,120,0.35)',
  text: 'rgba(237,228,214,0.88)',
  textDim: 'rgba(237,228,214,0.42)',
  textFaint: 'rgba(237,228,214,0.22)',
};

const SERIF = "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif";

// Room display order + roman numerals, matching the app's visual language
const ROOM_ORDER = ['messages', 'daily', 'deeptalk', 'training', 'tangent', 'shadow'];
const ROMAN: Record<string, string> = {
  messages: 'I',
  daily: 'II',
  deeptalk: 'III',
  training: 'IV',
  tangent: 'V',
  shadow: 'VI',
};

const BASELINE = 0.3;

// ─── Helpers ──────────────────────────────────────────────────────────────

function intensityLabel(w: number): string {
  if (w >= 0.85) return '压不住';
  if (w >= 0.7) return '很浓';
  if (w >= 0.55) return '明显';
  if (w >= 0.45) return '有一点';
  if (w > BASELINE + 0.02) return '淡淡的';
  return '静着';
}

function relTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  return `${days} 天前`;
}

// ─── Sub-components ───────────────────────────────────────────────────────

function DriveBar({ d, isTop }: { d: Dimension; isTop: boolean }) {
  const [hovered, setHovered] = useState(false);
  // Map 0.3..1.0 onto 0..100% so baseline reads as empty
  const pct = Math.max(0, Math.min(100, ((d.weight - BASELINE) / (1 - BASELINE)) * 100));
  const isActive = d.weight > BASELINE + 0.02;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => setHovered(h => !h)}
      style={{ marginBottom: 14, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 5 }}>
        <span
          style={{
            fontSize: 14,
            fontFamily: SERIF,
            color: isTop ? C.gold : isActive ? C.text : C.textDim,
            fontWeight: isTop ? 600 : 400,
            letterSpacing: '0.05em',
            minWidth: 62,
          }}
        >
          {d.dimension}
        </span>
        <span
          style={{
            fontSize: 10,
            color: isActive ? C.textDim : C.textFaint,
            letterSpacing: '0.08em',
          }}
        >
          {intensityLabel(d.weight)}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            fontFamily: SERIF,
            color: isTop ? C.goldDim : C.textFaint,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {d.weight.toFixed(2)}
        </span>
      </div>

      <div
        style={{
          height: 3,
          background: 'rgba(237,228,214,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: isTop
              ? `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`
              : C.magnoliaDim,
            borderRadius: 2,
            transition: 'width 600ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>

      {hovered && (
        <div
          style={{
            marginTop: 7,
            fontSize: 11,
            lineHeight: 1.65,
            color: C.textDim,
            paddingLeft: 2,
            borderLeft: `1px solid ${C.line}`,
            paddingInlineStart: 10,
          }}
        >
          {d.meaning}
        </div>
      )}
    </div>
  );
}

function ObsessionCard({ o }: { o: Obsession }) {
  // Weight drives opacity: fading obsessions visibly recede
  const opacity = Math.max(0.35, Math.min(1, o.weight / 0.6));

  return (
    <div
      style={{
        padding: '11px 13px',
        marginBottom: 8,
        background: C.bgSoft,
        border: `1px solid ${C.line}`,
        borderRadius: 3,
        opacity,
        transition: 'opacity 400ms ease',
      }}
    >
      <div
        style={{
          fontSize: 13,
          lineHeight: 1.7,
          color: C.text,
          fontFamily: SERIF,
        }}
      >
        {o.content}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginTop: 7,
          fontSize: 9.5,
          color: C.textFaint,
          letterSpacing: '0.06em',
        }}
      >
        {o.dimension && (
          <span
            style={{
              padding: '2px 7px',
              border: `1px solid ${C.lineStrong}`,
              borderRadius: 2,
              color: C.goldDim,
            }}
          >
            {o.dimension}
          </span>
        )}
        <span>浮起 {o.count} 次</span>
        <span style={{ marginLeft: 'auto' }}>{relTime(o.last_touched)}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function PulsePage() {
  const [rooms, setRooms] = useState<RoomState[]>([]);
  const [active, setActive] = useState<string>('messages');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/drive/state')
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        const sorted = (d.rooms || []).sort(
          (a: RoomState, b: RoomState) =>
            ROOM_ORDER.indexOf(a.room) - ROOM_ORDER.indexOf(b.room)
        );
        setRooms(sorted);
        setErr(null);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const current = rooms.find(r => r.room === active);

  const wrap: CSSProperties = {
    minHeight: '100%',
    background: C.bg,
    color: C.text,
    padding: '20px 18px 60px',
    fontFamily: SERIF,
  };

  return (
    <div style={wrap}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 22 }}>
        <div
          style={{
            fontSize: 22,
            letterSpacing: '0.3em',
            color: C.magnolia,
            fontStyle: 'italic',
            marginBottom: 3,
          }}
        >
          pulse
        </div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: '0.35em',
            color: C.textFaint,
          }}
        >
          爸 爸 此 刻 的 心 里
        </div>
      </div>

      {/* ─── Room tabs ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 22,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {rooms.map(r => {
          const on = r.room === active;
          return (
            <button
              key={r.room}
              onClick={() => setActive(r.room)}
              style={{
                flex: '0 0 auto',
                padding: '7px 12px',
                background: on ? 'rgba(201,169,120,0.09)' : 'transparent',
                border: `1px solid ${on ? C.lineStrong : C.line}`,
                borderRadius: 3,
                color: on ? C.gold : C.textDim,
                fontFamily: SERIF,
                fontSize: 12,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 220ms ease',
                display: 'flex',
                alignItems: 'baseline',
                gap: 6,
              }}
            >
              <span style={{ fontSize: 9, opacity: 0.6 }}>{ROMAN[r.room]}</span>
              {r.displayName}
              {r.topDimension && (
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: C.gold,
                    alignSelf: 'center',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ─── Body ───────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ color: C.textFaint, fontSize: 12, letterSpacing: '0.15em' }}>
          正在读取……
        </div>
      )}

      {err && (
        <div style={{ color: '#c96060', fontSize: 12 }}>读取失败：{err}</div>
      )}

      {!loading && !err && current && (
        <>
          {/* Top drive callout */}
          {current.topDimension ? (
            <div
              style={{
                padding: '14px 15px',
                marginBottom: 24,
                background: 'rgba(201,169,120,0.05)',
                border: `1px solid ${C.lineStrong}`,
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: '0.3em',
                  color: C.textFaint,
                  marginBottom: 6,
                }}
              >
                此 刻 最 想
              </div>
              <div style={{ fontSize: 19, color: C.gold, letterSpacing: '0.08em' }}>
                {current.topDimension}
              </div>
              <div
                style={{
                  marginTop: 7,
                  fontSize: 11.5,
                  lineHeight: 1.7,
                  color: C.textDim,
                }}
              >
                {current.drives.find(d => d.dimension === current.topDimension)?.meaning}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '14px 15px',
                marginBottom: 24,
                border: `1px solid ${C.line}`,
                borderRadius: 3,
                color: C.textFaint,
                fontSize: 12,
                letterSpacing: '0.1em',
              }}
            >
              这个房间还静着，没有起伏。
            </div>
          )}

          {/* Drive bars */}
          <div style={{ marginBottom: 30 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                color: C.textFaint,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              欲 望 面 板 · drive
            </div>
            {current.drives.map(d => (
              <DriveBar
                key={d.dimension}
                d={d}
                isTop={d.dimension === current.topDimension}
              />
            ))}
            <div
              style={{
                marginTop: 12,
                fontSize: 9.5,
                color: C.textFaint,
                lineHeight: 1.7,
              }}
            >
              点一下维度名可以看它的含义。0.30 是静息水位。
            </div>
          </div>

          {/* Obsessions */}
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: '0.3em',
                color: C.textFaint,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              念 头 池 · 执 念
            </div>
            {current.obsessions.length > 0 ? (
              current.obsessions.map((o, i) => <ObsessionCard key={i} o={o} />)
            ) : (
              <div style={{ color: C.textFaint, fontSize: 11.5, lineHeight: 1.8 }}>
                还没有执念。一个念头浮起三次才会沉进来。
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={load}
            style={{
              marginTop: 34,
              padding: '9px 20px',
              background: 'transparent',
              border: `1px solid ${C.line}`,
              borderRadius: 3,
              color: C.textDim,
              fontFamily: SERIF,
              fontSize: 11,
              letterSpacing: '0.2em',
              cursor: 'pointer',
            }}
          >
            重 新 读 取
          </button>
        </>
      )}
    </div>
  );
}
