'use client';
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
    <div className="v2-scope" data-theme={theme}>
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
        aria-label="Theme settings"
      >
        {/* palette icon */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="7" />
          <circle cx="6"  cy="8"  r="1" fill="currentColor" />
          <circle cx="13" cy="6"  r="1" fill="currentColor" />
          <circle cx="14" cy="11" r="1" fill="currentColor" />
          <circle cx="10" cy="14" r="1" fill="currentColor" />
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
                  fontFamily: '"Noto Serif SC", serif',
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
