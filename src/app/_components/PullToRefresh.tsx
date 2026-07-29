'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { haptic } from '../../lib/haptics';

export default function PullToRefresh() {
  const router = useRouter();
  const [, force] = useState(0);
  const pull = useRef(0);
  const refreshing = useRef(false);
  const startY = useRef(0);
  const active = useRef(false);
  const THRESHOLD = 70;
  const rerender = () => force((x) => x + 1);

  useEffect(() => {
    const body = document.querySelector('.app-body') as HTMLElement | null;
    if (!body) return;
    const onStart = (e: TouchEvent) => {
      if (body.scrollTop <= 0 && !refreshing.current) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      }
    };
    const onMove = (e: TouchEvent) => {
      if (!active.current || refreshing.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && body.scrollTop <= 0) {
        pull.current = Math.min(dy * 0.5, 120);
        if (pull.current > 5) e.preventDefault();
        rerender();
      } else {
        active.current = false;
        pull.current = 0;
        rerender();
      }
    };
    const onEnd = () => {
      if (!active.current) return;
      active.current = false;
      if (pull.current >= THRESHOLD && !refreshing.current) {
        refreshing.current = true;
        pull.current = THRESHOLD;
        rerender();
        haptic.tap();
        router.refresh();
        window.setTimeout(() => {
          refreshing.current = false;
          pull.current = 0;
          rerender();
        }, 900);
      } else {
        pull.current = 0;
        rerender();
      }
    };
    body.addEventListener('touchstart', onStart, { passive: true });
    body.addEventListener('touchmove', onMove, { passive: false });
    body.addEventListener('touchend', onEnd, { passive: true });
    body.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      body.removeEventListener('touchstart', onStart);
      body.removeEventListener('touchmove', onMove);
      body.removeEventListener('touchend', onEnd);
      body.removeEventListener('touchcancel', onEnd);
    };
  }, [router]);

  const p = pull.current;
  const spin = refreshing.current;
  return (
    <div style={{
      position: 'fixed', top: 'env(safe-area-inset-top, 0px)',
      left: 0, right: 0, height: p,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      pointerEvents: 'none', zIndex: 50, overflow: 'hidden',
      transition: active.current ? 'none' : 'height 0.25s ease',
    }}>
      <div style={{
        marginBottom: 8, width: 22, height: 22, borderRadius: '50%',
        border: '2px solid var(--v2-gold-cool, #b8a064)',
        borderTopColor: 'transparent',
        opacity: Math.min(p / 70, 1),
        transform: spin ? undefined : `rotate(${p * 3}deg)`,
        animation: spin ? 'ptr-spin 0.7s linear infinite' : undefined,
      }} />
      <style>{`@keyframes ptr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
