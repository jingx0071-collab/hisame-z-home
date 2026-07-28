'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const EDGE = 28;       // 左边缘感应带
const TRIGGER = 0.32;  // 推过屏宽的这个比例才放手成立
const CANCEL_Y = 46;   // 竖向偏移超过这个判为滚动

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

    /* 门后那层暗影，制造纵深 */
    const backdrop = document.createElement('div');
    backdrop.style.cssText =
      'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:1;';
    document.body.appendChild(backdrop);

    const paint = (v: number, instant: boolean) => {
      const el = shell();
      if (!el) return;
      const w = window.innerWidth || 1;
      el.style.transition = instant
        ? 'none'
        : 'transform 280ms cubic-bezier(0.32,0.72,0,1)';
      el.style.transform = v ? `translate3d(${v}px,0,0)` : '';
      el.style.boxShadow = v ? '-10px 0 30px rgba(60,40,20,0.16)' : '';
      el.style.willChange = v ? 'transform' : '';
      backdrop.style.transition = instant ? 'none' : 'opacity 280ms ease';
      backdrop.style.opacity = v ? String(0.18 * (1 - v / w)) : '0';
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
      /* 全程跟手，不设上限，手指停哪门停哪 */
      dx = Math.max(0, t.clientX - startX);
      paint(dx, true);
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      const w = window.innerWidth || 1;

      if (dx > w * TRIGGER) {
        /* 推过界：整扇滑出去，落定之后才换页 */
        const el = shell();
        if (el) {
          el.style.transition = 'transform 240ms cubic-bezier(0.32,0.72,0,1)';
          el.style.transform = `translate3d(${w}px,0,0)`;
        }
        backdrop.style.transition = 'opacity 240ms ease';
        backdrop.style.opacity = '0';
        try {
          (window as unknown as { __haptic?: () => void }).__haptic?.();
        } catch {}
        setTimeout(() => {
          if (el) {
            el.style.transition = 'none';
            el.style.transform = '';
            el.style.boxShadow = '';
          }
          if (window.history.length > 1) router.back();
          else router.push('/');
        }, 230);
      } else {
        /* 没推够：滑回原位 */
        paint(0, false);
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
      backdrop.remove();
    };
  }, [pathname, router]);

  return null;
}
