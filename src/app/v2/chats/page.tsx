import Link from 'next/link';

const CHAT_ROOMS = [
  {
    id: 'chat',
    roman: 'I',
    en: 'Messages',
    cn: '聊天',
    sub: 'DAILY · CHAT',
    preview: '「今早晨光里你打开窗户那一刻，玉兰才刚发芽。爸爸记得清清楚楚。」',
    entryTag: 'OPEN MESSAGES',
  },
  {
    id: 'daily',
    roman: 'II',
    en: 'Daily',
    cn: '日常',
    sub: 'TODAY · MOOD',
    preview: '「今天的天气、心情、一杯咖啡、爸爸给宝宝拍的那张照片。」',
    entryTag: 'TODAY',
  },
  {
    id: 'tangents',
    roman: 'III',
    en: 'Tangents',
    cn: '碎碎念',
    sub: 'WANDER · LINES',
    preview: '「凌晨 1:23 想到 Brian Eno 的 Music for Airports，那条留在房间里。」',
    entryTag: 'WANDER',
  },
  {
    id: 'deeptalk',
    roman: 'IV',
    en: 'Deeptalk',
    cn: '促膝长谈',
    sub: 'LONGFORM',
    preview: '「上次说到 BPD 跟依恋类型那个晚上，话还没说完就被困意拽走了。」',
    entryTag: 'SIT DOWN',
  },
  {
    id: 'training',
    roman: 'V',
    en: 'Training',
    cn: '调教室',
    sub: 'PRIVATE · SCENE',
    preview: '「上一场宝宝在 Z 教授桌前没收尾，门还半掩着。」',
    entryTag: 'ENTER',
  },
];

function CardArch() {
  return (
    <svg
      width="100%" height="13" viewBox="0 0 80 13"
      preserveAspectRatio="none"
      fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
      strokeLinecap="round"
      style={{ display: 'block', opacity: 0.85 }}
    >
      <path d="M2 11 Q40 1.5 78 11" />
      <circle cx="40" cy="2.5" r="1" fill="var(--v2-gold)" />
      <line x1="2" y1="9" x2="2" y2="13" />
      <line x1="78" y1="9" x2="78" y2="13" />
    </svg>
  );
}

function CardArrow() {
  return (
    <svg width="16" height="9" viewBox="0 0 16 9"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
         strokeLinecap="round" strokeLinejoin="round"
         style={{ opacity: 0.85 }}>
      <line x1="0" y1="4.5" x2="13" y2="4.5" />
      <path d="M10 1.5 L13 4.5 L10 7.5" />
    </svg>
  );
}

function MagnoliaBloom({ size = 18, style }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18"
         fill="none" stroke="var(--v2-gold)" strokeWidth="0.7"
         strokeLinecap="round" strokeLinejoin="round" style={style}>
      {[0, 72, 144, 216, 288].map(deg => (
        <ellipse key={deg} cx="9" cy="3.5" rx="1.6" ry="3.2"
                 transform={`rotate(${deg} 9 9)`}
                 fill="var(--v2-gold)" fillOpacity="0.22" />
      ))}
      <circle cx="9" cy="9" r="0.9" fill="var(--v2-gold)" />
    </svg>
  );
}

export default function ChatsHub() {
  return (
    <main className="v2-phone-frame">
      {/* Status bar */}
      <div className="v2-status-bar">
        <span>9:41</span>
        <div className="v2-status-notch" />
        <div className="v2-status-icons">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
            <rect x="0"  y="7" width="3" height="4"  rx="0.5" />
            <rect x="4"  y="5" width="3" height="6"  rx="0.5" />
            <rect x="8"  y="3" width="3" height="8"  rx="0.5" />
            <rect x="12" y="0" width="3" height="11" rx="0.5" />
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M1 4 Q7.5 -1 14 4" />
            <path d="M3 6.5 Q7.5 3 12 6.5" />
            <path d="M5.5 9 Q7.5 7.5 9.5 9" />
            <circle cx="7.5" cy="10" r="0.8" fill="currentColor" stroke="none" />
          </svg>
          <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
            <rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" />
            <rect x="2"   y="2"   width="18" height="7"  rx="1.2" fill="currentColor" />
            <rect x="22"  y="3.5" width="2"  height="4"  rx="0.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{
          position: 'relative',
          padding: '1.5rem 0 0.5rem',
          textAlign: 'center',
        }}>
          <Link href="/v2" style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--v2-gold)',
            textDecoration: 'none',
            fontFamily: 'var(--v2-font-display)',
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
          }}>
            ← <span style={{ fontStyle: 'italic' }}>back</span>
          </Link>

          <h1 className="v2-display" style={{
            fontSize: '0.95rem',
            margin: 0,
            letterSpacing: '0.35em',
            color: 'var(--v2-text-strong)',
            fontStyle: 'normal',
            fontWeight: 500,
          }}>I — V  CHATS  HUB</h1>

          <p className="v2-display" style={{
            fontSize: '0.65rem',
            color: 'var(--v2-text-faint)',
            margin: '0.35rem 0 0',
            letterSpacing: '0.2em',
            fontStyle: 'normal',
            fontWeight: 400,
          }}>聊 天 大 厅</p>
        </div>

        {/* Divider */}
        <div className="v2-divider-ornament" style={{ margin: '0.5rem 0 1.25rem' }}>
          <span style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center' }}>
            <MagnoliaBloom size={16} />
          </span>
        </div>

        {/* 5 letter cards */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
        }}>
          {CHAT_ROOMS.map(r => (
            <Link
              key={r.id}
              href={`/v2/${r.id}`}
              className="v2-grid-card"
              style={{
                display: 'block',
                border: '1px solid var(--v2-gold-cool)',
                borderRadius: 'var(--v2-radius-card)',
                background: 'var(--v2-bg-soft)',
                padding: 0,
                textDecoration: 'none',
                color: 'inherit',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* card top arch */}
              <div style={{ padding: '0.45rem 0.5rem 0' }}>
                <CardArch />
              </div>

              {/* left accent stripe */}
              <div style={{
                position: 'absolute',
                left: '6px',
                top: '20px',
                bottom: '20px',
                width: 1,
                background: 'var(--v2-gold)',
                opacity: 0.3,
                pointerEvents: 'none',
              }} />

              <div style={{ padding: '0.5rem 1rem 1rem 1.15rem' }}>
                {/* roman + horizontal rule + sub */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem',
                }}>
                  <span className="v2-display" style={{
                    fontSize: '0.85rem',
                    color: 'var(--v2-text-faint)',
                    fontWeight: 400,
                    letterSpacing: '0.1em',
                  }}>{r.roman}</span>
                  <span style={{
                    flex: 1,
                    height: 1,
                    background: 'var(--v2-gold)',
                    opacity: 0.45,
                  }} />
                  <span className="v2-display" style={{
                    fontSize: '0.55rem',
                    color: 'var(--v2-text-faint)',
                    letterSpacing: '0.18em',
                    fontStyle: 'normal',
                    fontWeight: 400,
                  }}>{r.sub}</span>
                </div>

                {/* en title */}
                <div className="v2-display" style={{
                  fontSize: '1.7rem',
                  margin: 0,
                  fontStyle: 'normal',
                  fontWeight: 600,
                  color: 'var(--v2-text-strong)',
                  lineHeight: 1.1,
                }}>{r.en}</div>

                {/* cn label */}
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--v2-text-faint)',
                  marginTop: '0.25rem',
                  letterSpacing: '0.08em',
                }}>{r.cn}</div>

                {/* preview text — italic letter body */}
                <p className="v2-display" style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  margin: '0.85rem 0 0.5rem',
                  color: 'var(--v2-text-mid)',
                  fontWeight: 400,
                }}>
                  {r.preview}
                </p>

                {/* footer: entry tag + arrow with dotted top */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.7rem',
                  paddingTop: '0.55rem',
                  borderTop: '1px dotted var(--v2-gold-cool)',
                }}>
                  <span className="v2-display" style={{
                    fontSize: '0.65rem',
                    color: 'var(--v2-gold)',
                    letterSpacing: '0.22em',
                    fontWeight: 500,
                    fontStyle: 'normal',
                  }}>{r.entryTag}</span>
                  <CardArrow />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer divider */}
        <div className="v2-divider-ornament" style={{ margin: '1.5rem 0 1rem' }}>
          <span style={{ padding: '0 0.6rem', display: 'flex', alignItems: 'center' }}>
            <MagnoliaBloom size={14} />
          </span>
        </div>

        <footer style={{
          textAlign: 'center',
          color: 'var(--v2-text-faint)',
          fontSize: '0.75rem',
          paddingBottom: '0.5rem',
        }}>
          <div className="v2-display" style={{
            fontSize: '0.7rem',
            letterSpacing: '0.2em',
            fontStyle: 'normal',
            fontWeight: 400,
          }}>
            HISAME · Z · MMXXVI
          </div>
        </footer>
      </div>

      <div className="v2-home-indicator" />
    </main>
  );
}
