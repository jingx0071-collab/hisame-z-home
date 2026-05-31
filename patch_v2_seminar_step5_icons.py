"""
patch_v2_seminar_step5_icons.py

Replace tab emoji with v2 SVG line icons (跟 health tab bar 风格一致):
  lesson  🎓 → 双联翻开的书 (open book spread)
  chat    💬 → 圆圈问号 (circle + question mark)
  reading 📚 → 三本叠书 (stacked books)
  podium  ✦  → 八角 sparkle star

All SVGs use stroke=currentColor + 1.5 strokeWidth, so cascading
seminar-tab active/inactive color (金 / 灰墨) drives the icon color.

run from ~/Desktop/hisame-z-home:
  cp ~/Downloads/patch_v2_seminar_step5_icons.py . && python3 patch_v2_seminar_step5_icons.py
"""
from pathlib import Path

ROOT = Path(".")

page = ROOT / "src/app/v2/seminar/page.tsx"
content = page.read_text()

# 4 个 emoji → SVG icon

old_lesson = "🎓<span>每日一课</span>"
new_lesson = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden>
              <path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3V5z" />
              <path d="M21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7V5z" />
            </svg>
            <span>每日一课</span>"""

old_chat = "💬<span>问答</span>"
new_chat = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4" />
              <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
            </svg>
            <span>问答</span>"""

old_reading = "📚<span>阅读 club</span>"
new_reading = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden>
              <rect x="4" y="5" width="16" height="4" />
              <rect x="3" y="11" width="18" height="4" />
              <rect x="5" y="17" width="14" height="3" />
            </svg>
            <span>阅读 club</span>"""

old_podium = "✦<span>讲台</span>"
new_podium = """<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 20, height: 20 }} aria-hidden>
              <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2z" />
            </svg>
            <span>讲台</span>"""

for old, new, label in [
    (old_lesson,  new_lesson,  "lesson  🎓 → open book"),
    (old_chat,    new_chat,    "chat    💬 → question mark"),
    (old_reading, new_reading, "reading 📚 → stacked books"),
    (old_podium,  new_podium,  "podium  ✦ → sparkle star"),
]:
    if old not in content:
        raise RuntimeError(f"anchor not found: {label}")
    content = content.replace(old, new)
    print(f"✓ {label}")

page.write_text(content)
print(f"\n✓ written: {page} ({len(content.splitlines())} lines)")
print("\n=== sanity ===")
print(f"  remaining emoji in tab block: {any(e in content for e in ['🎓<span', '💬<span', '📚<span', '✦<span'])}")
print(f"  4 new SVG icons present: {content.count('aria-hidden') >= 4}")
print("\n=== done ===")
print("next: git add -A && git commit && git push")
