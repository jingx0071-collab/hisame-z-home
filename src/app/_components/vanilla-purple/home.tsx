'use client';

// Vanilla Purple / 香草天使 — hub home component (app shell + 4 tabs).
// Bottom-tab-bar app layout:
//   主页 · Home       — hero portrait + days together + love quote + angelcore night
//   房间 · Rooms      — 15 tarot rooms grid
//   日历 · Calendar   — milestones widget (birthdays + anniversary) + mood
//   设置 · Settings   — skin picker + theme toggle + credit
// Tab state lives in localStorage so a reload returns to the same tab.

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

type TabId = 'home' | 'rooms' | 'calendar' | 'settings';

const TAB_KEY = 'vp-active-tab';

const TABS: { id: TabId; cn: string; en: string }[] = [
  { id: 'home',     cn: '主页', en: 'Home' },
  { id: 'rooms',    cn: '房间', en: 'Rooms' },
  { id: 'calendar', cn: '日历', en: 'Calendar' },
  { id: 'settings', cn: '设置', en: 'Settings' },
];

// ---------- tiny tab-bar icons ----------
// 24×24 stroke-only. Match ornaments' stroke conventions.

function TabIconHome({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M 12 4 C 9 7, 6 9, 5 13 C 5 18, 10 21, 12 20 C 14 21, 19 18, 19 13 C 18 9, 15 7, 12 4 Z"
            stroke="currentColor" strokeWidth={active ? 1.5 : 1} strokeLinejoin="round"
            fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0}/>
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

function TabIconSettings({ active }: { active: boolean }) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth={active ? 1.4 : 1} fill="none" strokeLinejoin="round" strokeLinecap="round">
        <circle cx="12" cy="12" r="3.2"/>
        <path d="M 12 3 L 12 6 M 12 18 L 12 21 M 3 12 L 6 12 M 18 12 L 21 12
                 M 5.8 5.8 L 7.9 7.9 M 16.1 16.1 L 18.2 18.2
                 M 5.8 18.2 L 7.9 16.1 M 16.1 7.9 L 18.2 5.8"/>
      </g>
    </svg>
  );
}

function tabIcon(id: TabId, active: boolean) {
  if (id === 'home') return <TabIconHome active={active}/>;
  if (id === 'rooms') return <TabIconRooms active={active}/>;
  if (id === 'calendar') return <TabIconCalendar active={active}/>;
  return <TabIconSettings active={active}/>;
}

// ---------- tab bar ----------

function VpTabBar({ active, onSelect }: {
  active: TabId; onSelect: (id: TabId) => void;
}) {
  return (
    <nav className="vp-tab-bar" aria-label="Vanilla Purple navigation">
      {TABS.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            type="button"
            className={`vp-tab-btn${on ? ' is-active' : ''}`}
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(t.id)}
          >
            <span className="vp-tab-icon">{tabIcon(t.id, on)}</span>
            <span className="vp-tab-label">{t.cn}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ---------- Home tab: hero + days + quote + angelcore night ----------

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
      <div className="v2-caps" style={{
        textAlign: 'center', fontSize: '9px', color: 'var(--v2-gold)',
        marginTop: '10px', marginBottom: '10px',
      }}>
        + For Hisame +
      </div>

      <Link href="/chat" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
        <VpHero/>
        <div style={{ padding: '0 12px', marginTop: '-6px' }}>
          <DaysTogetherWidget/>
        </div>
      </Link>

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
    <div style={{ paddingTop: '18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginBottom: '18px',
      }}>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
        <span className="v2-caps" style={{ fontSize: '10px', color: 'var(--v2-ink-soft)' }}>
          Fifteen Rooms
        </span>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
      </div>
      <TarotGrid dividerVariant="diamond"/>
      <div style={{
        textAlign: 'center', padding: '18px 20px 8px',
      }}>
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

// ---------- Calendar tab: milestones + mood ----------

function CalendarTab() {
  return (
    <div style={{ paddingTop: '18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginBottom: '4px',
      }}>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
        <span className="v2-caps" style={{ fontSize: '10px', color: 'var(--v2-ink-soft)' }}>
          Calendar
        </span>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
      </div>

      <MilestonesWidget/>
      <MoodWidget/>
    </div>
  );
}

// ---------- Settings tab: skin picker + theme toggle + credit ----------

function SettingsTab() {
  const { theme, skins, skin, skinLabel, toggleTheme, chooseSkin } = useSkinControls();

  return (
    <div style={{ paddingTop: '18px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', marginBottom: '20px',
      }}>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
        <span className="v2-caps" style={{ fontSize: '10px', color: 'var(--v2-ink-soft)' }}>
          Settings
        </span>
        <div style={{ width: '30px', height: '1px', background: 'var(--v2-line)' }}/>
      </div>

      {/* Skin */}
      <div className="vp-settings-block">
        <div className="vp-settings-label">Skin · 皮肤</div>
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
      </div>

      {/* Theme */}
      <div className="vp-settings-block">
        <div className="vp-settings-label">Theme · 主题</div>
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

      {/* Credit */}
      <div style={{
        textAlign: 'center', padding: '40px 20px 12px',
      }}>
        <div className="v2-caps" style={{
          fontSize: '10px', color: 'var(--v2-gold)', marginBottom: '5px',
        }}>
          For Hisame
        </div>
        <div className="v2-script" style={{
          fontSize: '12px', color: 'var(--v2-ink-faint)', letterSpacing: '0.12em',
        }}>
          Angelcore · MMXXVI
        </div>
      </div>
    </div>
  );
}

// ---------- main shell ----------

function isTabId(v: unknown): v is TabId {
  return v === 'home' || v === 'rooms' || v === 'calendar' || v === 'settings';
}

export function VanillaPurpleHome() {
  const skin = useSkin();
  const [active, setActive] = useState<TabId>('home');

  // Restore last-visited tab from localStorage on mount.
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
    // Scroll the app-body back to top so each tab starts fresh.
    const body = document.querySelector<HTMLElement>('.app-body');
    if (body) body.scrollTop = 0;
  };

  if (skin !== 'vanilla-purple') return null;

  return (
    <main className="vanilla-purple-home">
      <div className="vp-tab-content">
        {active === 'home'     && <HomeTab/>}
        {active === 'rooms'    && <RoomsTab/>}
        {active === 'calendar' && <CalendarTab/>}
        {active === 'settings' && <SettingsTab/>}
      </div>
      <VpTabBar active={active} onSelect={select}/>
    </main>
  );
}
