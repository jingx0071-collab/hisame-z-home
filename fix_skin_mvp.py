"""
UI Skin MVP patch · Vanilla Purple theme
- Append .v2-scope[data-theme='vanilla-purple'] scope to tokens.css
- Rewrite ThemeProvider.tsx to support multi-theme + localStorage persistence

跑在 hisame-z-home 根目录下: python3 fix_skin_mvp.py
"""

import sys
from pathlib import Path

TOKENS_CSS = Path('src/app/v2/_styles/tokens.css')
THEME_PROVIDER = Path('src/app/v2/_components/ThemeProvider.tsx')

# ============================================================
# tokens.css append - Vanilla Purple theme scope (Image 10 spec)
# ============================================================

VANILLA_PURPLE_TOKENS = '''

/* ============================================================
   THEME · Vanilla Purple (Image 10 spec, day mode)
   主色 #F7F3FA / 副色 #EDE4F7 / 强调色 #D7C6F2 / 装饰色 #FDF0FB / 金属色 #E6E6F0
   ============================================================ */
.v2-scope[data-theme='vanilla-purple'] {
  --v2-bg: #F7F3FA;
  --v2-bg-soft: #FDF0FB;
  --v2-text-strong: #4a3f5c;
  --v2-text-mid: #6e5f87;
  --v2-text-faint: #a89dc0;

  --v2-gold: #b8a4d6;
  --v2-gold-cool: #d7c6f2;
  --v2-gold-glow: rgba(184, 164, 214, 0.4);

  --v2-magnolia: #EDE4F7;
  --v2-magnolia-shade: #d7c6f2;
  --v2-petal: #E6E6F0;

  --v2-paper: #F7F3FA;
  --v2-ink: #4a3f5c;
  --v2-ink-soft: #6e5f87;

  --v2-phone-frame-color: #4a3f5c;
}

/* Vanilla Purple particles - soft lavender */
.v2-scope[data-theme='vanilla-purple'] .v2-particle {
  background: var(--v2-magnolia-shade);
  box-shadow: 0 1px 3px rgba(74, 63, 92, 0.15);
}
'''

# ============================================================
# ThemeProvider.tsx full rewrite
# ============================================================

NEW_THEME_PROVIDER = """'use client';
import { useState, useEffect } from 'react';

type Theme = 'day' | 'night' | 'vanilla-purple';

const THEME_OPTIONS: Array<{ value: Theme; label: string; han: string }> = [
  { value: 'day',            label: 'Vintage Gold · Day',   han: '复古金 · 日' },
  { value: 'night',          label: 'Vintage Gold · Night', han: '复古金 · 夜' },
  { value: 'vanilla-purple', label: 'Vanilla Purple',       han: '香草紫 · 日' },
];

const STORAGE_KEY = 'v2-theme';

function isTheme(v: string | null): v is Theme {
  return v === 'day' || v === 'night' || v === 'vanilla-purple';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('day');
  const [menuOpen, setMenuOpen] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) {
      setTheme(stored);
    }
  }, []);

  // Persist theme on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function handleSelect(t: Theme) {
    setTheme(t);
    setMenuOpen(false);
  }

  return (
    <div className=\"v2-scope\" data-theme={theme}>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'var(--v2-bg-soft)',
          border: '1px solid var(--v2-gold)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--v2-gold)',
          zIndex: 100,
        }}
        aria-label=\"Theme settings\"
      >
        {/* palette icon */}
        <svg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"1.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\">
          <circle cx=\"10\" cy=\"10\" r=\"7\" />
          <circle cx=\"6\"  cy=\"8\"  r=\"1\" fill=\"currentColor\" />
          <circle cx=\"13\" cy=\"6\"  r=\"1\" fill=\"currentColor\" />
          <circle cx=\"14\" cy=\"11\" r=\"1\" fill=\"currentColor\" />
          <circle cx=\"10\" cy=\"14\" r=\"1\" fill=\"currentColor\" />
        </svg>
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 'calc(1rem + 52px)',
            right: '1rem',
            background: 'var(--v2-bg-soft)',
            border: '1px solid var(--v2-gold)',
            borderRadius: '4px',
            padding: '8px',
            minWidth: '200px',
            boxShadow: '0 4px 16px var(--v2-gold-glow)',
            zIndex: 100,
          }}
        >
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              style={{
                display: 'block',
                width: '100%',
                background: theme === opt.value ? 'var(--v2-gold)' : 'transparent',
                color: theme === opt.value ? 'var(--v2-bg-soft)' : 'var(--v2-text-strong)',
                border: 'none',
                padding: '10px 12px',
                borderRadius: '3px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'var(--v2-font-display)',
                fontStyle: 'italic',
                fontSize: '14px',
                letterSpacing: '0.05em',
                marginBottom: '2px',
                transition: 'background 0.2s ease',
              }}
            >
              <div>{opt.label}</div>
              <div
                style={{
                  fontSize: '10px',
                  opacity: 0.7,
                  fontFamily: '\"Noto Serif SC\", serif',
                  fontStyle: 'normal',
                  letterSpacing: '0.15em',
                  marginTop: '3px',
                }}
              >
                {opt.han}
              </div>
            </button>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
"""


def main():
    # Verify both files exist
    for f in [TOKENS_CSS, THEME_PROVIDER]:
        if not f.exists():
            print(f'ERROR: {f} not found. 确认在 hisame-z-home 根目录跑 script。')
            sys.exit(1)

    # ---- 1. Patch tokens.css ----
    tokens_content = TOKENS_CSS.read_text(encoding='utf-8')
    
    if 'vanilla-purple' in tokens_content:
        print('ERROR: tokens.css 已经包含 vanilla-purple scope，跳过。')
        sys.exit(1)
    
    tokens_backup = TOKENS_CSS.with_suffix('.css.bak.skin-mvp')
    tokens_backup.write_text(tokens_content, encoding='utf-8')
    print(f'BACKUP: {tokens_backup}')
    
    new_tokens = tokens_content.rstrip() + VANILLA_PURPLE_TOKENS
    TOKENS_CSS.write_text(new_tokens, encoding='utf-8')
    print(f'OK: appended vanilla-purple scope to {TOKENS_CSS}')

    # ---- 2. Rewrite ThemeProvider.tsx ----
    tp_content = THEME_PROVIDER.read_text(encoding='utf-8')
    tp_backup = THEME_PROVIDER.with_suffix('.tsx.bak.skin-mvp')
    tp_backup.write_text(tp_content, encoding='utf-8')
    print(f'BACKUP: {tp_backup}')
    
    THEME_PROVIDER.write_text(NEW_THEME_PROVIDER, encoding='utf-8')
    print(f'OK: rewrote {THEME_PROVIDER}')

    print()
    print('=== verify ===')
    print('1. Check tokens.css 末尾:    tail -30 src/app/v2/_styles/tokens.css')
    print('2. Check ThemeProvider type: head -30 src/app/v2/_components/ThemeProvider.tsx')
    print('3. Dev server:               npm run dev')
    print('   → open http://localhost:3000/v2')
    print('   → 右上角 palette button 点开 menu，3 个选项')
    print('   → 选 Vanilla Purple，整页变浅紫')
    print('   → 刷新页面，主题保持（localStorage 生效）')


if __name__ == '__main__':
    main()
