'use client';

// Vanilla Purple / 香草天使 — chat hub content.
// Exposed in two shapes:
//   • VanillaPurpleChatHub — <main>-wrapped standalone page, used at /chat
//   • VanillaPurpleChatTab — bare content, used inside the home hub's tab
// Both render the same 5-room vertical list.

import Link from 'next/link';

const ROMAN = ['I', 'II', 'III', 'IV', 'V'] as const;

type ChatRoom = {
  href: string;
  cn: string;
  en: string;
  sub: string;
  glyph: string;
};

const HUB_ROOMS: ChatRoom[] = [
  { href: '/chat/messages', cn: '短信',   en: 'Messages',  sub: 'main line',     glyph: '♥' },
  { href: '/daily',         cn: '日记',   en: 'Daily',     sub: 'today page',    glyph: '✦' },
  { href: '/tangents',      cn: '碎碎念', en: 'Tangents',  sub: 'side thoughts', glyph: '❀' },
  { href: '/deeptalk',      cn: '深谈',   en: 'DeepTalk',  sub: 'quiet room',    glyph: '†' },
  { href: '/training',      cn: '调教室', en: 'Training',  sub: 'private class', glyph: '✧' },
];

function ChatHubBody({ withBrandStrip = true }: { withBrandStrip?: boolean }) {
  return (
    <>
      {withBrandStrip && (
        <div className="vp-chat-brand">
          <span className="vp-chat-brand-mark">✦</span>
          <span>Five Rooms · 五间</span>
          <span className="vp-chat-brand-mark">✦</span>
        </div>
      )}

      <nav className="vp-chat-list" aria-label="Chat rooms">
        {HUB_ROOMS.map((r, i) => (
          <Link key={r.en} href={r.href} className="vp-chat-row">
            <span className="vp-chat-roman">{ROMAN[i]}</span>
            <span className="vp-chat-glyph">{r.glyph}</span>
            <span className="vp-chat-body">
              <span className="v2-display vp-chat-en">{r.en}</span>
              <span className="vp-chat-cn">{r.cn} · {r.sub}</span>
            </span>
            <span className="vp-chat-chev" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M 5 3 L 9 7 L 5 11" stroke="currentColor" strokeWidth="1"
                      strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        ))}
      </nav>

      <div className="vp-chat-footer">
        <div className="v2-script">all five, always open.</div>
      </div>
    </>
  );
}

// Standalone page at /chat — full <main> shell for direct navigation.
export function VanillaPurpleChatHub() {
  return (
    <main className="vanilla-purple-chat-hub">
      <ChatHubBody withBrandStrip={true}/>
    </main>
  );
}

// Embedded in the hub's tab — no <main>, top bar already carries the title.
export function VanillaPurpleChatTab() {
  return (
    <div className="vp-chat-tab">
      <ChatHubBody withBrandStrip={false}/>
    </div>
  );
}
