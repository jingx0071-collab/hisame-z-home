'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { haptic } from '../../lib/haptics';
import { useSkin } from './ThemeProvider';
import { lookup } from '../../lib/app-nav';


export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const skin = useSkin();
  const hit = lookup(pathname, skin);
  const parent = hit?.parent;

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (lookup(pathname, skin)) root.setAttribute('data-appbar', 'on');
    else root.removeAttribute('data-appbar');
  }, [pathname, skin]);

  /* 换页归零：真正在滚的是 .app-body，不是页面本身 */
  useEffect(() => {
    const zero = () => {
      const body = document.querySelector('.app-body') as HTMLElement | null;
      if (body) body.scrollTop = 0;
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document
        .querySelectorAll<HTMLElement>('[data-room-scroll], .health-body, .seminar-body')
        .forEach((el) => {
          el.scrollTop = 0;
        });
    };
    zero();
    const r = requestAnimationFrame(zero);
    const t = setTimeout(zero, 60);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [pathname]);

  useEffect(() => {
    setScrolled(false);
    let raf = 0;
    const read = (e: Event) => {
      const t = e.target as HTMLElement | Document | null;
      const y =
        t && t instanceof HTMLElement ? t.scrollTop : window.scrollY || 0;
      setScrolled(y > 10);
    };
    const onScroll = (e: Event) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        read(e);
      });
    };
    window.addEventListener('scroll', onScroll, true);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [pathname]);

  if (!hit) return null;

  return (
    <header className="app-header" data-scrolled={scrolled ? 'true' : 'false'}>
      <button
        className="app-header-back"
        aria-label="返回"
        onClick={() => { haptic.tap(); router.push(parent || '/'); }}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5L8 12l7 7" stroke="currentColor" strokeWidth="1.7"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="app-header-title">
        <span className="app-header-en">{hit.title.en}</span>
        <span className="app-header-cn">{hit.title.cn}</span>
      </div>

      <div className="app-header-slot" />
    </header>
  );
}
