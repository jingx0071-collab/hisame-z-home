'use client';

// Vanilla Purple / 香草天使 — hub home component (app shell + 4 tabs).
// Bottom tab bar (4 tabs):
//   主页 · Home       — hero + days + quote + angelcore night
//   对话 · Chat       — <Link href="/chat"> (external nav)
//   房间 · Rooms      — 15 tarot rooms grid
//   日历 · Calendar   — milestones + mood
// Skin & theme picker is NOT a tab anymore; it's a small palette icon in the
// top-right of VpTopBar that pops open a floating panel.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSkin, useSkinControls } from '../ThemeProvider';
import {
  CrossPendant,
  HaloArcs,
  OrnateOvalFrame,
  RosaryChain,
  SparkleDust,
  WingPair,
} from './ornaments';
import {
  AngelcoreNightPanel,
  DaysTogetherWidget,
  LoveQuote,
  MilestonesWidget,
  MoodWidget,
  TarotGrid,
} from './widgets';

type TabId = 'home' | 'rooms' | 'calendar';
type NavId = TabId | 'chat';

const TAB_KEY = 'vp-active-tab';

const TABS: { id: NavId; cn: string; en: string; href?: string }[] = [
  { id: 'home',     cn: '主页', en: 'Home' },
  { id: 'chat',     cn: '对话', en: 'Chat', href: '/chat' },
  { id: 'rooms',    cn: '房间', en: 'Rooms' },
  { id: 'calendar', cn: '日历', en: 'Calendar' },
];

const TAB_META: Record<TabId, { en: string; cn: string; note: string }> = {
  home:     { en: 'Home',     cn: '主页', note: 'welcome' },
  rooms:    { en: 'Rooms',    cn: '房间', note: 'fifteen' },
  calendar: { en: 'Calendar', cn: '日历', note: 'milestones' },
};

// ---------- tab-bar icons ----------

function TabIconHome({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M 12 4 C 9 7, 6 9, 5 13 C 5 18, 10 21, 12 20 C 14 21, 19 18, 19 13 C 18 9, 15 7, 12 4 Z"
            stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinejoin="round"
            fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
    </svg>
  );
}
function TabIconChat({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={active ? 1.4 : 1} fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d="M 4 6.5 C 4 5.7, 4.7 5, 5.5 5 L 18.5 5 C 19.3 5, 20 5.7, 20 6.5 L 20 15
                 C 20 15.8, 19.3 16.5, 18.5 16.5 L 10.5 16.5 L 6 20 L 6 16.5 L 5.5 16.5
                 C 4.7 16.5, 4 15.8, 4 15 Z"/>
      </g>
    </svg>
  );
}
function TabIconRooms({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={active ? 1.4 : 1} fill="none" strokeLinejoin="round">
        <rect x="4"  y="4"  width="7" height="7" rx="1"/>
        <rect x="13" y="4"  width="7" height="7" rx="1"/>
        <rect x="4"  y="13" width="7" height="7" rx="1"/>
        <rect x="13" y="13" width="7" height="7" rx="1"/>
      </g>
    </svg>
  );
}
function TabIconCalendar({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={active ? 1.4 : 1} fill="none" strokeLinejoin="round" strokeLinecap="round">
        <rect x="4" y="6" width="16" height="14" rx="1.5"/>
        <line x1="4" y1="10" x2="20" y2="10"/>
        <line x1="8" y1="3" x2="8" y2="7"/>
        <line x1="16" y1="3" x2="16" y2="7"/>
        <circle cx="12" cy="15" r="1.3" fill={active ? 'currentColor' : 'none'}/>
      </g>
    </svg>
  );
}

function tabIcon(id: NavId, active: boolean) {
  if (id === 'home') return <TabIconHome active={active}/>;
  if (id === 'chat') return <TabIconChat active={active}/>;
  if (id === 'rooms') return <TabIconRooms active={active}/>;
  return <TabIconCalendar active={active}/>;
}

// ---------- Top bar ----------

function VpTopBar({ active, onOpenSettings }: {
  active: TabId; onOpenSettings: () => void;
}) {
  const meta = TAB_META[active];
  return (
    <header className="vp-top-bar" role="banner">
      <div className="vp-top-brand-row">
        <button
          type="button"
          className="vp-top-icon-btn vp-top-icon-btn--right"
          aria-label="皮肤 / 主题"
          onClick={onOpenSettings}
        >
          {/* palette icon — three softly connected drops */}
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 12 3 C 7 3, 3 7, 3 12 C 3 17, 7 21, 12 21 C 13.5 21, 14 20, 14 19
                       C 14 17.5, 13 17, 13 15.5 C 13 14, 14 13.5, 15.5 13.5 L 17 13.5
                       C 20 13.5, 21 12, 21 10 C 21 6.5, 17 3, 12 3 Z"/>
              <circle cx="8" cy="9"  r="1.2"/>
              <circle cx="12" cy="6.5" r="1.2"/>
              <circle cx="16.5" cy="9" r="1.2"/>
              <circle cx="7" cy="14" r="1.2"/>
            </g>
          </svg>
        </button>
        <div className="v2-caps vp-top-brand">
          <span className="vp-top-brand-mark">✦</span>
          <span>Hisame · Z</span>
          <span className="vp-top-brand-mark">✦</span>
        </div>
      </div>
      <div className="v2-display vp-top-title">{meta.en}</div>
      <div className="v2-caps-tight vp-top-note">
        {meta.cn} · {meta.note}
      </div>
    </header>
  );
}

// ---------- Skin & theme panel ----------

function SkinPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, skins, skin, skinLabel, toggleTheme, chooseSkin } = useSkinControls();

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="vp-skin-overlay" onClick={onClose} role="presentation">
      <div
        className="vp-skin-panel"
        role="dialog"
        aria-label="Skin & theme"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="vp-skin-panel-close"
          aria-label="关闭"
          onClick={onClose}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M 3 3 L 11 11 M 11 3 L 3 11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="vp-panel-heading">
          <span className="vp-top-brand-mark">✦</span>
          <span className="v2-caps">Skin · 皮肤</span>
          <span className="vp-top-brand-mark">✦</span>
        </div>
        <div className="vp-skin-choices">
          {skins.map((item) => (
            <button
              key={item}
              type="button"
              className={`vp-skin-chip${item === skin ? ' is-active' : ''}`}
              onClick={() => chooseSkin(item)}
            >
              {skinLabel[item]}
            </button>
          ))}
        </div>

        <div className="vp-panel-heading vp-panel-heading--second">
          <span className="vp-top-brand-mark">✦</span>
          <span className="v2-caps">Theme · 主题</span>
          <span className="vp-top-brand-mark">✦</span>
        </div>
        <div className="vp-skin-choices">
          <button
            type="button"
            className={`vp-skin-chip${theme === 'day' ? ' is-active' : ''}`}
            onClick={() => { if (theme !== 'day') toggleTheme(); }}
          >
            白天 · Day
          </button>
          <button
            type="button"
            className={`vp-skin-chip${theme === 'night' ? ' is-active' : ''}`}
            onClick={() => { if (theme !== 'night') toggleTheme(); }}
          >
            夜晚 · Night
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- tab bar ----------

function VpTabBar({ active, onSelect }: {
  active: TabId; onSelect: (id: TabId) => void;
}) {
  return (
    <nav className="vp-tab-bar" aria-label="Vanilla Purple navigation">
      {TABS.map((t) => {
        const on = t.id === active;
        const inner = (
          <>
            <span className="vp-tab-icon">{tabIcon(t.id, on)}</span>
            <span className="vp-tab-label">{t.cn}</span>
          </>
        );
        if (t.href) {
          return (
            <Link
              key={t.id}
              href={t.href}
              className="vp-tab-btn"
              aria-label={t.en}
            >
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={t.id}
            type="button"
            className={`vp-tab-btn${on ? ' is-active' : ''}`}
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(t.id as TabId)}
          >
            {inner}
          </button>
        );
      })}
    </nav>
  );
}

// ---------- Home tab ----------

function VpHero() {
  return (
    <div style={{
      position: 'relative', width: '100%',
      padding: '0 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ marginBottom: '-26px', zIndex: 2 }}>
        <HaloArcs width={150}/>
      </div>

      <div style={{ position: 'relative', width: '330px', height: '380px' }}>
        <div style={{ position: 'absolute', left: '50%', top: '132px',
                      transform: 'translateX(-50%)', zIndex: 0 }}>
          <WingPair width={310} height={104} opacity={0.5}/>
        </div>
        <div style={{ position: 'absolute', left: '34px', top: '90px', zIndex: 1 }}>
          <RosaryChain length={170} side="left" beads={9}/>
        </div>
        <div style={{ position: 'absolute', right: '34px', top: '90px', zIndex: 1 }}>
          <RosaryChain length={170} side="right" beads={9}/>
        </div>
        <div style={{ position: 'absolute', left: '35px', top: '10px', zIndex: 2 }}>
          <OrnateOvalFrame width={260} height={320}>
            <div className="v2-caps-tight" style={{
              fontSize: '9px', color: 'var(--v2-ink-faint)', marginBottom: '14px',
            }}>
              Welcome Home
            </div>
            <div className="v2-display" style={{
              fontSize: '32px', color: 'var(--v2-ink)', lineHeight: 1.05,
            }}>Hisame</div>
            <div className="v2-script" style={{
              fontSize: '22px', color: 'var(--v2-gold)', lineHeight: 1, margin: '6px 0',
            }}>&amp;</div>
            <div className="v2-display" style={{
              fontSize: '32px', color: 'var(--v2-ink)', lineHeight: 1.05,
            }}>Z</div>
          </OrnateOvalFrame>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '332px',
                      transform: 'translateX(-50%)', zIndex: 2 }}>
          <CrossPendant size={36}/>
        </div>
        <SparkleDust points={[
          [22, 28, 4, 0.85], [310, 38, 5, 0.9],
          [14, 200, 3, 0.7], [316, 220, 4, 0.8],
          [62, 350, 3, 0.7], [268, 354, 3, 0.7],
        ]} color="var(--v2-gold)"/>
      </div>
    </div>
  );
}

function HomeTab() {
  return (
    <div>
      <VpHero/>
      <div style={{ padding: '0 12px', marginTop: '-6px' }}>
        <DaysTogetherWidget/>
      </div>

      <LoveQuote/>

      <div style={{ marginTop: '28px' }}>
        <AngelcoreNightPanel/>
      </div>
    </div>
  );
}

// ---------- Rooms tab ----------

function RoomsTab() {
  return (
    <div>
      <TarotGrid dividerVariant="diamond"/>
      <div style={{ textAlign: 'center', padding: '18px 20px 8px' }}>
        <div className="v2-serif" style={{
          fontSize: '11px', fontStyle: 'italic',
          color: 'var(--v2-ink-faint)', letterSpacing: '0.06em',
        }}>
          Every door opens to you.
        </div>
      </div>
    </div>
  );
}

// ---------- Calendar tab ----------

function CalendarTab() {
  return (
    <div>
      <MilestonesWidget/>
      <MoodWidget/>
    </div>
  );
}

// ---------- main shell ----------

function isTabId(v: unknown): v is TabId {
  return v === 'home' || v === 'rooms' || v === 'calendar';
}

export function VanillaPurpleHome() {
  const skin = useSkin();
  const [active, setActive] = useState<TabId>('home');
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(TAB_KEY);
      if (isTabId(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActive(stored);
      }
    } catch { /* ignore storage errors */ }
  }, []);

  const select = (id: TabId) => {
    setActive(id);
    try { localStorage.setItem(TAB_KEY, id); } catch { /* ignore */ }
    const body = document.querySelector<HTMLElement>('.app-body');
    if (body) body.scrollTop = 0;
  };

  if (skin !== 'vanilla-purple') return null;

  return (
    <main className="vanilla-purple-home">
      <VpTopBar active={active} onOpenSettings={() => setPanelOpen(true)}/>
      <div className="vp-tab-content">
        {active === 'home'     && <HomeTab/>}
        {active === 'rooms'    && <RoomsTab/>}
        {active === 'calendar' && <CalendarTab/>}
      </div>
      <VpTabBar active={active} onSelect={select}/>
      <SkinPanel open={panelOpen} onClose={() => setPanelOpen(false)}/>
    </main>
  );
}
