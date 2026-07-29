'use client';
import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { haptic } from '../../lib/haptics';

const HIT = 'button, a, [role="button"], [class*="card"], [class*="Card"], [class*="key"], [class*="btn"], .grace-window-chrome, .heisei-softkeys *';

export default function GlobalTapHaptics() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('.app-header-back')) return;
      if (t.closest(HIT)) haptic.tap();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);
  return null;
}
