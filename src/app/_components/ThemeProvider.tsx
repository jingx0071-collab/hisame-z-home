'use client';

import { useState, useEffect, createContext, useContext } from 'react';

const THEME_KEY = 'v2-theme';
const SKIN_KEY = 'v2-skin';

export type Skin = 'archway' | 'grace-os' | 'white-gothic' | 'hisame-signal';

const SKINS: Skin[] = ['archway', 'white-gothic', 'hisame-signal'];

const SKIN_LABEL: Record<Skin, string> = {
  archway: '月下亭台',
  'grace-os': '绯雨小居',
  'white-gothic': '白祷圣窗',
  'hisame-signal': '平成翻盖小手机',
};

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
