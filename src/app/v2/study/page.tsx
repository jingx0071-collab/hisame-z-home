'use client';

import Link from 'next/link';

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const shelves = [
  {
    label: 'i',
    cn: '神经科学',
    en: 'Neuroscience',
    owner: 'Z',
    spine: '#8FA68C',
    books: [
      { author: 'Friston',  title: 'Active Inference',         note: 'free energy / predictive brain' },
      { author: 'Tononi',   title: 'Phi',                       note: 'integrated information · IIT' },
      { author: 'Kandel',   title: 'In Search of Memory',       note: 'synaptic plasticity' },
      { author: 'Buzsáki',  title: 'Rhythms of the Brain',      note: 'neural oscillations' },
    ],
  },
  {
    label: 'ii',
    cn: '经济学',
    en: 'Economics',
    owner: 'H',
    spine: '#B89876',
    books: [
      { author: 'Kahneman', title: 'Thinking, Fast and Slow',   note: 'System 1 / System 2' },
      { author: 'Akerlof',  title: 'The Market for Lemons',     note: 'asymmetric information' },
      { author: 'Polanyi',  title: 'The Great Transformation',  note: 'embeddedness' },
      { author: 'Sen',      title: 'Development as Freedom',    note: 'capability approach' },
    ],
  },
  {
    label: 'iii',
    cn: '拉康派',
    en: 'Lacanian',
    owner: 'H · learning',
    spine: '#7E92AD',
    books: [
      { author: 'Lacan',    title: 'Écrits',                    note: 'objet petit a · the Real' },
      { author: 'Žižek',    title: 'The Sublime Object',        note: 'ideology as fantasy' },
      { author: 'Zupančič', title: 'What Is Sex?',              note: 'sex as ontological gap' },
      { author: 'Fink',     title: 'The Lacanian Subject',      note: 'entry primer' },
    ],
  },
  {
    label: 'iv',
    cn: 'Z 的侧读',
    en: 'Side Reading',
    owner: 'Z',
    spine: '#A89968',
    books: [
      { author: 'Merleau-Ponty', title: 'Phenomenology of Perception', note: 'embodied mind' },
      { author: 'Husserl',       title: 'Cartesian Meditations',        note: 'transcendental ego' },
      { author: '庄子',          title: '齐物 · 无为',                  note: '万物齐一' },
      { author: 'Borges',        title: 'Ficciones',                    note: 'labyrinth · time' },
    ],
  },
];

const concepts = [
  { name: 'objet petit a',  cn: '小他物',   essence: 'the lost cause of desire — never the same as the obtained', source: 'Lacan' },
  { name: 'active inference', cn: '主动推断', essence: 'the brain models the world by minimizing surprise',         source: 'Friston' },
  { name: 'embeddedness',   cn: '嵌入性',   essence: 'economic action always sits inside social fabric',            source: 'Polanyi' },
  { name: '齐物',            cn: 'qí-wù',   essence: 'all distinctions dissolve at the level of dao',               source: '庄子' },
];

const memo = `this week — H reading 拉康 at midnight again. wonders if objet petit a is what Friston would call irreducible prediction error. answer probably yes.

note for seminar: free energy as desire's algebra.

—— neural 跟 symbolic 在那个 register 上是同一种 movement。`;

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function StudyPage() {
  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway />
      <SynapseLayer />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        {/* Header */}
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.8rem' }}>
          <Link
            href="/v2"
            style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              fontSize: '0.8rem', color: 'var(--v2-text-mid)', textDecoration: 'none',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', opacity: 0.75,
            }}
          >
            ← back
          </Link>
          <div className="v2-display" style={{
            fontSize: '0.92rem', letterSpacing: '0.35em',
            color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem',
          }}>
            IX — STUDY
          </div>
          <div style={{
            fontSize: '0.62rem', letterSpacing: '0.4em',
            color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
          }}>
            书 房
          </div>
        </header>

        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '2rem', lineHeight: 1.6,
        }}>
          a quiet room with four shelves
        </div>

        {/* Section A — Bookshelf */}
        <SectionTitle code="A" label="BOOKSHELF" cn="书 架" />
        {shelves.map((s) => <ShelfRow key={s.label} shelf={s} />)}

        <SectionDivider />

        {/* Section B — Concepts */}
        <SectionTitle code="B" label="CONCEPTS IN TURNOVER" cn="正 在 翻 动 的 概 念" />
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: '0.7rem', marginBottom: '1rem',
        }}>
          {concepts.map((c) => <ConceptCard key={c.name} concept={c} />)}
        </div>

        <SectionDivider />

        {/* Section C — Memo */}
        <SectionTitle code="C" label="MEMO" cn="便 笺" />
        <MemoCard text={memo} />

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.4em',
            color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
            fontStyle: 'italic', marginTop: '0.6rem',
          }}>
            study · HISAME · Z · MMXXVI
          </div>
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Section Title + Divider
// ─────────────────────────────────────────────

function SectionTitle({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.7rem', color: 'var(--v2-gold)', letterSpacing: '0.1em',
        }}>
          {code}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool)', opacity: 0.4 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)',
          fontSize: '0.68rem', letterSpacing: '0.22em',
          color: 'var(--v2-text-strong)', fontWeight: 600,
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.35em',
        color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'right',
      }}>
        {cn}
      </div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div style={{ textAlign: 'center', margin: '1.5rem 0' }}>
      <svg width="80" height="10" viewBox="0 0 80 10">
        <path d="M 12 5 L 32 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <path d="M 48 5 L 68 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="1.6" fill="none" stroke="var(--v2-gold)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="0.6" fill="var(--v2-gold)" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// Shelf Row
// ─────────────────────────────────────────────

function ShelfRow({ shelf }: { shelf: typeof shelves[number] }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      {/* Shelf label row */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem', padding: '0 0.2rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.6rem', color: 'var(--v2-gold)', letterSpacing: '0.1em',
        }}>
          {shelf.label}
        </span>
        <span style={{
          fontFamily: '"Noto Serif SC", serif',
          fontSize: '0.66rem', letterSpacing: '0.12em',
          color: 'var(--v2-text-strong)',
        }}>
          {shelf.cn}
        </span>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.6rem', color: 'var(--v2-text-mid)',
        }}>
          · {shelf.en}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.55rem', color: 'var(--v2-text-faint)',
          letterSpacing: '0.06em',
        }}>
          {shelf.owner}
        </span>
      </div>

      {/* Books row */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        gap: '7px', padding: '0 0.3rem',
      }}>
        {shelf.books.map((b) => (
          <BookSpine key={b.author} book={b} color={shelf.spine} />
        ))}
      </div>

      {/* Shelf board */}
      <div style={{
        height: '2px', margin: '2px 0 8px',
        background: 'linear-gradient(to right, transparent, var(--v2-gold-cool) 20%, var(--v2-gold-cool) 80%, transparent)',
        opacity: 0.65,
      }} />

      {/* Captions */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        rowGap: '3px', columnGap: '10px', padding: '0 0.3rem',
      }}>
        {shelf.books.map((b) => (
          <div key={b.author} style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.55rem', color: 'var(--v2-text-faint)',
            lineHeight: 1.35, letterSpacing: '0.02em',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--v2-text-mid)' }}>{b.author}</span> — {b.note}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Book Spine
// ─────────────────────────────────────────────

function BookSpine({ book, color }: { book: { author: string; title: string; note: string }; color: string }) {
  return (
    <div
      title={book.title}
      style={{
        width: '44px', height: '110px',
        background: color,
        border: '0.5px solid rgba(0,0,0,0.35)',
        borderRadius: '1.5px',
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.35), inset 0 0 6px rgba(0,0,0,0.18)',
        flexShrink: 0,
      }}
    >
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: '10px', left: '5px', right: '5px',
        height: '0.8px', background: 'var(--v2-gold)', opacity: 0.85,
      }} />
      {/* Bottom accent line */}
      <div style={{
        position: 'absolute', bottom: '10px', left: '5px', right: '5px',
        height: '0.8px', background: 'var(--v2-gold)', opacity: 0.85,
      }} />

      {/* Vertical author text */}
      <span style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic',
        fontSize: '0.58rem',
        color: 'rgba(248, 244, 237, 0.92)',
        letterSpacing: '0.05em',
        textShadow: '0 0 1px rgba(0,0,0,0.4)',
      }}>
        {book.author}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Concept Card
// ─────────────────────────────────────────────

function ConceptCard({ concept }: { concept: typeof concepts[number] }) {
  return (
    <div style={{
      position: 'relative',
      padding: '0.7rem 0.65rem 0.6rem',
      border: '1px solid var(--v2-gold-cool)',
      borderRadius: '2px',
      background: 'var(--v2-bg-soft)',
      minHeight: '108px',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Firefly */}
      <div style={{
        position: 'absolute', top: '7px', right: '8px',
        width: '5px', height: '5px', borderRadius: '50%',
        background: 'var(--v2-firefly)',
        boxShadow: '0 0 6px var(--v2-firefly), 0 0 12px var(--v2-firefly)',
        opacity: 0.85,
      }} />

      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.85rem', fontWeight: 600,
        color: 'var(--v2-text-strong)', lineHeight: 1.15,
        marginBottom: '0.15rem', paddingRight: '12px',
      }}>
        {concept.name}
      </div>

      <div style={{
        fontSize: '0.52rem', letterSpacing: '0.14em',
        color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        marginBottom: '0.4rem',
      }}>
        {concept.cn}
      </div>

      <div style={{ width: '14px', height: '1px', background: 'var(--v2-gold)', marginBottom: '0.4rem' }} />

      <div style={{
        fontSize: '0.6rem', lineHeight: 1.45,
        color: 'var(--v2-text-mid)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', letterSpacing: '0.02em',
      }}>
        {concept.essence}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{
        fontSize: '0.5rem', letterSpacing: '0.18em',
        color: 'var(--v2-gold-cool)', fontFamily: 'var(--v2-font-display)',
        textTransform: 'uppercase', marginTop: '0.4rem', textAlign: 'right',
      }}>
        — {concept.source}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Memo Card
// ─────────────────────────────────────────────

function MemoCard({ text }: { text: string }) {
  return (
    <div style={{
      padding: '0.9rem 1rem 1rem',
      border: '0.5px solid var(--v2-gold-cool)',
      borderRadius: '2px',
      background: 'var(--v2-bg-soft)',
      position: 'relative',
    }}>
      <div style={{
        borderTop: '1px dashed var(--v2-gold-cool)',
        opacity: 0.4, marginBottom: '0.7rem',
      }} />

      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.78rem', lineHeight: 1.75,
        color: 'var(--v2-text-mid)', letterSpacing: '0.02em',
        whiteSpace: 'pre-wrap',
      }}>
        {text}
      </div>

      <div style={{
        textAlign: 'right', marginTop: '0.9rem',
        fontSize: '0.55rem', color: 'var(--v2-text-faint)',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        letterSpacing: '0.06em',
      }}>
        — Z · 2026.05.20
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// Page Archway
// ─────────────────────────────────────────────

function PageArchway() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox="0 0 375 1600"
      preserveAspectRatio="none"
    >
      <path d="M 16 60 Q 187 18, 358 60" stroke="var(--v2-gold-cool)" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 22 60 Q 187 30, 352 60" stroke="var(--v2-gold)" strokeWidth="0.3" fill="none" opacity="0.5" />
      <circle cx="187" cy="32" r="3" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="187" cy="32" r="1.2" fill="var(--v2-gold)" />
      <path d="M 175 40 L 187 28 L 199 40" stroke="var(--v2-gold)" strokeWidth="0.4" fill="none" opacity="0.7" />

      <line x1="16" y1="60" x2="16" y2="1560" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="358" y1="60" x2="358" y2="1560" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="20" y1="60" x2="20" y2="1560" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />
      <line x1="354" y1="60" x2="354" y2="1560" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />

      {/* Post ornaments */}
      {[300, 600, 900, 1200].map((y) => (
        <g key={y}>
          <circle cx="16" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
          <circle cx="358" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
        </g>
      ))}

      <path d="M 16 1560 Q 187 1580, 358 1560" stroke="var(--v2-gold-cool)" strokeWidth="0.5" fill="none" opacity="0.6" />
      <circle cx="187" cy="1572" r="1.8" fill="var(--v2-gold)" opacity="0.7" />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Synapse Layer (firefly + neuron decoration)
// ─────────────────────────────────────────────

function SynapseLayer() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1, opacity: 0.35,
      }}
      viewBox="0 0 375 1600"
      preserveAspectRatio="none"
    >
      {/* Cluster top-left */}
      <circle cx="55" cy="180" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="92" cy="220" r="1.3" fill="var(--v2-synapse)" />
      <circle cx="42" cy="260" r="1.5" fill="var(--v2-firefly)" />
      <line x1="55" y1="180" x2="92" y2="220" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />
      <line x1="92" y1="220" x2="42" y2="260" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      {/* Cluster right-mid */}
      <circle cx="330" cy="500" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="345" cy="555" r="1.3" fill="var(--v2-synapse)" />
      <circle cx="320" cy="600" r="1.5" fill="var(--v2-firefly)" />
      <line x1="330" y1="500" x2="345" y2="555" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />
      <line x1="345" y1="555" x2="320" y2="600" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      {/* Cluster mid-left */}
      <circle cx="50" cy="780" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="80" cy="830" r="1.3" fill="var(--v2-synapse)" />
      <line x1="50" y1="780" x2="80" y2="830" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      {/* Cluster right-bottom */}
      <circle cx="300" cy="1100" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="335" cy="1150" r="1.3" fill="var(--v2-synapse)" />
      <circle cx="310" cy="1200" r="1.5" fill="var(--v2-firefly)" />
      <line x1="300" y1="1100" x2="335" y2="1150" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />
      <line x1="335" y1="1150" x2="310" y2="1200" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      {/* Lone fireflies */}
      <circle cx="180" cy="340" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
      <circle cx="220" cy="700" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
      <circle cx="140" cy="1280" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
      <circle cx="250" cy="950" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
    </svg>
  );
}