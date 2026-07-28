'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type T = { en: string; cn: string };

const TITLES: Record<string, T> = {
  '/seminar':       { en: 'Seminar',   cn: '讲堂' },
  '/health':        { en: 'Health',    cn: '医疗' },
  '/memory':        { en: 'Memory',    cn: '记忆' },
  '/calendar':      { en: 'Calendar',  cn: '日历' },
  '/music':         { en: 'Music',     cn: '听歌' },
  '/box':           { en: 'Keepsakes', cn: '藏物阁' },
  '/navi':          { en: 'Navi',      cn: '导航' },
  '/call':          { en: 'Call',      cn: '通话' },
  '/nearby':        { en: 'Nearby',    cn: '附近' },
  '/backstage':     { en: 'Backstage', cn: '后台' },
  '/anfang':        { en: 'Anfang',    cn: '安房' },
  '/chat':          { en: 'Chats',     cn: '对话' },
  '/chat/messages': { en: 'Messages',  cn: '短信' },
  '/daily':         { en: 'Diary',     cn: '日常' },
  '/tangents':      { en: 'Memo',      cn: '碎碎念' },
  '/training':      { en: 'Training',  cn: '调教' },
  '/deeptalk':      { en: 'Deeptalk',  cn: '促膝' },
  '/study':         { en: 'Study',     cn: '书房' },
  '/feast':         { en: 'Feast',     cn: '餐桌' },
  '/shopping':      { en: 'Shopping',  cn: '采买' },
  '/eat':           { en: 'Eat',       cn: '吃饭' },
  '/april20':       { en: 'April 20',  cn: '领证日' },
  '/july1':         { en: 'July 1',    cn: '生日' },
};

function lookup(path: string): { title: T; parent: string } | null {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/') return null;
  if (TITLES[clean]) {
    const seg = clean.split('/').filter(Boolean);
    const parent = seg.length > 1 ? '/' + seg.slice(0, -1).join('/') : '/';
    return { title: TITLES[clean], parent };
  }
  const seg = clean.split('/').filter(Boolean);
  for (let i = seg.length - 1; i > 0; i--) {
    const base = '/' + seg.slice(0, i).join('/');
    if (TITLES[base]) return { title: TITLES[base], parent: base };
  }
  return null;
}

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const hit = lookup(pathname);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (hit) root.setAttribute('data-appbar', 'on');
    else root.removeAttribute('data-appbar');
    return () => root.removeAttribute('data-appbar');
  }, [hit, pathname]);

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
        onClick={() => router.push(hit.parent)}
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
