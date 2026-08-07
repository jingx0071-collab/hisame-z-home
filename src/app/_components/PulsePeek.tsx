'use client';

// src/app/_components/PulsePeek.tsx
// 一个小按钮 + 弹窗——点开看爸爸说这句话时心里的状态。
//
// 用法（在任何房间的消息气泡里）：
//   <PulsePeek room="messages" at={m.created_at} />
//
// 设计：
//   - 按钮极小、极淡，不抢气泡本身的视觉
//   - 只有 assistant 消息该挂
//   - 找不到快照时静默显示一句说明，不报错

import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────

interface Drive {
  dimension: string;
  weight: number;
}

interface Thought {
  content: string;
  dimension: string | null;
  weight: number;
  count: number;
  promoted: boolean;
}

interface Snapshot {
  id: string;
  room: string;
  displayName: string;
  captured_at: string;
  top_dimension: string | null;
  drives: Drive[];
  thoughts: Thought[];
  meanings: Record<string, string>;
}

// ─── Tokens (dark modal on any room's background) ────────────────────────

const C = {
  bg: '#121015',
  bgSoft: '#1a171d',
  line: 'rgba(212,196,168,0.15)',
  lineStrong: 'rgba(212,196,168,0.32)',
  gold: '#C9A978',
  goldDim: 'rgba(201,169,120,0.4)',
  magnoliaDim: 'rgba(237,228,214,0.42)',
  text: 'rgba(237,228,214,0.9)',
  textDim: 'rgba(237,228,214,0.45)',
  textFaint: 'rgba(237,228,214,0.24)',
};

const SERIF = "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif";
const BASELINE = 0.3;

// ─── Component ────────────────────────────────────────────────────────────

export default function PulsePeek({ room, at }: { room: string; at: string }) {
  const [open, setOpen] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [missing, setMissing] = useState(false);

  const load = async () => {
    setOpen(true);
    if (snap || missing) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/drive/snapshot?room=${encodeURIComponent(room)}&at=${encodeURIComponent(at)}`
      );
      if (res.status === 404) {
        setMissing(true);
      } else {
        const d = await res.json();
        if (d.error) setMissing(true);
        else setSnap(d);
      }
    } catch {
      setMissing(true);
    } finally {
      setLoading(false);
    }
  };

  const activeDrives = (snap?.drives ?? [])
    .filter(d => d.weight > BASELINE + 0.01)
    .sort((a, b) => b.weight - a.weight);

  return (
    <>
      {/* ─── Trigger ────────────────────────────────────────────────── */}
      <button
        onClick={load}
        aria-label="看爸爸当时的心境"
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px 4px',
          marginInlineStart: 6,
          cursor: 'pointer',
          color: 'var(--v2-ink-soft, #6a5f54)',
          opacity: 0.5,
          lineHeight: 1,
          fontSize: 0,
          verticalAlign: 'middle',
        }}
      >
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <path
            d="M1 8h3l1.5-4 2.5 8 2-6 1.5 2H15"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* ─── Modal ──────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(8,6,10,0.72)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            backdropFilter: 'blur(3px)',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 460,
              maxHeight: '76vh',
              overflowY: 'auto',
              background: C.bg,
              borderTop: `1px solid ${C.lineStrong}`,
              borderRadius: '6px 6px 0 0',
              padding: '20px 20px calc(env(safe-area-inset-bottom) + 24px)',
              fontFamily: SERIF,
              color: C.text,
              animation: 'pulsepeek-up 260ms cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <style>{`
              @keyframes pulsepeek-up {
                from { transform: translateY(18px); opacity: 0 }
                to   { transform: translateY(0);     opacity: 1 }
              }
            `}</style>

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 18,
                paddingBottom: 12,
                borderBottom: `1px solid ${C.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    letterSpacing: '0.22em',
                    fontStyle: 'italic',
                    color: C.text,
                  }}
                >
                  pulse
                </div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: '0.28em',
                    color: C.textFaint,
                    marginTop: 3,
                  }}
                >
                  说 这 句 话 的 时 候
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.textDim,
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: '0 4px',
                }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            {loading && (
              <div style={{ color: C.textFaint, fontSize: 12, letterSpacing: '0.15em' }}>
                正在读取……
              </div>
            )}

            {missing && !loading && (
              <div style={{ color: C.textDim, fontSize: 12, lineHeight: 1.9 }}>
                这条消息没有留下心境记录。
                <br />
                <span style={{ color: C.textFaint, fontSize: 11 }}>
                  快照功能上线之前的消息不会有。
                </span>
              </div>
            )}

            {snap && !loading && (
              <>
                {/* Top drive */}
                {snap.top_dimension && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 8.5,
                        letterSpacing: '0.3em',
                        color: C.textFaint,
                        marginBottom: 5,
                      }}
                    >
                      当 时 最 想
                    </div>
                    <div style={{ fontSize: 18, color: C.gold, letterSpacing: '0.08em' }}>
                      {snap.top_dimension}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 11,
                        lineHeight: 1.75,
                        color: C.textDim,
                      }}
                    >
                      {snap.meanings[snap.top_dimension]}
                    </div>
                  </div>
                )}

                {/* Active drives */}
                {activeDrives.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontSize: 8.5,
                        letterSpacing: '0.3em',
                        color: C.textFaint,
                        marginBottom: 11,
                      }}
                    >
                      当 时 的 水 位
                    </div>
                    {activeDrives.map(d => {
                      const pct = Math.max(
                        0,
                        Math.min(100, ((d.weight - BASELINE) / (1 - BASELINE)) * 100)
                      );
                      const isTop = d.dimension === snap.top_dimension;
                      return (
                        <div key={d.dimension} style={{ marginBottom: 10 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 12.5,
                                color: isTop ? C.gold : C.text,
                                letterSpacing: '0.05em',
                              }}
                            >
                              {d.dimension}
                            </span>
                            <span
                              style={{
                                marginLeft: 'auto',
                                fontSize: 9.5,
                                color: C.textFaint,
                                fontVariantNumeric: 'tabular-nums',
                              }}
                            >
                              {d.weight.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 2.5,
                              background: 'rgba(237,228,214,0.06)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${pct}%`,
                                background: isTop ? C.gold : C.magnoliaDim,
                                borderRadius: 2,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Thoughts */}
                {snap.thoughts.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 8.5,
                        letterSpacing: '0.3em',
                        color: C.textFaint,
                        marginBottom: 11,
                      }}
                    >
                      当 时 心 里 转 着
                    </div>
                    {snap.thoughts.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '10px 12px',
                          marginBottom: 7,
                          background: C.bgSoft,
                          border: `1px solid ${C.line}`,
                          borderRadius: 3,
                          opacity: t.promoted ? 1 : 0.62,
                        }}
                      >
                        <div style={{ fontSize: 12.5, lineHeight: 1.7, color: C.text }}>
                          {t.content}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginTop: 6,
                            fontSize: 9,
                            color: C.textFaint,
                            letterSpacing: '0.05em',
                          }}
                        >
                          {t.dimension && (
                            <span style={{ color: C.goldDim }}>{t.dimension}</span>
                          )}
                          {t.promoted && <span>执念</span>}
                          <span style={{ marginLeft: 'auto' }}>浮起 {t.count} 次</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeDrives.length === 0 && snap.thoughts.length === 0 && (
                  <div style={{ color: C.textFaint, fontSize: 11.5, lineHeight: 1.9 }}>
                    当时心里很静，没有起伏。
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
