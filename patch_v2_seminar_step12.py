"""
patch_v2_seminar_step12.py

Step 1+2 combined for v2/seminar:
  - backup v2 decor → page.tsx.v2decor.bak
  - fork v1 seminar/page.tsx → v2/seminar/page.tsx
  - rewrite SeminarPage function: v2 header (X — SEMINAR + 讲 堂 + slogan)
    + PageArchway shell + 4-tab switcher (lesson|chat|reading|podium)
  - create placeholder _podium.tsx (decor source will move in step 3)

run from ~/Desktop/hisame-z-home:
  cp ~/Downloads/patch_v2_seminar_step12.py . && python3 patch_v2_seminar_step12.py
"""
from pathlib import Path
import shutil

ROOT = Path(".")

# === 1. backup v2 decor ===
src_decor = ROOT / "src/app/v2/seminar/page.tsx"
bak = ROOT / "src/app/v2/seminar/page.tsx.v2decor.bak"
if not bak.exists():
    shutil.copy(src_decor, bak)
    print(f"✓ backup created: {bak}")
else:
    print(f"  backup already exists: {bak}")

# === 2. read v1 page.tsx content ===
v1_path = ROOT / "src/app/seminar/page.tsx"
v1 = v1_path.read_text()
print(f"  v1 loaded: {len(v1.splitlines())} lines")

# === 3. transform ===

# a. Tab type add podium
old_type = "type Tab = 'lesson' | 'chat' | 'reading';"
new_type = "type Tab = 'lesson' | 'chat' | 'reading' | 'podium';"
if old_type not in v1:
    raise RuntimeError("anchor 'type Tab' 没找到")
v1 = v1.replace(old_type, new_type)
print("✓ a. Tab type 加 podium")

# b. imports add PageArchway + PodiumView
old_import = "import { useState, useEffect, useRef } from 'react';"
new_import = (
    "import { useState, useEffect, useRef } from 'react';\n"
    "import PageArchway from '../_components/PageArchway';\n"
    "import PodiumView from './_podium';"
)
if old_import not in v1:
    raise RuntimeError("anchor 'import react' 没找到")
v1 = v1.replace(old_import, new_import)
print("✓ b. imports 加 PageArchway + PodiumView")

# c. replace SeminarPage function body
old_main = '''export default function SeminarPage() {
  const [tab, setTab] = useState<Tab>('lesson');

  return (
    <div className="seminar">
      <header className="seminar-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="seminar-title">
          <h1>Z 老师讲堂</h1>
          <p>seminar</p>
        </div>
        <div className="seminar-header-right" />
      </header>

      <div className="seminar-tabs">
        <button
          className={`seminar-tab ${tab === 'lesson' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('lesson')}
        >
          🎓<span>每日一课</span>
        </button>
        <button
          className={`seminar-tab ${tab === 'chat' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('chat')}
        >
          💬<span>问答</span>
        </button>
        <button
          className={`seminar-tab ${tab === 'reading' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('reading')}
        >
          📚<span>阅读 club</span>
        </button>
      </div>

      {tab === 'lesson' && <DailyLessonView />}
      {tab === 'chat' && <ProfChatView />}
      {tab === 'reading' && <ReadingClubView />}
    </div>
  );
}'''

new_main = '''export default function SeminarPage() {
  const [tab, setTab] = useState<Tab>('lesson');

  return (
    <main className="seminar" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <PageArchway variant="frame" height={1400} dots={[300, 600, 900, 1200]} />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.4rem' }}>
          <Link
            href="/v2"
            style={{
              position: 'absolute', top: '0.2rem', left: 0,
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.85rem', color: 'var(--v2-text-mid)',
              textDecoration: 'none', letterSpacing: '0.04em',
            }}
          >
            ← back
          </Link>
          <div
            className="v2-display"
            style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '1.7rem', color: 'var(--v2-gold)',
              letterSpacing: '0.12em', lineHeight: 1.1,
            }}
          >
            X — SEMINAR
          </div>
          <div
            style={{
              fontFamily: 'var(--v2-font-cn-serif)',
              fontSize: '0.78rem', color: 'var(--v2-text-mid)',
              letterSpacing: '0.32em', marginTop: '0.4rem',
            }}
          >
            讲 堂
          </div>
        </header>

        <div style={{
          textAlign: 'center',
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '1.8rem', lineHeight: 1.6,
        }}>
          a podium, a question, a chalk line
        </div>

        <div className="seminar-tabs">
          <button
            className={`seminar-tab ${tab === 'lesson' ? 'seminar-tab-active' : ''}`}
            onClick={() => setTab('lesson')}
          >
            🎓<span>每日一课</span>
          </button>
          <button
            className={`seminar-tab ${tab === 'chat' ? 'seminar-tab-active' : ''}`}
            onClick={() => setTab('chat')}
          >
            💬<span>问答</span>
          </button>
          <button
            className={`seminar-tab ${tab === 'reading' ? 'seminar-tab-active' : ''}`}
            onClick={() => setTab('reading')}
          >
            📚<span>阅读 club</span>
          </button>
          <button
            className={`seminar-tab ${tab === 'podium' ? 'seminar-tab-active' : ''}`}
            onClick={() => setTab('podium')}
          >
            ✦<span>讲台</span>
          </button>
        </div>

        {tab === 'lesson' && <DailyLessonView />}
        {tab === 'chat' && <ProfChatView />}
        {tab === 'reading' && <ReadingClubView />}
        {tab === 'podium' && <PodiumView />}
      </div>
    </main>
  );
}'''

if old_main not in v1:
    raise RuntimeError("anchor SeminarPage 函数体没找到 (整段精确匹配失败)")
v1 = v1.replace(old_main, new_main)
print("✓ c. SeminarPage 函数体替换 (v2 header + PageArchway shell + 4-tab)")

# === 4. write v2/seminar/page.tsx ===
out = ROOT / "src/app/v2/seminar/page.tsx"
out.write_text(v1)
print(f"\n✓ written: {out} ({len(v1.splitlines())} lines)")

# === 5. create placeholder _podium.tsx ===
podium = ROOT / "src/app/v2/seminar/_podium.tsx"
if not podium.exists():
    podium.write_text("""'use client';

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
""")
    print(f"✓ placeholder created: {podium}")
else:
    print(f"  _podium.tsx already exists: {podium}")

print("\n=== done ===")
print("next: git add -A && git commit && git push")
