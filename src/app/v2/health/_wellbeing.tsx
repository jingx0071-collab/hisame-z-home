'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type Metric = { label: string; value: string };

type Dimension = {
  id: string;
  en: string;
  cn: string;
  confidence: number;
  metrics: Metric[];
  note: string;
};

type ApiDimension = {
  id: string;
  dim_id: string;
  position: number;
  en: string;
  cn: string;
  confidence: number;
  metrics: Metric[];
  note: string;
};

const STORAGE_KEY = 'v2-health-dimensions';
const API_URL = '/api/v2/health';

function fromApi(d: ApiDimension): Dimension {
  return {
    id: d.dim_id,
    en: d.en,
    cn: d.cn,
    confidence: d.confidence,
    metrics: d.metrics || [],
    note: d.note,
  };
}

export default function WellbeingView() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editingDim, setEditingDim] = useState<Dimension | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setDimensions(parsed);
      }
    } catch {}
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data.dimensions)) {
        const mapped = data.dimensions.map(fromApi);
        setDimensions(mapped);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped)); } catch {}
      }
    } catch (e) {
      console.error('fetch health failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDim = async (updates: { confidence: number; metrics: Metric[]; note: string }) => {
    if (!editingDim) return;
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dim_id: editingDim.id, ...updates }),
      });
      if (!res.ok) throw new Error('PUT ' + res.status);
      const json = await res.json();
      if (json.dimension) {
        const updated = fromApi(json.dimension);
        const newDims = dimensions.map(d => d.id === updated.id ? updated : d);
        setDimensions(newDims);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newDims)); } catch {}
      }
      setEditingDim(null);
    } catch (e) {
      console.error('save dim failed:', e);
      alert('保存失败');
    }
  };

  const dim = dimensions[active];

  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      {/* PageArchway 已由 outer page.tsx 渲染 */}

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.82rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '1.5rem', lineHeight: 1.6,
        }}>
          how am I, today?
        </div>

        {loading && dimensions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem 0',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-faint)',
            letterSpacing: '0.2em',
          }}>· loading ·</div>
        ) : dimensions.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '2rem 0',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-faint)',
          }}>no dimensions yet</div>
        ) : (
          <>
            {/* Tab row */}
            <div style={{
              display: 'grid', gridTemplateColumns: `repeat(${dimensions.length}, 1fr)`,
              gap: '3px', marginBottom: '1.2rem',
            }}>
              {dimensions.map((d, i) => (
                <button
                  key={d.id}
                  onClick={() => setActive(i)}
                  style={{
                    padding: '0.5rem 0.2rem 0.45rem',
                    background: i === active ? 'rgba(212, 185, 138, 0.12)' : 'transparent',
                    border: 'none',
                    borderTop: i === active ? '1px solid var(--v2-gold)' : '0.5px solid var(--v2-gold-cool)',
                    borderBottom: i === active ? '2px solid var(--v2-gold)' : '0.5px solid rgba(168, 153, 104, 0.3)',
                    color: i === active ? 'var(--v2-text-strong)' : 'var(--v2-text-mid)',
                    fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
                    fontSize: '0.72rem', fontWeight: i === active ? 600 : 400,
                    cursor: 'pointer', transition: 'all 0.2s',
                    letterSpacing: '0.05em',
                  }}
                >
                  {d.en}
                </button>
              ))}
            </div>

            {dim && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setEditingDim(dim)}
                  style={{
                    position: 'absolute', top: '0.6rem', right: '0.6rem',
                    background: 'transparent', border: 'none', cursor: 'pointer',
                    color: 'var(--v2-gold-cool, #b8a064)',
                    fontFamily: 'var(--v2-font-display, "Cormorant Garamond", serif)',
                    fontStyle: 'italic',
                    fontSize: '0.7rem', letterSpacing: '0.1em',
                    padding: '0.2rem 0.5rem',
                    zIndex: 5,
                  }}
                  aria-label="edit dimension"
                >✎ edit</button>
                <DimensionCard dim={dim} />
              </div>
            )}

            <SectionDivider />

            <SectionTitle code="·" label="WEEKLY SUMMARY" cn="本 周 概 览" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', marginBottom: '1rem' }}>
              {dimensions.map((d) => <MiniSummary key={d.id} dim={d} />)}
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={footerInfoStyle}>care · HISAME · MMXXVI</div>
        </div>
      </div>

      {editingDim && (
        <DimensionEditModal
          dim={editingDim}
          onSave={handleSaveDim}
          onClose={() => setEditingDim(null)}
        />
      )}
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

// ─── Dimension Card ───

function DimensionCard({ dim }: { dim: Dimension }) {
  return (
    <div style={{
      padding: '1.1rem 1rem 1rem',
      border: '1px solid var(--v2-gold-cool)',
      borderTop: '0.5px solid var(--v2-gold)',
      borderRadius: '2px',
      background: 'var(--v2-bg-soft)',
      marginBottom: '1.5rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '0.9rem' }}>
        <div style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '1.4rem', fontWeight: 600,
          color: 'var(--v2-text-strong)', letterSpacing: '0.04em',
          lineHeight: 1.1, marginBottom: '0.2rem',
        }}>{dim.en}</div>
        <div style={{
          fontSize: '0.58rem', letterSpacing: '0.35em',
          color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        }}>{dim.cn}</div>
      </div>

      <ConfidenceDots level={dim.confidence} />

      <div style={{ borderTop: '1px dashed var(--v2-gold-cool)', opacity: 0.35, margin: '0.9rem 0 0.5rem' }} />

      {dim.metrics.map((m, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '0.4rem 0.1rem',
          borderBottom: i < dim.metrics.length - 1 ? '0.5px dashed rgba(168, 153, 104, 0.2)' : 'none',
        }}>
          <span style={{
            fontSize: '0.62rem', letterSpacing: '0.18em',
            color: 'var(--v2-gold-cool)', fontFamily: 'var(--v2-font-display)',
            fontStyle: 'italic', textTransform: 'uppercase',
          }}>{m.label}</span>
          <span style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-mid)',
          }}>{m.value}</span>
        </div>
      ))}

      <div style={{ borderTop: '1px dashed var(--v2-gold-cool)', opacity: 0.35, margin: '0.7rem 0 0.6rem' }} />

      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.78rem', color: 'var(--v2-text-mid)',
        lineHeight: 1.6, letterSpacing: '0.02em',
        textAlign: 'center', padding: '0 0.4rem',
      }}>—— {dim.note}</div>
    </div>
  );
}

function ConfidenceDots({ level }: { level: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
      <span style={{
        fontSize: '0.55rem', letterSpacing: '0.22em',
        color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', textTransform: 'uppercase',
      }}>confidence</span>
      <div style={{ display: 'flex', gap: '5px' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: i < level ? 'var(--v2-gold)' : 'transparent',
            border: '0.8px solid var(--v2-gold-cool)',
            boxShadow: i < level ? '0 0 4px rgba(212, 185, 138, 0.5)' : 'none',
          }} />
        ))}
      </div>
      <span style={{
        fontSize: '0.62rem', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', color: 'var(--v2-gold)',
        letterSpacing: '0.04em',
      }}>{level} / 5</span>
    </div>
  );
}

function MiniSummary({ dim }: { dim: Dimension }) {
  return (
    <div style={{
      padding: '0.65rem 0.55rem 0.7rem',
      border: '0.5px solid var(--v2-gold-cool)',
      borderRadius: '1px', background: 'var(--v2-bg-soft)',
      opacity: 0.92,
    }}>
      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.85rem', fontWeight: 500,
        color: 'var(--v2-text-strong)', lineHeight: 1.1,
      }}>{dim.en}</div>
      <div style={{
        fontSize: '0.5rem', letterSpacing: '0.22em',
        color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        marginTop: '2px', marginBottom: '0.45rem',
      }}>{dim.cn}</div>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: i < dim.confidence ? 'var(--v2-gold)' : 'transparent',
            border: '0.5px solid var(--v2-gold-cool)',
          }} />
        ))}
        <span style={{
          fontSize: '0.55rem', color: 'var(--v2-gold-cool)',
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          marginLeft: '3px',
        }}>{dim.confidence}/5</span>
      </div>
    </div>
  );
}

function SectionTitle({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.85rem', color: 'var(--v2-gold)', letterSpacing: '0.05em',
        }}>{code}</span>
        <span style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool)', opacity: 0.4 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)',
          fontSize: '0.65rem', letterSpacing: '0.22em',
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

function SectionDivider() {
  return (
    <div style={{ textAlign: 'center', margin: '1.2rem 0 1.4rem' }}>
      <svg width="80" height="10" viewBox="0 0 80 10">
        <path d="M 12 5 L 32 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <path d="M 48 5 L 68 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="1.6" fill="none" stroke="var(--v2-gold)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="0.6" fill="var(--v2-gold)" />
      </svg>
    </div>
  );
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

// ─── Dimension Edit Modal ───

function DimensionEditModal({
  dim,
  onSave,
  onClose,
}: {
  dim: Dimension;
  onSave: (updates: { confidence: number; metrics: Metric[]; note: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [confidence, setConfidence] = useState(dim.confidence);
  const [metrics, setMetrics] = useState<Metric[]>(dim.metrics);
  const [note, setNote] = useState(dim.note);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ confidence, metrics, note });
    } finally {
      setSaving(false);
    }
  };

  const updateMetric = (idx: number, key: 'label' | 'value', val: string) => {
    setMetrics(prev => prev.map((m, i) => i === idx ? { ...m, [key]: val } : m));
  };
  const addMetric = () => setMetrics(prev => [...prev, { label: '', value: '' }]);
  const removeMetric = (idx: number) => setMetrics(prev => prev.filter((_, i) => i !== idx));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(40, 30, 22, 0.5)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--v2-paper, #f4ede0)',
          border: '1px solid rgba(184, 160, 100, 0.5)',
          borderTop: '1px solid var(--v2-gold, #c8a956)',
          borderRadius: '2px 2px 0 0',
          padding: '1.4rem 1.2rem calc(1.6rem + env(safe-area-inset-bottom))',
          width: '100%', maxWidth: '480px',
          maxHeight: '90vh', overflowY: 'auto',
          color: 'var(--v2-ink, #2a2521)',
          fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
          boxShadow: '0 -12px 32px rgba(60, 40, 20, 0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.3em',
            color: 'var(--v2-gold-cool, #b8a064)',
            fontStyle: 'italic', marginBottom: '0.3rem',
          }}>EDIT · {dim.en.toUpperCase()}</div>
          <div style={{
            fontSize: '0.7rem', letterSpacing: '0.3em',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontFamily: '"Noto Serif SC", serif',
          }}>{dim.cn}</div>
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{
            fontSize: '0.62rem', letterSpacing: '0.18em',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', marginBottom: '0.55rem',
          }}>CONFIDENCE</div>
          <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                onClick={() => setConfidence(i)}
                style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  border: '1px solid var(--v2-gold-cool, #b8a064)',
                  background: i <= confidence ? 'var(--v2-gold, #c8a956)' : 'transparent',
                  cursor: 'pointer', padding: 0,
                  transition: 'all 0.15s',
                }}
                aria-label={`confidence ${i}`}
              />
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.2rem' }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: '0.5rem',
          }}>
            <span style={{
              fontSize: '0.62rem', letterSpacing: '0.18em',
              color: 'var(--v2-ink-soft, #6a5f54)',
              fontStyle: 'italic',
            }}>METRICS</span>
            <button
              onClick={addMetric}
              style={{
                background: 'transparent',
                border: '1px dashed rgba(184, 160, 100, 0.5)',
                borderRadius: '2px',
                color: 'var(--v2-gold-cool, #b8a064)',
                fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
                fontSize: '0.7rem', letterSpacing: '0.08em',
                padding: '0.2rem 0.6rem', cursor: 'pointer',
              }}
            >+ add</button>
          </div>
          {metrics.length === 0 && (
            <div style={{
              padding: '0.6rem', textAlign: 'center',
              fontSize: '0.7rem', fontStyle: 'italic',
              color: 'var(--v2-ink-soft, #6a5f54)', opacity: 0.55,
            }}>no metrics yet</div>
          )}
          {metrics.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1.4fr auto',
                gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'center',
              }}
            >
              <input
                value={m.label}
                onChange={e => updateMetric(idx, 'label', e.target.value)}
                placeholder="label"
                style={{
                  background: 'rgba(255, 255, 255, 0.55)',
                  border: '1px solid rgba(184, 160, 100, 0.35)',
                  borderRadius: '2px',
                  padding: '0.35rem 0.5rem',
                  fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                  fontSize: '0.78rem',
                  color: 'var(--v2-ink, #2a2521)',
                  outline: 'none',
                }}
              />
              <input
                value={m.value}
                onChange={e => updateMetric(idx, 'value', e.target.value)}
                placeholder="value"
                style={{
                  background: 'rgba(255, 255, 255, 0.55)',
                  border: '1px solid rgba(184, 160, 100, 0.35)',
                  borderRadius: '2px',
                  padding: '0.35rem 0.5rem',
                  fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
                  fontSize: '0.78rem',
                  color: 'var(--v2-ink, #2a2521)',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => removeMetric(idx)}
                style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--v2-ink-soft, #6a5f54)',
                  fontSize: '1rem', padding: '0.2rem 0.4rem',
                  opacity: 0.55, lineHeight: 1,
                }}
                aria-label="remove"
              >×</button>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: '1.4rem' }}>
          <div style={{
            fontSize: '0.62rem', letterSpacing: '0.18em',
            color: 'var(--v2-ink-soft, #6a5f54)',
            fontStyle: 'italic', marginBottom: '0.5rem',
          }}>NOTE</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
            placeholder="…"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.55)',
              border: '1px solid rgba(184, 160, 100, 0.35)',
              borderRadius: '2px',
              padding: '0.55rem 0.7rem',
              fontFamily: '"Cormorant Garamond", "Noto Serif SC", serif',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: 'var(--v2-ink, #2a2521)',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(184, 160, 100, 0.4)',
              borderRadius: '2px',
              padding: '0.55rem',
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontSize: '0.82rem', letterSpacing: '0.12em',
              color: 'var(--v2-ink-soft, #6a5f54)',
              cursor: 'pointer',
            }}
          >cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              background: 'var(--v2-gold, #c8a956)',
              border: '1px solid var(--v2-gold, #c8a956)',
              borderRadius: '2px',
              padding: '0.55rem',
              fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic',
              fontSize: '0.82rem', letterSpacing: '0.12em',
              color: 'white',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >{saving ? 'saving…' : 'save'}</button>
        </div>
      </div>
    </div>
  );
}
