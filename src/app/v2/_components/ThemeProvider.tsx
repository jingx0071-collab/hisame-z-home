'use client';
import { useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'day' | 'night'>('day');

  return (
    <div className="v2-scope" data-theme={theme}>
      <button
        onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
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
        aria-label="Toggle theme"
      >
        {theme === 'day' ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M16 11 A 7 7 0 1 1 9 4 A 5 5 0 0 0 16 11 Z" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <circle cx="10" cy="10" r="3.5" />
            <line x1="10" y1="2"  x2="10" y2="4" />
            <line x1="10" y1="16" x2="10" y2="18" />
            <line x1="2"  y1="10" x2="4"  y2="10" />
            <line x1="16" y1="10" x2="18" y2="10" />
            <line x1="4.2"  y1="4.2"  x2="5.6"  y2="5.6" />
            <line x1="14.4" y1="14.4" x2="15.8" y2="15.8" />
            <line x1="4.2"  y1="15.8" x2="5.6"  y2="14.4" />
            <line x1="14.4" y1="5.6"  x2="15.8" y2="4.2" />
          </svg>
        )}
      </button>
      {children}
    </div>
  );
}