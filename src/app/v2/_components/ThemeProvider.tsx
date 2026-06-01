'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';

const THEME_KEY = 'v2-theme';
const SKIN_KEY = 'v2-skin';

type Skin = 'archway' | 'grace-os' | 'white-gothic';

const SKINS: Skin[] = ['archway', 'grace-os', 'white-gothic'];

const SKIN_LABEL: Record<Skin, string> = {
  archway: '月下亭台',
  'grace-os': '绯雨小居',
  'white-gothic': '白祷圣窗',
};

const SkinContext = createContext<Skin>('archway');
export const useSkin = () => useContext(SkinContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [skin, setSkin] = useState<Skin>('archway');
  const [skinMenuOpen, setSkinMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/v2';

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'day' || savedTheme === 'night') setTheme(savedTheme);

      const savedSkin = localStorage.getItem(SKIN_KEY);
      if (savedSkin && SKINS.includes(savedSkin as Skin)) setSkin(savedSkin as Skin);
    } catch {}
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'day' ? 'night' : 'day';
      try { localStorage.setItem(THEME_KEY, next); } catch {}
      return next;
    });
  };

  const chooseSkin = (nextSkin: Skin) => {
    setSkin(nextSkin);
    setSkinMenuOpen(false);
    try { localStorage.setItem(SKIN_KEY, nextSkin); } catch {}
  };

  return (
    <SkinContext.Provider value={skin}>
      <div className="v2-scope" data-theme={theme} data-skin={skin}>
        <button
          onClick={toggleTheme}
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            width: 40,
            height: 38,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.28)',
            border: '1px solid var(--v2-gold)',
            cursor: 'pointer',
            display: isHome ? 'flex' : 'none',
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

        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 101,
            display: isHome ? 'block' : 'none',
            fontFamily: 'var(--v2-font-display)',
          }}
        >
          <button
            onClick={() => setSkinMenuOpen((prev) => !prev)}
            style={{
              height: 38,
              minWidth: 112,
              padding: '0 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.28)',
              border: '1px solid var(--v2-gold)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              color: 'var(--v2-gold)',
              boxShadow: '0 14px 34px rgba(40, 48, 48, 0.12)',
              backdropFilter: 'blur(16px)',
              fontFamily: 'var(--v2-font-display)',
              fontSize: 12,
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
            aria-label="Choose skin"
            aria-expanded={skinMenuOpen}
          >
            <span>{SKIN_LABEL[skin]}</span>
            <span style={{ fontSize: 10, transform: skinMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 160ms ease' }}>⌄</span>
          </button>

          {skinMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 46,
                right: 0,
                width: 138,
                padding: 6,
                borderRadius: 18,
                background: 'rgba(255,255,255,0.28)',
                border: '1px solid var(--v2-gold)',
                boxShadow: '0 14px 34px rgba(40, 48, 48, 0.12)',
                backdropFilter: 'blur(18px)',
                display: 'grid',
                gap: 4,
              }}
            >
              {SKINS.map((item) => (
                <button
                  key={item}
                  onClick={() => chooseSkin(item)}
                  style={{
                    width: '100%',
                    height: 34,
                    border: '1px solid transparent',
                    borderRadius: 13,
                    background: item === skin ? 'rgba(255,255,255,0.42)' : 'transparent',
                    color: 'var(--v2-text)',
                    cursor: 'pointer',
                    fontFamily: 'var(--v2-font-display)',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    textAlign: 'center',
                  }}
                >
                  {SKIN_LABEL[item]}
                </button>
              ))}
            </div>
          )}
        </div>

        {children}
      </div>
    </SkinContext.Provider>
  );
}
