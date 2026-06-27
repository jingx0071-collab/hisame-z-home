'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const THEME_KEY = 'v2-theme';
const SKIN_KEY = 'v2-skin';

export type Skin = 'archway' | 'grace-os' | 'hisame-room' | 'hisame-signal' | 'green-chat';

const SKINS: Skin[] = ['archway', 'hisame-signal', 'green-chat'];

const SKIN_LABEL: Record<Skin, string> = {
  archway: '月下亭台',
  'hisame-signal': '平成翻盖小手机',
  'grace-os': '月下亭台',
  'hisame-room': '月下亭台',
};

const DEFAULT_SKIN: Skin = 'archway';
const isActiveSkin = (value: string | null): value is Skin =>
  value === 'archway' || value === 'hisame-signal';


const SkinContext = createContext<Skin>('archway');
export const useSkin = () => useContext(SkinContext);

type SkinControls = {
  theme: 'day' | 'night';
  skin: Skin;
  skins: Skin[];
  skinLabel: Record<Skin, string>;
  toggleTheme: () => void;
  chooseSkin: (nextSkin: Skin) => void;
};

const SkinControlsContext = createContext<SkinControls | null>(null);

export const useSkinControls = () => {
  const value = useContext(SkinControlsContext);
  if (!value) throw new Error('useSkinControls must be used inside ThemeProvider');
  return value;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [skin, setSkin] = useState<Skin>('archway');

  useEffect(() => {
    const storedSkin = window.localStorage.getItem(SKIN_KEY);
    if (!isActiveSkin(storedSkin)) {
      window.localStorage.setItem(SKIN_KEY, DEFAULT_SKIN);
      setSkin(DEFAULT_SKIN);
      document.documentElement.dataset.skin = DEFAULT_SKIN;
    }
  }, []);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (savedTheme === 'day' || savedTheme === 'night') setTheme(savedTheme);

      const savedSkin = localStorage.getItem(SKIN_KEY);
      if (savedSkin && SKINS.includes(savedSkin as Skin)) {
        setSkin(savedSkin as Skin);
      } else if (savedSkin === 'grace-os') {
        localStorage.setItem(SKIN_KEY, 'archway');
        setSkin('archway');
      }
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
    try { localStorage.setItem(SKIN_KEY, nextSkin); } catch {}
  };

  const controls: SkinControls = {
    theme,
    skin,
    skins: SKINS,
    skinLabel: SKIN_LABEL,
    toggleTheme,
    chooseSkin,
  };

  return (
    <SkinControlsContext.Provider value={controls}>
      <SkinContext.Provider value={skin}>
        <div className="v2-scope" data-theme={theme} data-skin={skin}>
          {children}
        </div>
      </SkinContext.Provider>
    </SkinControlsContext.Provider>
  );
}
