'use client';

import { useEffect } from 'react';

export default function ViewportFix() {
  /* 键盘高度 → --kb */
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

  /* 清掉早先滚动还原留下的坐标 */
  useEffect(() => {
    try {
      Object.keys(sessionStorage)
        .filter((k) => k.startsWith('sr:'))
        .forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }, []);

  /* textarea 自适应高度 + 触觉反馈 */
  useEffect(() => {
    const onInput = (e: Event) => {
      const t = e.target as HTMLElement;
      if (!(t instanceof HTMLTextAreaElement)) return;
      t.style.height = 'auto';
      t.style.height = Math.min(t.scrollHeight, 132) + 'px';
      t.style.overflowY = t.scrollHeight > 132 ? 'auto' : 'hidden';
    };
    document.addEventListener('input', onInput, true);

    const probe = document.createElement('input');
    probe.type = 'checkbox';
    probe.setAttribute('switch', '');
    probe.style.cssText =
      'position:fixed;top:-99px;left:-99px;width:1px;height:1px;opacity:0;pointer-events:none;';
    document.body.appendChild(probe);

    const tap = () => {
      try {
        if (typeof navigator.vibrate === 'function') navigator.vibrate(8);
        probe.checked = !probe.checked;
        probe.dispatchEvent(new Event('change', { bubbles: true }));
      } catch {}
    };
    (window as unknown as { __haptic?: () => void }).__haptic = tap;

    const onDown = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (!el || !el.closest) return;
      if (el.closest('button, [role="button"], a[href]')) tap();
    };
    document.addEventListener('pointerdown', onDown, true);

    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('pointerdown', onDown, true);
      probe.remove();
    };
  }, []);

  return null;
}
