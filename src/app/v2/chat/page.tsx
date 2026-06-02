'use client';

import Link from 'next/link';
import { useSkin } from '../_components/ThemeProvider';

const HUB_ROOMS = [
  { href: '/v2/chat/messages', cn: '短信', en: 'Messages', sub: 'main line', glyph: '♥' },
  { href: '/v2/daily', cn: '日记', en: 'Daily', sub: 'today page', glyph: '✦' },
  { href: '/v2/tangents', cn: '碎碎念', en: 'Tangents', sub: 'side thoughts', glyph: '❀' },
  { href: '/v2/deeptalk', cn: '深谈', en: 'DeepTalk', sub: 'quiet room', glyph: '†' },
  { href: '/v2/training', cn: '调教室', en: 'Training', sub: 'private class', glyph: '✧' },
];

export default function ChatHubPage() {
  const skin = useSkin();
  const isWindowSkin = skin === 'grace-os';

  return (
    <main className="v2-chat-hub-page" data-room-page-bg="true" data-room-shell="true">
      <div className="v2-chat-hub-shell">
        <header className="v2-chat-hub-header">
          <Link href="/v2" className="v2-chat-hub-back" aria-label="Back to home">‹</Link>
          <span className="v2-chat-hub-kicker">CHAT WING</span>
          <h1>Chats Hub</h1>
          <p>Messages · Daily · Tangents · DeepTalk · Training</p>
        </header>

        <nav className="v2-chat-hub-grid" aria-label="Chats Hub rooms">
          {HUB_ROOMS.map((room, index) => (
            <Link key={room.en} href={room.href} className="v2-chat-hub-card">
              <span className="v2-chat-hub-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="v2-chat-hub-glyph">{room.glyph}</span>
              <span className="v2-chat-hub-cn">{room.cn}</span>
              <span className="v2-chat-hub-en">{room.en}</span>
              <span className="v2-chat-hub-sub">{room.sub}</span>
            </Link>
          ))}
        </nav>

        <footer className="v2-chat-hub-footer">
          <span>{isWindowSkin ? 'skin only' : 'day / night enabled'}</span>
        </footer>
      </div>
    </main>
  );
}
