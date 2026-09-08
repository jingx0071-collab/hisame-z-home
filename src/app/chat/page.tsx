'use client';

import Link from 'next/link';
import { useSkin } from '../_components/ThemeProvider';
import { VanillaPurpleChatHub } from '../_components/vanilla-purple/chat-hub';

const HUB_ROOMS = [
  { href: '/chat/messages', cn: '短信', en: 'Messages', sub: 'main line', glyph: '♥' },
  { href: '/daily', cn: '日记', en: 'Daily', sub: 'today page', glyph: '✦' },
  { href: '/tangents', cn: '碎碎念', en: 'Tangents', sub: 'side thoughts', glyph: '❀' },
  { href: '/deeptalk', cn: '深谈', en: 'DeepTalk', sub: 'quiet room', glyph: '†' },
  { href: '/training', cn: '调教室', en: 'Training', sub: 'private class', glyph: '✧' },
];

function HisameSignalChatHub() {
  return (
    <main className="hisame-signal-chat-hub">
      <div className="hisame-signal-chat-phone">
        <header className="hisame-signal-chat-header">
          <div>
            <div className="hisame-signal-chat-title">I — Messages</div>
            <div className="hisame-signal-chat-subtitle">短 · 信</div>
          </div>
          <img src="/skins/hisame-signal/11_sticker_lavender_star.png" alt="" />
        </header>

        <nav className="hisame-signal-chat-grid" aria-label="Chats Hub rooms">
          {HUB_ROOMS.map((room, index) => (
            <Link key={room.en} href={room.href} className="hisame-signal-chat-card">
              <span className="hisame-signal-chat-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="hisame-signal-chat-glyph">{room.glyph}</span>
              <span className="hisame-signal-chat-cn">{room.cn}</span>
              <span className="hisame-signal-chat-en">{room.en}</span>
              <span className="hisame-signal-chat-card-sub">{room.sub}</span>
            </Link>
          ))}
        </nav>

        <footer className="hisame-signal-chat-footer">
          <img src="/skins/hisame-signal/06_divider_phone_charm_line.png" alt="" />
        </footer>
      </div>
    </main>
  );
}

export default function ChatHubPage() {
  const skin = useSkin();
  const isWindowSkin = skin === 'grace-os';
  const isArchway = skin === 'archway';

  if (skin === 'vanilla-purple') return <VanillaPurpleChatHub />;
  if (skin === 'hisame-signal') return <HisameSignalChatHub />;

  return (
    <main className={`v2-chat-hub-page ${isArchway ? 'v2-chat-hub-page--archway' : ''}`} data-room-page-bg="true" data-room-shell="true">
      <div className="v2-chat-hub-shell hisame-room-shell" data-hisame-room-shell="true">
        <header className="v2-chat-hub-header hisame-chat-hub-arch-header">
          <div className="hisame-room-title">I — Messages</div>
          <div className="hisame-room-subtitle">短 · 信</div>
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
