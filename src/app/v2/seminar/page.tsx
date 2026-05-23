'use client';

import Link from 'next/link';
import type { CSSProperties } from 'react';
import PageArchway from '../_components/PageArchway';

const projects = [
  { id: 'p1', tag: 'i',   title: 'Predictive coding × narrative selfhood', desc: 'tracking self-as-character in mid-temporal cortex',     status: 'pilot · data wave 2' },
  { id: 'p2', tag: 'ii',  title: 'Active inference in BPD attachment',     desc: 'prediction error routed through interpersonal expectations', status: 'modeling · pre-registration' },
  { id: 'p3', tag: 'iii', title: 'Theta-gamma coupling in language',       desc: 'collaborator: Akiko Yamada (MIT)',                       status: 'ongoing · year 2' },
  { id: 'p4', tag: 'iv',  title: 'Free energy & semantic gap',             desc: 'formalizing objet petit a as irreducible KL divergence', status: 'theory paper · draft 3' },
];

const questions = [
  { id: 'q1', q: 'Where is the "I" in active inference?',                     side: 'agent or fictional construct?' },
  { id: 'q2', q: "Can predictive brains have unconscious in Lacan's sense?",  side: 'structural or hidden layer?' },
  { id: 'q3', q: 'Why does ritual reduce free energy?',                       side: 'Polanyi × Friston intersection' },
  { id: 'q4', q: 'Time as predicted vs lived',                                side: 'phenomenology bridge' },
];

const lectureNote = `draft for fall seminar — opening question: if the brain is a prediction machine, why does surprise feel pleasurable?

hypothesis: certain registers of surprise are sought (humor, eroticism, art) because they release the model from a high-cost prediction lock.

test: measure cortical theta-band activity during punchline detection vs failed-prediction control.

—— ask H to read Zupančič once more before drafting section 3.`;

export default function SeminarPage() {
  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway variant="frame" height={1400} dots={[300, 600, 900, 1200]} />
      <SynapseLayer />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.8rem' }}>
          <Link href="/v2" style={backLinkStyle}>← back</Link>
          <div className="v2-display" style={headerTitleStyle}>X — SEMINAR</div>
          <div style={headerSubStyle}>讲 堂</div>
        </header>

        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '2rem', lineHeight: 1.6,
        }}>
          a podium, a question, a chalk line
        </div>

        <SectionTitle code="A" label="ACTIVE PROJECTS" cn="正 在 推 进" />
        {projects.map((p) => <ProjectCard key={p.id} project={p} />)}

        <SectionDivider />

        <SectionTitle code="B" label="QUESTIONS IN PLAY" cn="未 解 的 问 题" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem', marginBottom: '1rem' }}>
          {questions.map((q) => <QuestionCard key={q.id} question={q} />)}
        </div>

        <SectionDivider />

        <SectionTitle code="C" label="LECTURE NOTE" cn="讲 稿 草 稿" />
        <NoteCard text={lectureNote} />

        <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={footerInfoStyle}>seminar · Z · MMXXVI</div>
        </div>
      </div>
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

// ─── Project Card ───

function ProjectCard({ project }: { project: typeof projects[number] }) {
  return (
    <div style={{
      padding: '0.8rem 0.7rem 0.7rem',
      border: '1px solid rgba(168, 153, 104, 0.5)',
      borderLeft: '2px solid var(--v2-gold)',
      borderRadius: '1px',
      background: 'var(--v2-bg-soft)',
      marginBottom: '0.55rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.55rem', marginBottom: '0.25rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.62rem', color: 'var(--v2-gold)',
          letterSpacing: '0.1em', minWidth: '16px',
        }}>{project.tag}</span>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.84rem', fontWeight: 600,
          color: 'var(--v2-text-strong)', lineHeight: 1.2,
        }}>{project.title}</span>
      </div>
      <div style={{
        fontSize: '0.66rem', color: 'var(--v2-text-mid)',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        lineHeight: 1.45, marginBottom: '0.35rem', paddingLeft: '22px',
      }}>{project.desc}</div>
      <div style={{
        fontSize: '0.54rem', letterSpacing: '0.18em',
        color: 'var(--v2-gold-cool)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', textTransform: 'uppercase', paddingLeft: '22px',
      }}>{project.status}</div>
    </div>
  );
}

// ─── Question Card ───

function QuestionCard({ question }: { question: typeof questions[number] }) {
  return (
    <div style={{
      position: 'relative', padding: '0.8rem 0.6rem 0.6rem',
      border: '1px solid var(--v2-gold-cool)',
      borderRadius: '2px', background: 'var(--v2-bg-soft)',
      minHeight: '118px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', top: '6px', right: '8px',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '1rem', fontWeight: 400,
        color: 'var(--v2-gold)', opacity: 0.65, lineHeight: 1,
      }}>?</div>
      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.78rem', fontWeight: 500,
        color: 'var(--v2-text-strong)', lineHeight: 1.3,
        marginBottom: '0.4rem', paddingRight: '14px',
      }}>{question.q}</div>
      <div style={{ flex: 1 }} />
      <div style={{ width: '14px', height: '1px', background: 'var(--v2-gold)', marginBottom: '0.35rem' }} />
      <div style={{
        fontSize: '0.55rem', color: 'var(--v2-text-faint)',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        letterSpacing: '0.04em', lineHeight: 1.3,
      }}>{question.side}</div>
    </div>
  );
}

// ─── Note Card ───

function NoteCard({ text }: { text: string }) {
  return (
    <div style={{
      padding: '0.9rem 1rem 1rem',
      border: '0.5px solid var(--v2-gold-cool)',
      borderRadius: '2px',
      background: 'var(--v2-bg-soft)',
      position: 'relative',
    }}>
      <div style={{ borderTop: '1px dashed var(--v2-gold-cool)', opacity: 0.4, marginBottom: '0.7rem' }} />
      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.78rem', lineHeight: 1.75,
        color: 'var(--v2-text-mid)', letterSpacing: '0.02em',
        whiteSpace: 'pre-wrap',
      }}>{text}</div>
      <div style={{
        textAlign: 'right', marginTop: '0.9rem',
        fontSize: '0.55rem', color: 'var(--v2-text-faint)',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        letterSpacing: '0.06em',
      }}>— Z · fall 2026</div>
    </div>
  );
}

// ─── Section Title + Divider ───

function SectionTitle({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.7rem', color: 'var(--v2-gold)', letterSpacing: '0.1em',
        }}>{code}</span>
        <span style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool)', opacity: 0.4 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)',
          fontSize: '0.68rem', letterSpacing: '0.22em',
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

// ─── Footer / Archway / Synapse ───

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


function SynapseLayer() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1, opacity: 0.32,
      }}
      viewBox="0 0 375 1400"
      preserveAspectRatio="none"
    >
      <circle cx="60" cy="200" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="95" cy="245" r="1.3" fill="var(--v2-synapse)" />
      <circle cx="45" cy="290" r="1.5" fill="var(--v2-firefly)" />
      <line x1="60" y1="200" x2="95" y2="245" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />
      <line x1="95" y1="245" x2="45" y2="290" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      <circle cx="325" cy="540" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="340" cy="595" r="1.3" fill="var(--v2-synapse)" />
      <line x1="325" y1="540" x2="340" y2="595" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      <circle cx="55" cy="850" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="88" cy="905" r="1.3" fill="var(--v2-synapse)" />
      <circle cx="48" cy="950" r="1.4" fill="var(--v2-firefly)" />
      <line x1="55" y1="850" x2="88" y2="905" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />
      <line x1="88" y1="905" x2="48" y2="950" stroke="var(--v2-synapse)" strokeWidth="0.3" opacity="0.7" />

      <circle cx="300" cy="1150" r="1.6" fill="var(--v2-firefly)" />
      <circle cx="335" cy="1200" r="1.3" fill="var(--v2-synapse)" />

      <circle cx="200" cy="380" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
      <circle cx="240" cy="780" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
      <circle cx="160" cy="1280" r="1.1" fill="var(--v2-firefly)" opacity="0.7" />
    </svg>
  );
}