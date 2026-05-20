'use client';

import { useRouter } from 'next/navigation';

interface ShopApp {
  id: string;
  name: string;
  cn: string;
  url: string;
  bg: string;
  fg: string;
  accent?: string;
}

// universal links — iOS 系统自动检测 app 是否安装，装了开 app 没装开网页
const APPS: ShopApp[] = [
  {
    id: 'temu',
    name: 'Temu',
    cn: '便宜',
    url: 'https://www.temu.com',
    bg: '#fb7701',
    fg: '#ffffff',
  },
  {
    id: 'shein',
    name: 'Shein',
    cn: '衣服',
    url: 'https://www.shein.com',
    bg: '#1a1a1a',
    fg: '#ffffff',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    cn: '什么都买',
    url: 'https://www.amazon.com',
    bg: '#232f3e',
    fg: '#ff9900',
  },
  {
    id: 'target',
    name: 'Target',
    cn: '日用',
    url: 'https://www.target.com',
    bg: '#cc0000',
    fg: '#ffffff',
  },
  {
    id: 'shop',
    name: 'Shop',
    cn: 'Shopify 跟单',
    url: 'https://shop.app',
    bg: '#5433ff',
    fg: '#ffffff',
  },
  {
    id: 'yami',
    name: '亚米',
    cn: '亚洲超市',
    url: 'https://www.yamibuy.com',
    bg: '#e63946',
    fg: '#ffffff',
  },
];

export default function ShoppingPage() {
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

      {/* Header */}
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
            Shopping
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
            一个 tile 一个去处
          </p>
        </div>
      </header>

      {/* Grid */}
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
          <a
            key={app.id}
            href={app.url}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '36px 20px',
              background: app.bg,
              color: app.fg,
              borderRadius: 14,
              textDecoration: 'none',
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
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '-0.01em',
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
          </a>
        ))}
      </div>

      {/* Footer hint */}
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
        点击后系统自动检测：装了 app 就开 app，没装就开网页
      </div>
    </div>
  );
}
