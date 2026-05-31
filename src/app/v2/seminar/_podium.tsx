'use client';

// Placeholder — decor source 将在 step 3 从 page.tsx.v2decor.bak 里搬入
// (projects / questions / lectureNote / ProjectCard / QuestionCard / NoteCard
//  / SectionTitle / SectionDivider / FooterOrnament / SynapseLayer)
export default function PodiumView() {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem 1rem',
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      color: 'var(--v2-text-mid)',
      fontSize: '0.95rem',
    }}>
      ✦ 讲台
      <div style={{
        marginTop: '0.6rem',
        fontSize: '0.78rem',
        letterSpacing: '0.08em',
      }}>
        装饰版即将搬入 · placeholder
      </div>
    </div>
  );
}
