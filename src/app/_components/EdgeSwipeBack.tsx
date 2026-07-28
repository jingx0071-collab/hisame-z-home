'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const EDGE = 26;        // 左边缘感应带宽度
const TRIGGER = 72;     // 触发返回的横向距离
const MAX_DRAG = 130;   // 跟手位移上限
const CANCEL_Y = 44;    // 竖向偏移超过这个就判定为滚动

export default function EdgeSwipeBack() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/') return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let dx = 0;

    const shell = () => document.querySelector('.app-shell') as HTMLElement | null;

    const paint = (v: number, instant: boolean) => {
      const el = shell();
      if (!el) return;
      el.style.transition = instant
        ? 'none'
        : 'transform 240ms cubic-bezier(0.32,0.72,0,1), opacity 240ms ease';
      el.style.transform = v ? `translateX(${v}px)` : '';
      el.style.opacity = v ? String(1 - Math.min(v, MAX_DRAG) / 520) : '';
    };

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t || t.clientX > EDGE) return;
      startX = t.clientX;
      startY = t.clientY;
      dx = 0;
      tracking = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!tracking) return;
      const t = e.touches[0];
      if (!t) return;
      if (Math.abs(t.clientY - startY) > CANCEL_Y) {
        tracking = false;
        paint(0, false);
        return;
      }
      dx = Math.max(0, t.clientX - startX);
      paint(Math.min(dx, MAX_DRAG), true);
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const fired = dx > TRIGGER;
      paint(0, true);

      if (fired) {
        const el = shell();
        if (el) {
          el.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
          el.style.transform = 'translateX(60px)';
          el.style.opacity = '0';
        }
        try {
          (window as unknown as { __haptic?: () => void }).__haptic?.();
        } catch {}
        setTimeout(() => {
          if (el) {
            el.style.transition = 'none';
            el.style.transform = '';
            el.style.opacity = '';
          }
          if (window.history.length > 1) router.back();
          else router.push('/');
        }, 170);
      } else {
        requestAnimationFrame(() => paint(0, false));
      }
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      paint(0, true);
    };
  }, [pathname, router]);

  return null;
}
