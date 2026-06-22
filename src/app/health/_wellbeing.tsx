'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

type Metric = { label: string; value: string };

type Dimension = {
  id: string;
  en: string;
  cn: string;
  confidence: number | null;
  metrics: Metric[];
  note: string;
};

type ApiDimension = {
  dim_id: string;
  position: number;
  en: string;
  cn: string;
  confidence: number | null;
  metrics: Metric[];
  note: string;
};

type ApiResponse = {
  mode?: string;
  computed_at?: string;
  week_start?: string;
  dimensions: ApiDimension[];
};

const API_URL = '/api/v2/health?mode=computed';

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

function formatPST(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'America/Los_Angeles',
      month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(d);
  } catch {
    return iso;
  }
}

export default function WellbeingView() {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const [computedAt, setComputedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      const res = await fetch(API_URL);
      const data: ApiResponse = await res.json();
      if (Array.isArray(data.dimensions)) {
        setDimensions(data.dimensions.map(fromApi));
        if (data.computed_at) setComputedAt(data.computed_at);
      }
    } catch (e) {
      console.error('fetch health computed failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const dim = dimensions[active];

  return (
    <div style={{ position: 'relative' }}>
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
        }}>暂时算不出，等会再看</div>
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

          {dim && <DimensionCard dim={dim} />}

          <SectionDivider />

          <SectionTitle code="·" label="WEEKLY SUMMARY" cn="本 周 概 览" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.55rem', marginBottom: '1rem' }}>
            {dimensions.map((d) => <MiniSummary key={d.id} dim={d} />)}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.7 }}>
        {computedAt && (
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.58rem', color: 'var(--v2-text-faint)',
            letterSpacing: '0.18em', marginBottom: '0.5rem',
          }}>
            computed · {formatPST(computedAt)}
          </div>
        )}
        <FooterOrnament />
        <div style={footerInfoStyle}>care · HISAME · MMXXVI</div>
      </div>
    </div>
  );
}

// ─── Styles ───
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
      borderRadius: '0',
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

      {dim.metrics.length > 0 && (
        <>
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
        </>
      )}

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

function ConfidenceDots({ level }: { level: number | null }) {
  const hasData = level !== null;
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
            background: hasData && i < (level as number) ? 'var(--v2-gold)' : 'transparent',
            border: '0.8px solid var(--v2-gold-cool)',
            boxShadow: hasData && i < (level as number) ? '0 0 4px rgba(212, 185, 138, 0.5)' : 'none',
          }} />
        ))}
      </div>
      <span style={{
        fontSize: '0.62rem', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', color: 'var(--v2-gold)',
        letterSpacing: '0.04em',
      }}>{hasData ? `${level} / 5` : '— / —'}</span>
    </div>
  );
}

function MiniSummary({ dim }: { dim: Dimension }) {
  const hasData = dim.confidence !== null;
  return (
    <div style={{
      padding: '0.65rem 0.55rem 0.7rem',
      border: '0.5px solid var(--v2-gold-cool)',
      borderRadius: '0', background: 'var(--v2-bg-soft)',
      opacity: hasData ? 0.92 : 0.6,
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
            background: hasData && i < (dim.confidence as number) ? 'var(--v2-gold)' : 'transparent',
            border: '0.5px solid var(--v2-gold-cool)',
          }} />
        ))}
        <span style={{
          fontSize: '0.55rem', color: 'var(--v2-gold-cool)',
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          marginLeft: '3px',
        }}>{hasData ? `${dim.confidence}/5` : '—'}</span>
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
