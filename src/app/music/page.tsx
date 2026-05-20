'use client';

import { useRouter } from 'next/navigation';

interface MusicApp {
  id: string;
  name: string;
  cn: string;
  url: string;
  scheme?: string;
  bg: string;
  fg: string;
}

const APPS: MusicApp[] = [
  {
    id: 'qqmusic',
    name: 'QQ 音乐',
    cn: '腾讯',
    url: 'https://y.qq.com',
    scheme: 'qqmusic://',
    bg: '#31c27c',
    fg: '#ffffff',
  },
  {
    id: 'netease',
    name: '网易云',
    cn: 'NetEase',
    url: 'https://music.163.com',
    scheme: 'orpheus://',
    bg: '#c20c0c',
    fg: '#ffffff',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    cn: '国际',
    url: 'https://open.spotify.com',
    scheme: 'spotify://',
    bg: '#1db954',
    fg: '#000000',
  },
];

function openApp(app: MusicApp) {
  if (!app.scheme) {
    window.location.href = app.url;
    return;
  }
  const startTime = Date.now();
  window.location.href = app.scheme;
  setTimeout(() => {
    if (Date.now() - startTime < 2000 && document.visibilityState === 'visible') {
      window.location.href = app.url;
    }
  }, 1500);
}

export default function MusicPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: '32px 20px 60px',
        backgroundColor: '#f5ecdb',
        fontFamily: '"Cormorant Garamond", "Songti SC", serif',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
        rel="stylesheet"
      />

      <header
        style={{
          maxWidth: 540,
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8a7a5e',
            cursor: 'pointer',
            fontSize: 22,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 500,
              margin: 0,
              color: '#3a3225',
              letterSpacing: '0.02em',
            }}
          >
            听歌
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#8a7a5e',
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            放点音乐
          </p>
        </div>
      </header>

      <div
        style={{
          maxWidth: 540,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
        }}
      >
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => openApp(app)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 20px',
              background: app.bg,
              color: app.fg,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              minHeight: 130,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              transition: 'transform 0.15s, box-shadow 0.15s',
              fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-0.01em',
                textAlign: 'center',
              }}
            >
              {app.name}
            </div>
            <div
              style={{
                fontSize: 12,
                opacity: 0.72,
                marginTop: 8,
                letterSpacing: '0.05em',
              }}
            >
              {app.cn}
            </div>
          </button>
        ))}
      </div>

      <div
        style={{
          maxWidth: 540,
          margin: '32px auto 0',
          textAlign: 'center',
          fontSize: 12,
          color: '#a89b7e',
          fontStyle: 'italic',
        }}
      >
        装了 app 就开 app，没装就开网页
      </div>
    </div>
  );
}
