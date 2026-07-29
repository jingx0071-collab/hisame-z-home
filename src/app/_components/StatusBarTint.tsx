'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// 深色背景的房间 → 状态栏用浅色图标(Style.Light)；其余浅底 → 深色图标(Style.Dark)
// 宝宝确认哪些房是深底，往这里加路径即可
const DARK_ROUTES: string[] = [
  '/seminar',
  // '/anfang', '/backstage',
];

export default function StatusBarTint() {
  const pathname = usePathname();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    const clean = pathname.replace(/\/+$/, '') || '/';
    const isDark = DARK_ROUTES.some((r) => clean === r || clean.startsWith(r + '/'));
    // 只改图标明暗，绝不碰 setOverlaysWebView —— 守护 env() 安全区让位
    StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark }).catch(() => {});
  }, [pathname]);
  return null;
}
