'use client';

import { useRouter } from 'next/navigation';

interface EatApp {
  id: string;
  name: string;
  cn: string;
  url: string;
  scheme?: string; // 可选 custom URL scheme (优先用，1.5s fallback 到 url)
  bg: string;
  fg: string;
}

const APPS: EatApp[] = [
  {
    id: 'ubereats',
    name: 'Uber Eats',
    cn: '万能外卖',
    url: 'https://www.ubereats.com',
    bg: '#06c167',
    fg: '#1a1a1a',
  },
  {
    id: 'postmates',
    name: 'Postmates',
    cn: '同 Uber 一家',
    url: 'https://postmates.com',
    bg: '#1a1a1a',
    fg: '#ffffff',
  },
  {
    id: 'doordash',
    name: 'DoorDash',
    cn: '美式外卖',
    url: 'https://www.doordash.com',
    bg: '#eb1700',
    fg: '#ffffff',
  },
  {
    id: 'fantuan',
    name: '饭团',
    cn: 'Fantuan',
    url: 'https://www.fantuanorder.com',
    bg: '#d8333c',
    fg: '#ffffff',
  },
  {
    id: 'starbucks',
    name: 'Starbucks',
    cn: '咖啡',
    url: 'https://www.starbucks.com',
    scheme: 'starbucks://',
    bg: '#006241',
    fg: '#ffffff',
  },
];

// Hybrid open：app scheme 优先；1.5s 后还在 page 就 fallback 到 web URL
function openApp(app: EatApp) {
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

export default function EatPage() {
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
            吃饭
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
            饿了？
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
              borderRadius: 0,
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
