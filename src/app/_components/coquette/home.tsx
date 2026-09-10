'use client';

// Coquette / 法式甜心 — dedicated hub home component.
// A self-contained presentational home for the coquette skin. Mirrors the
// vanilla-purple pattern: fixed top bar + scrollable content + floating skin
// panel, links out to the same real routes every skin uses. Adds nothing to
// state/data/routing — it only renders.
//
// Asset pack lives in /skins/coquette/ (five categories from the material pack):
//   01_backgrounds  soft_pink_lace   → hero backdrop
//   02_icons        bow/heart/…      → section + brand ornaments
//   03_decorations  lace_divider …   → dividers / hero frame / banner
//   04_empty_states empty_*          → CqEmptyState illustrations
//   05_textures     lace_tile/satin  → top-bar + footer texture
// All CSS is scoped to .v2-scope[data-skin='coquette'] in globals.css.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSkin, useSkinControls } from '../ThemeProvider';

const A = '/skins/coquette';

// Rooms — same set + order the rest of the app uses (see rooms.ts / page.tsx),
// kept local so coquette depends on no other skin's files.
type CqRoom = { roman: string; title: string; cn: string; href: string };
const CQ_ROOMS: CqRoom[] = [
  { roman: 'I',    title: 'Seminar',   cn: '讲堂', href: '/seminar' },
  { roman: 'II',   title: 'Health',    cn: '健康', href: '/health' },
  { roman: 'III',  title: 'Memory',    cn: '记忆', href: '/memory' },
  { roman: 'IV',   title: 'Calendar',  cn: '日历', href: '/calendar' },
  { roman: 'V',    title: 'Music',     cn: '听歌', href: '/music' },
  { roman: 'VI',   title: 'Box',       cn: '铁盒', href: '/box' },
  { roman: 'VII',  title: 'Navi',      cn: '导航', href: '/navi' },
  { roman: 'VIII', title: 'Call',      cn: '通话', href: '/call' },
  { roman: 'IX',   title: 'Nearby',    cn: '附近', href: '/nearby' },
  { roman: 'X',    title: 'Backstage', cn: '后台', href: '/backstage' },
  { roman: 'XI',   title: 'Anfang',    cn: '安房', href: '/anfang' },
  { roman: 'XII',  title: 'Pulse',     cn: '脉搏', href: '/pulse' },
  { roman: 'XIII', title: 'Feast',     cn: '食记', href: '/feast' },
  { roman: 'XIV',  title: 'Closet',    cn: '衣橱', href: '/closet' },
  { roman: 'XV',   title: 'Drive',     cn: '驾',   href: '/car' },
];

// ---------- top bar ----------

function CqTopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="cq-top-bar" role="banner">
      <div className="cq-top-brand-row">
        <button
          type="button"
          className="cq-top-icon-btn"
          aria-label="皮肤 / 主题"
          onClick={onOpenSettings}
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <g stroke="currentColor" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 12 3 C 7 3, 3 7, 3 12 C 3 17, 7 21, 12 21 C 13.5 21, 14 20, 14 19
                       C 14 17.5, 13 17, 13 15.5 C 13 14, 14 13.5, 15.5 13.5 L 17 13.5
                       C 20 13.5, 21 12, 21 10 C 21 6.5, 17 3, 12 3 Z"/>
              <circle cx="8" cy="9" r="1.2"/>
              <circle cx="12" cy="6.5" r="1.2"/>
              <circle cx="16.5" cy="9" r="1.2"/>
              <circle cx="7" cy="14" r="1.2"/>
            </g>
          </svg>
        </button>
        <div className="cq-top-brand">
          <span className="cq-top-brand-mark">✦</span>
          <span>Hisame · Z</span>
          <span className="cq-top-brand-mark">✦</span>
        </div>
      </div>
      <div className="cq-top-title">Coquette</div>
      <div className="cq-top-note">法式甜心 · atelier</div>
    </header>
  );
}

// ---------- skin & theme panel (mirrors the vanilla-purple picker) ----------

function CqSkinPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, skins, skin, skinLabel, toggleTheme, chooseSkin } = useSkinControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="cq-skin-overlay" onClick={onClose} role="presentation">
      <div
        className="cq-skin-panel"
        role="dialog"
        aria-label="Skin & theme"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cq-skin-panel-close" aria-label="关闭" onClick={onClose}>
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M 3 3 L 11 11 M 11 3 L 3 11" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="cq-panel-heading">
          <span className="cq-top-brand-mark">✦</span>
          <span>Skin · 皮肤</span>
          <span className="cq-top-brand-mark">✦</span>
        </div>
        <div className="cq-skin-choices">
          {skins.map((item) => (
            <button
              key={item}
              type="button"
              className={`cq-skin-chip${item === skin ? ' is-active' : ''}`}
              onClick={() => chooseSkin(item)}
            >
              {skinLabel[item]}
            </button>
          ))}
        </div>

        <div className="cq-panel-heading cq-panel-heading--second">
          <span className="cq-top-brand-mark">✦</span>
          <span>Theme · 主题</span>
          <span className="cq-top-brand-mark">✦</span>
        </div>
        <div className="cq-skin-choices">
          <button
            type="button"
            className={`cq-skin-chip${theme === 'day' ? ' is-active' : ''}`}
            onClick={() => { if (theme !== 'day') toggleTheme(); }}
          >
            白天 · Day
          </button>
          <button
            type="button"
            className={`cq-skin-chip${theme === 'night' ? ' is-active' : ''}`}
            onClick={() => { if (theme !== 'night') toggleTheme(); }}
          >
            夜晚 · Night
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- pieces ----------

function CqDivider() {
  return (
    <div className="cq-divider" aria-hidden="true">
      <img src={`${A}/03_decorations/lace_divider.png`} alt="" />
    </div>
  );
}

function CqHero() {
  return (
    <section className="cq-hero">
      <div className="cq-hero-bg" aria-hidden="true" />
      <img className="cq-hero-bow" src={`${A}/02_icons/bow.png`} alt="" aria-hidden="true" />
      <div className="cq-hero-frame">
        <img className="cq-hero-frame-img" src={`${A}/03_decorations/pearl_frame.png`} alt="" aria-hidden="true" />
        <div className="cq-hero-monogram">
          <div className="cq-hero-welcome">Welcome Home</div>
          <div className="cq-hero-name">Hisame</div>
          <div className="cq-hero-amp">&amp;</div>
          <div className="cq-hero-name">Z</div>
        </div>
      </div>
      <div className="cq-hero-banner">
        <img src={`${A}/03_decorations/ribbon_banner.png`} alt="" aria-hidden="true" />
        <span className="cq-hero-banner-text">mon amour</span>
      </div>
    </section>
  );
}

function CqRoomGrid() {
  return (
    <section className="cq-section">
      <div className="cq-section-head">
        <img className="cq-section-icon" src={`${A}/02_icons/cherries.png`} alt="" aria-hidden="true" />
        <div className="cq-section-title">Rooms</div>
        <div className="cq-section-sub">房间</div>
      </div>
      <div className="cq-room-grid">
        {CQ_ROOMS.map((r) => (
          <Link key={r.href} href={r.href} className="cq-room-card">
            <span className="cq-room-roman">{r.roman}</span>
            <span className="cq-room-title">{r.title}</span>
            <span className="cq-room-cn">{r.cn}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function CqChatRooms() {
  const rooms = [
    { roman: 'I',   href: '/chat/messages', en: 'Messages', cn: '短信',   sub: 'main line',     glyph: '♥' },
    { roman: 'II',  href: '/daily',         en: 'Daily',    cn: '日记',   sub: 'today page',    glyph: '✦' },
    { roman: 'III', href: '/tangents',      en: 'Tangents', cn: '碎碎念', sub: 'side thoughts', glyph: '❀' },
    { roman: 'IV',  href: '/deeptalk',      en: 'DeepTalk', cn: '深谈',   sub: 'quiet room',    glyph: '†' },
    { roman: 'V',   href: '/training',      en: 'Training', cn: '调教室', sub: 'private class', glyph: '✧' },
  ];
  return (
    <section className="cq-section">
      <div className="cq-section-head">
        <img className="cq-section-icon" src={`${A}/02_icons/ribbon.png`} alt="" aria-hidden="true" />
        <div className="cq-section-title">Chat</div>
        <div className="cq-section-sub">对话</div>
      </div>
      <nav className="cq-chat-list" aria-label="对话房间">
        {rooms.map((r) => (
          <Link key={r.href} href={r.href} className="cq-chat-row">
            <span className="cq-chat-roman">{r.roman}</span>
            <span className="cq-chat-glyph" aria-hidden="true">{r.glyph}</span>
            <span className="cq-chat-body">
              <span className="cq-chat-en">{r.en}</span>
              <span className="cq-chat-cn">{r.cn} · {r.sub}</span>
            </span>
            <span className="cq-chat-chev" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M 5 3 L 9 7 L 5 11" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        ))}
      </nav>
    </section>
  );
}

// The component the empty-state illustrations connect to.
function CqEmptyState({
  illo, title, subtitle, href, cta,
}: {
  illo: string; title: string; subtitle: string; href: string; cta: string;
}) {
  return (
    <div className="cq-empty">
      <img className="cq-empty-illo" src={illo} alt="" aria-hidden="true" />
      <div className="cq-empty-title">{title}</div>
      <div className="cq-empty-sub">{subtitle}</div>
      <Link href={href} className="cq-empty-action">{cta}</Link>
    </div>
  );
}

function CqKeepsakes() {
  return (
    <section className="cq-section">
      <div className="cq-section-head">
        <img className="cq-section-icon" src={`${A}/02_icons/pearl.png`} alt="" aria-hidden="true" />
        <div className="cq-section-title">Keepsakes</div>
        <div className="cq-section-sub">信匣</div>
      </div>
      <div className="cq-empty-grid">
        <CqEmptyState
          illo={`${A}/04_empty_states/empty_tea_letter.png`}
          title="还没有信"
          subtitle="写下的第一句话会停在这里，等你翻回来看。"
          href="/chat"
          cta="去写一封 →"
        />
        <CqEmptyState
          illo={`${A}/04_empty_states/empty_keepsake_box.png`}
          title="首饰盒是空的"
          subtitle="收进来的小东西都会锁在这一格里。"
          href="/box"
          cta="打开铁盒 →"
        />
      </div>
    </section>
  );
}

function CqFooter() {
  return (
    <footer className="cq-footer">
      <img className="cq-footer-heart" src={`${A}/02_icons/heart.png`} alt="" aria-hidden="true" />
      <div className="cq-footer-line">Every door opens to you.</div>
    </footer>
  );
}

// ---------- main ----------

export function CoquetteHome() {
  const skin = useSkin();
  const [panelOpen, setPanelOpen] = useState(false);

  if (skin !== 'coquette') return null;

  return (
    <main className="coquette-home">
      <CqTopBar onOpenSettings={() => setPanelOpen(true)} />
      <div className="cq-content">
        <CqHero />
        <CqDivider />
        <CqChatRooms />
        <CqDivider />
        <CqRoomGrid />
        <CqDivider />
        <CqKeepsakes />
        <CqFooter />
      </div>
      <CqSkinPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </main>
  );
}
