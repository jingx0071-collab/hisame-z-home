"""
patch_v2_seminar_step6_css.py

Step 6 for v2/seminar:
  - create src/app/v2/seminar/seminar.css (v2 玉兰纸 override for all v1 className)
  - add `import './seminar.css'` to page.tsx top

Covers className 命名空间:
  seminar-* / lesson-* / reading-* / prof-* / cream-chat-* / modal-*
  / type-* / view-* / med-fab / back-btn-floating
"""
from pathlib import Path

ROOT = Path(".")

css = """/* v2/seminar scoped override — covers v1 seminar-/lesson-/reading-/prof-/cream-chat-/modal-/type-/view-* className
   to v2 玉兰纸 + Cormorant italic + 金色 hairline. Loaded after globals.css so this wins. */

/* === 顶层 === */
.seminar { background: var(--v2-paper, #f4ede0) !important; color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; }
.seminar-body, .seminar-body.lesson-body, .seminar-body.reading-body, .seminar-body.prof-body { background: transparent !important; }
.seminar-loading, .seminar-empty, .seminar-empty-hint { color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; }
.seminar-section-title { color: var(--v2-gold-cool, #b8a064) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; letter-spacing: 0.18em; }
.seminar-cta { background: var(--v2-gold, #c8a956) !important; color: white !important; border: none !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; letter-spacing: 0.1em; padding: 8px 18px !important; border-radius: 2px !important; }

/* hide v1 header / back btn (v2 header already in page.tsx) */
.seminar-header, .seminar-title, .seminar-header-right { display: none !important; }
.back-btn-floating { display: none !important; }

/* === Tab bar === */
.seminar-tabs { background: transparent !important; border-bottom: 1px solid rgba(184, 160, 100, 0.25) !important; padding-bottom: 0 !important; gap: 0 !important; margin-bottom: 1.6rem !important; }
.seminar-tab { background: transparent !important; border: none !important; border-bottom: 2px solid transparent !important; color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; font-style: italic; letter-spacing: 0.06em; padding: 10px 6px !important; border-radius: 0 !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 4px !important; }
.seminar-tab-active { color: var(--v2-gold, #c8a956) !important; border-bottom-color: var(--v2-gold, #c8a956) !important; background: transparent !important; }
.seminar-tab svg { color: inherit; }
.seminar-tab span { color: inherit; }

/* === lesson view === */
.lesson-today, .lesson-view-panel { background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-left: 2px solid var(--v2-gold, #c8a956) !important; border-radius: 2px !important; }
.lesson-today-title, .lesson-view-title { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; color: var(--v2-ink, #2a2521) !important; font-style: italic; }
.lesson-today-tag, .lesson-view-tag { background: var(--v2-gold, #c8a956) !important; color: white !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; letter-spacing: 0.1em; border-radius: 2px !important; }
.lesson-today-content, .lesson-view-content { color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; line-height: 1.75 !important; }
.lesson-word-card { background: transparent !important; border: 1px dashed rgba(184, 160, 100, 0.45) !important; border-radius: 2px !important; }
.lesson-word { color: var(--v2-gold-cool, #b8a064) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.lesson-word-kana { color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; }
.lesson-past, .lesson-past-list { background: transparent !important; }
.lesson-past-card { background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; }
.lesson-past-emoji { background: transparent !important; }
.lesson-past-title { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; color: var(--v2-ink, #2a2521) !important; font-style: italic; }
.lesson-past-meta, .lesson-past-info { color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; }

/* === reading view === */
.reading-body, .reading-list { background: transparent !important; }
.reading-filter { background: transparent !important; }
.reading-filter-btn { background: transparent !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; color: var(--v2-ink-soft, #6a5f54) !important; border-radius: 2px !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; letter-spacing: 0.08em; }
.reading-filter-active { background: var(--v2-gold, #c8a956) !important; color: white !important; border-color: var(--v2-gold, #c8a956) !important; }
.reading-card { background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; }
.reading-card-emoji, .reading-card-info { background: transparent !important; }
.reading-card-title { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; color: var(--v2-ink, #2a2521) !important; font-style: italic; }
.reading-card-author { color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.reading-card-cat { background: transparent !important; border: 1px solid rgba(184, 160, 100, 0.4) !important; color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; border-radius: 2px !important; letter-spacing: 0.08em; }
.reading-card-z-tag { background: var(--v2-gold, #c8a956) !important; color: white !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; border-radius: 2px !important; letter-spacing: 0.08em; }
.reading-view-panel { background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-left: 2px solid var(--v2-gold, #c8a956) !important; border-radius: 2px !important; }
.reading-view-emoji { background: transparent !important; }
.reading-view-title { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; color: var(--v2-ink, #2a2521) !important; font-style: italic; }
.reading-view-author, .reading-view-section-label { color: var(--v2-gold-cool, #b8a064) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; letter-spacing: 0.12em; }
.reading-view-cat { background: transparent !important; border: 1px solid rgba(184, 160, 100, 0.4) !important; color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; border-radius: 2px !important; }
.reading-view-excerpt, .reading-view-note { background: transparent !important; }
.reading-view-excerpt-text, .reading-view-note-text { color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; line-height: 1.75 !important; }
.reading-view-edit { background: transparent !important; color: var(--v2-gold-cool, #b8a064) !important; border: 1px solid rgba(184, 160, 100, 0.4) !important; border-radius: 2px !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.reading-view-actions { background: transparent !important; }

/* === prof chat (问答 view) === */
.prof-body, .prof-chat-v2 { background: transparent !important; }
.prof-empty, .prof-empty-title, .prof-empty-hint, .prof-loading { color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; }
.prof-row { background: transparent !important; }
.prof-bubble-v2 { background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.3) !important; border-radius: 2px !important; color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; }
.prof-bubble-v2-user, .prof-bubble-v2.prof-bubble-v2-user { background: var(--v2-magnolia-shade, #E8DFC8) !important; border-color: rgba(184, 160, 100, 0.4) !important; }
.prof-bubble-v2-assistant, .prof-bubble-v2.prof-bubble-v2-assistant { background: var(--v2-magnolia, #F8F4ED) !important; }
.prof-time { color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.prof-thinking-indicator { color: var(--v2-gold-cool, #b8a064) !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; }
.prof-pending, .prof-pending-chip { background: transparent !important; border: 1px dashed rgba(184, 160, 100, 0.45) !important; color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; border-radius: 2px !important; }
.prof-clear { background: transparent !important; color: var(--v2-ink-soft, #6a5f54) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.prof-input-bar-v2 { background: rgba(255, 253, 247, 0.65) !important; border-top: 1px solid rgba(184, 160, 100, 0.3) !important; }
.prof-input-v2 { background: rgba(255, 255, 255, 0.6) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; }
.prof-input-v2::placeholder { color: var(--v2-ink-soft, #6a5f54) !important; font-style: italic; opacity: 0.55; }
.prof-input-v2:focus { border-color: var(--v2-gold, #c8a956) !important; }
.prof-attachments, .prof-attachment-chip { background: transparent !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; border-radius: 2px !important; }
.prof-att-img, .prof-att-file { background: rgba(255, 255, 255, 0.45) !important; border: 1px solid rgba(184, 160, 100, 0.3) !important; border-radius: 2px !important; }
.cream-chat-attach, .cream-chat-send { background: transparent !important; color: var(--v2-gold-cool, #b8a064) !important; border: 1px solid rgba(184, 160, 100, 0.4) !important; border-radius: 2px !important; }
.cream-chat-thinking-toggle { background: transparent !important; color: var(--v2-gold-cool, #b8a064) !important; border: none !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; }
.cream-chat-thinking-content { background: rgba(255, 255, 255, 0.4) !important; border: 1px dashed rgba(184, 160, 100, 0.4) !important; border-radius: 2px !important; color: var(--v2-ink-soft, #6a5f54) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; font-style: italic; }
.cream-chat-zoom { background: rgba(40, 30, 22, 0.7) !important; }

/* === inputs (general) === */
.seminar input, .seminar textarea, .seminar select { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; color: var(--v2-ink, #2a2521) !important; background: rgba(255, 255, 255, 0.5) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; }

/* === modal (跟 health 一致) === */
.modal-backdrop, .modal-backdrop.modal-backdrop { background: rgba(40, 30, 22, 0.45) !important; backdrop-filter: blur(2px) !important; }
.modal-panel, .modal-panel.modal-panel { background: var(--v2-paper, #f4ede0) !important; background-image: none !important; border: 1px solid rgba(184, 160, 100, 0.5) !important; border-radius: 2px !important; box-shadow: 0 12px 32px rgba(60, 40, 20, 0.18) !important; color: var(--v2-ink, #2a2521) !important; }
.modal-panel-tall.modal-panel-tall { max-height: 85vh !important; }
.modal-title, .modal-title.modal-title { font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; font-style: italic !important; color: var(--v2-gold-cool, #b8a064) !important; letter-spacing: 0.15em !important; }
.modal-field-label { font-family: 'Cormorant Garamond', serif !important; font-style: italic; color: var(--v2-ink-soft, #6a5f54) !important; letter-spacing: 0.1em; }
.modal-input, .modal-textarea, .modal-input.modal-input, .modal-textarea.modal-textarea { background: rgba(255, 255, 255, 0.6) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; color: var(--v2-ink, #2a2521) !important; font-family: 'Cormorant Garamond', 'Noto Serif SC', serif !important; }
.modal-input-emoji.modal-input-emoji { text-align: center !important; font-size: 1.6rem !important; }
.modal-textarea-big.modal-textarea-big { min-height: 200px !important; }
.modal-input::placeholder, .modal-textarea::placeholder { color: var(--v2-ink-soft, #6a5f54) !important; opacity: 0.55; font-style: italic; }
.modal-input:focus, .modal-textarea:focus { border-color: var(--v2-gold, #c8a956) !important; }
.modal-btn { font-family: 'Cormorant Garamond', serif !important; font-style: italic !important; letter-spacing: 0.12em !important; border-radius: 2px !important; }
.modal-btn-primary, .modal-btn-primary.modal-btn-primary { background: var(--v2-gold, #c8a956) !important; color: white !important; border: 1px solid var(--v2-gold, #c8a956) !important; }
.modal-btn-ghost, .modal-btn-ghost.modal-btn-ghost { background: transparent !important; color: var(--v2-ink-soft, #6a5f54) !important; border: 1px solid rgba(184, 160, 100, 0.4) !important; }
.modal-actions { background: transparent !important; }
.view-close { background: transparent !important; color: var(--v2-ink-soft, #6a5f54) !important; border: 1px solid rgba(184, 160, 100, 0.35) !important; border-radius: 2px !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.view-delete { color: #a0252a !important; background: transparent !important; font-style: italic; font-family: 'Cormorant Garamond', serif !important; border: none !important; }

/* === type switcher === */
.type-switcher { background: rgba(255, 255, 255, 0.4) !important; border: 1px solid rgba(184, 160, 100, 0.3) !important; border-radius: 2px !important; }
.type-btn { background: transparent !important; color: var(--v2-ink-soft, #6a5f54) !important; border: none !important; font-family: 'Cormorant Garamond', serif !important; font-style: italic; }
.type-btn-active { background: var(--v2-gold, #c8a956) !important; color: white !important; }

/* === FAB === */
.med-fab { background: var(--v2-gold, #c8a956) !important; color: white !important; box-shadow: 0 4px 12px rgba(200, 169, 86, 0.3) !important; }
"""

# === 1. write seminar.css ===
css_path = ROOT / "src/app/v2/seminar/seminar.css"
css_path.write_text(css)
print(f"✓ created {css_path} ({len(css.splitlines())} lines)")

# === 2. add import to page.tsx ===
page_path = ROOT / "src/app/v2/seminar/page.tsx"
content = page_path.read_text()

if "import './seminar.css'" in content:
    print("  import './seminar.css' 已存在 (skip)")
else:
    old = "'use client';"
    new = "'use client';\n\nimport './seminar.css';"
    if old not in content:
        raise RuntimeError("anchor 'use client' not found")
    content = content.replace(old, new, 1)
    page_path.write_text(content)
    print(f"✓ added 'import ./seminar.css' to {page_path}")

print("\n=== sanity ===")
print(f"  css exists: {css_path.exists()}")
print(f"  page imports css: {'import \\'./seminar.css\\'' in page_path.read_text()}")
print("\n=== done ===")
print("next: git add -A && git commit && git push")
