'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export default function AppLifecycle() {
  const router = useRouter();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let offState: (() => void) | undefined;
    let offUrl: (() => void) | undefined;

    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) router.refresh();
    }).then((h) => { offState = () => h.remove(); });

    App.addListener('appUrlOpen', (event) => {
      try {
        const u = new URL(event.url);
        if (u.pathname) router.push(u.pathname + u.search);
      } catch { /* 忽略无法解析的深链接 */ }
    }).then((h) => { offUrl = () => h.remove(); });

    return () => { offState?.(); offUrl?.(); };
  }, [router]);
  return null;
}
