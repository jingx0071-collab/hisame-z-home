'use client';
import { useEffect, useState } from 'react';

export default function DebugSize() {
  const [t, setT] = useState('');
  useEffect(() => {
    const probe = document.createElement('div');
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;pointer-events:none;visibility:hidden;height:env(safe-area-inset-top,0px);';
    document.body.appendChild(probe);
    const read = () => {
      const envTop = probe.getBoundingClientRect().height;
      const shell = document.querySelector('.app-shell') as HTMLElement | null;
      const head = document.querySelector('.app-header') as HTMLElement | null;
      const body = document.querySelector('.app-body') as HTMLElement | null;
      setT(
        [
          `env=${envTop}`,
          `win=${window.innerWidth}x${window.innerHeight}`,
          `shell=${shell?.offsetHeight ?? '-'}`,
          `head=${head?.offsetHeight ?? '-'}`,
          `body=${body?.offsetHeight ?? '-'} sh=${body?.scrollHeight ?? '-'} st=${body?.scrollTop ?? '-'}`,
        ].join(' | ')
      );
    };
    read();
    const id = setInterval(read, 500);
    window.addEventListener('resize', read);
    return () => {
      clearInterval(id);
      window.removeEventListener('resize', read);
      probe.remove();
    };
  }, []);
  return (
    <div
      style={{
        position: 'fixed',
        right: 4,
        bottom: 4,
        zIndex: 99999,
        background: '#000',
        color: '#0f0',
        font: '9px/1.3 ui-monospace,monospace',
        padding: '3px 5px',
        borderRadius: 4,
        pointerEvents: 'none',
        maxWidth: '96vw',
      }}
    >
      {t}
    </div>
  );
}
