'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const NO_RESTORE = ['/chat', '/training/', '/deeptalk/', '/tangents/', '/daily', '/call'];

export default function ViewportFix() {
  const pathname = usePathname();

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb', kb > 24 ? kb + 'px' : '0px');
    };
    apply();
    vv.addEventListener('resize', apply);
    vv.addEventListener('scroll', apply);
    return () => {
      vv.removeEventListener('resize', apply);
      vv.removeEventListener('scroll', apply);
    };
  }, []);

  useEffect(() => {
    if (NO_RESTORE.some((p) => pathname.startsWith(p))) return;

    const KEY = 'sr:' + pathname;
    let el: HTMLElement | null = null;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;

    const findScroller = (): HTMLElement | null => {
      const root = document.querySelector('main') || document.body;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>('div, section, main, ul'));
      let best: HTMLElement | null = null;
      for (const n of nodes) {
        const oy = getComputedStyle(n).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 48) {
          if (!best || n.scrollHeight > best.scrollHeight) best = n;
        }
      }
      return best;
    };

    const restore = setTimeout(() => {
      el = findScroller();
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return;
      const y = parseInt(raw, 10);
      if (Number.isNaN(y) || y <= 0) return;
      if (el) el.scrollTop = y;
      else window.scrollTo(0, y);
    }, 140);

    const save = () => {
      const target = el || findScroller();
      const y = target ? target.scrollTop : window.scrollY;
      if (y > 0) sessionStorage.setItem(KEY, String(y));
    };

    const onScroll = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(save, 220);
    };

    window.addEventListener('scroll', onScroll, true);
    return () => {
      clearTimeout(restore);
      if (saveTimer) clearTimeout(saveTimer);
      save();
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [pathname]);

  return null;
}
