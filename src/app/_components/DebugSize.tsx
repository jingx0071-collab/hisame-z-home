'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function DebugSize() {
  const pathname = usePathname();
  const [info, setInfo] = useState('');

  useEffect(() => {
    const q = (s: string) => document.querySelector(s) as HTMLElement | null;
    const h = (el: HTMLElement | null) =>
      el ? Math.round(el.getBoundingClientRect().height) : 0;

    const read = () => {
      const root = document.documentElement;
      const shell = q('.app-shell');
      const head = q('.app-header');
      const body = q('.app-body');
      const kid = (body?.firstElementChild as HTMLElement) || null;

      const rows = [
        `path   ${pathname}`,
        `appbar ${root.getAttribute('data-appbar') || '—'}`,
        `win    ${window.innerWidth}x${window.innerHeight}`,
        `doc    sh=${root.scrollHeight} y=${Math.round(window.scrollY)}`,
        shell
          ? `shell  h=${h(shell)} ${getComputedStyle(shell).position}`
          : 'shell  —',
        head ? `head   h=${h(head)} ${getComputedStyle(head).position}` : 'head   —',
        body
          ? `body   h=${h(body)} sh=${body.scrollHeight} y=${Math.round(body.scrollTop)}`
          : 'body   —',
        kid
          ? `kid    <${kid.tagName.toLowerCase()}.${(kid.className || '').split(' ')[0] || '?'}> h=${h(kid)}`
          : 'kid    —',
      ];
      setInfo(rows.join('\n'));
    };

    read();
    const timer = setInterval(read, 400);
    window.addEventListener('scroll', read, true);
    window.addEventListener('resize', read);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', read, true);
      window.removeEventListener('resize', read);
    };
  }, [pathname]);

  return (
    <pre
      style={{
        position: 'fixed',
        right: '6px',
        bottom: '6px',
        zIndex: 99999,
        background: 'rgba(0,0,0,0.8)',
        color: '#7CFFB2',
        font: '9px/1.35 ui-monospace, Menlo, monospace',
        padding: '6px 8px',
        margin: 0,
        borderRadius: '4px',
        pointerEvents: 'none',
        whiteSpace: 'pre',
      }}
    >
      {info}
    </pre>
  );
}
