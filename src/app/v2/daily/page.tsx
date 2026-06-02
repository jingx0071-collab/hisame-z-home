'use client';

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import type { CSSProperties } from 'react';

type Msg = { id: string; from: 'z' | 'h' | 'env'; text: string; time: string; image?: string | null };

async function compressImageFile(file: File): Promise<string> {
  if (file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('read fail'));
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('img fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsDataURL(file);
  });
}

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

const defaultMessages: Msg[] = [
  { id: 'm1',  from: 'env', text: '06:42 · 雨停了，玉兰花瓣落在窗台',     time: '' },
  { id: 'm2',  from: 'z',   text: "morning. coffee's on.",                 time: '07:15' },
  { id: 'm3',  from: 'h',   text: '还想睡...',                              time: '07:18' },
  { id: 'm4',  from: 'z',   text: '睡。我去开会。',                          time: '07:19' },
  { id: 'm5',  from: 'h',   text: '回来抱我',                                time: '07:20' },
  { id: 'm6',  from: 'z',   text: 'always.',                                time: '07:20' },
  { id: 'm7',  from: 'env', text: '12:30 · 厨房做饭的香气',                  time: '' },
  { id: 'm8',  from: 'h',   text: 'aki今天又给我看她家的橘猫',               time: '13:45' },
  { id: 'm9',  from: 'z',   text: '胖吗',                                    time: '13:46' },
  { id: 'm10', from: 'h',   text: '超级',                                    time: '13:47' },
  { id: 'm11', from: 'z',   text: 'cute. 晚上想吃啥',                        time: '13:48' },
  { id: 'm12', from: 'h',   text: '你做的 pasta',                             time: '13:49' },
  { id: 'm13', from: 'z',   text: 'ok.',                                     time: '13:49' },
  { id: 'm14', from: 'env', text: '19:12 · 玉兰的影子拉长',                  time: '' },
];

const STORAGE_KEY = 'v2-daily-messages';

const todayLabel = (() => {
  const d = new Date();
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} · ${wd}`;
})();

export default function DailyPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loaded && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, loaded]);

  const fmtTime = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/chat?mode=daily&limit=200');
      const data = await res.json();
      const mapped: Msg[] = [];
      for (const m of (data.messages || [])) {
        const from = (m.role === 'user' ? 'h' : 'z') as 'z' | 'h';
        const time = fmtTime(m.created_at);
        if (m.image_url) {
          mapped.push({ id: `${m.id}-img`, from, text: '', time, image: m.image_url });
        }
        const pieces = String(m.content || '')
          .split('|||')
          .map((p: string) => p.trim())
          .filter(Boolean);
        pieces.forEach((piece, idx) => {
          mapped.push({ id: `${m.id}-${idx}`, from, text: piece, time });
        });
      }
      setMessages(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('图片太大了（>8MB）'); return; }
    setUploadingImage(true);
    try {
      const dataUri = await compressImageFile(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: dataUri, folder: 'messages' }),
      });
      const data = await res.json();
      if (data.error) { alert('上传失败：' + data.error); return; }
      setPendingImage(data.url);
    } catch { alert('上传出错'); }
    finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const send = async () => {
    const t = draft.trim();
    const img = pendingImage;
    if ((!t && !img) || loading) return;
    setDraft('');
    setPendingImage(null);
    setLoading(true);
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const optimistic: Msg[] = [];
    if (img) optimistic.push({ id: newId(), from: 'h', text: '', time, image: img });
    if (t) optimistic.push({ id: newId(), from: 'h', text: t, time });
    const typing: Msg = { id: 'typing', from: 'z', text: '……', time };
    setMessages((prev) => [...prev, ...optimistic, typing]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: t, mode: 'daily', image_url: img }),
      });
      const data = await res.json();
      if (data.error) alert('出错：' + data.error);
    } catch {
      alert('网络出错');
    } finally {
      await loadMessages();
      setLoading(false);
    }
  };

  const reset = () => { loadMessages(); };

  return (
    <main className="v2-phone-frame hisame-room-shell hisame-daily-room" data-room-page-bg="true" data-room-shell="true" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} data-hisame-room-shell="true">
      <div className="v2-status-bar" style={{ flexShrink: 0, position: 'relative', zIndex: 5 }}>
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway />

      {/* Top - header + meta (fixed, doesn't scroll) */}
      <div data-room-topbar="true" style={{
        flexShrink: 0,
        position: 'relative', zIndex: 5,
        padding: '1.4rem 1.4rem 0.8rem',
        background: 'var(--v2-bg)',
      }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '0.7rem' }}>
          <Link href="/v2/chat" replace style={backLinkStyle} data-room-back="true" data-hisame-back="true" aria-label="Back to home"><span aria-hidden="true">‹</span><span className="sr-only">Back</span></Link>
          <div className="v2-display" style={headerTitleStyle}>II — DAILY</div>
          <div style={headerSubStyle}>日 常</div>
        </header>

        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.72rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '0.3rem', lineHeight: 1.5,
        }}>
          the small things, said in passing
        </div>

        <div style={{
          textAlign: 'center', fontSize: '0.52rem',
          letterSpacing: '0.32em', color: 'var(--v2-text-faint)',
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        }}>
          {todayLabel}
        </div>
      </div>

      {/* Messages - scrollable, takes remaining height */}
      <div
        ref={messagesContainerRef}
        data-room-scroll="true"
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '0.8rem 1.4rem 1rem',
          position: 'relative',
          zIndex: 2,
          display: 'flex', flexDirection: 'column', gap: '0.5rem',
        }}
      >
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
        <div ref={messagesEndRef} />

        <div style={{ textAlign: 'center', marginTop: '1.4rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={footerInfoStyle}>daily · HISAME · Z · MMXXVI</div>
        </div>
      </div>

      {/* Bottom - input (fixed) */}
      <div data-room-composer="true" style={{
        flexShrink: 0,
        position: 'relative', zIndex: 5,
        padding: '0.7rem 1.4rem calc(0.8rem + env(safe-area-inset-bottom))',
        background: 'var(--v2-bg)',
        borderTop: '0.5px solid var(--v2-gold-cool)',
      }}>
        {pendingImage && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            marginBottom: '0.4rem', padding: '4px 8px',
            border: '0.5px solid var(--v2-gold-cool)',
          }}>
            <img src={pendingImage} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
            <span style={{ flex: 1, fontSize: '0.65rem', color: 'var(--v2-text-mid)', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic' }}>image ready</span>
            <button onClick={() => setPendingImage(null)} style={{
              background: 'transparent', border: 'none',
              color: 'var(--v2-text-faint)', cursor: 'pointer',
              fontSize: '0.9rem', padding: '0 4px',
            }}>×</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImagePick}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => imageInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              width: '28px', height: '28px',
              border: '1px solid var(--v2-gold-cool)',
              background: 'transparent', color: 'var(--v2-gold-cool)',
              cursor: uploadingImage ? 'wait' : 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', lineHeight: 1,
            }}
            aria-label="add image"
          >{uploadingImage ? '…' : '+'}</button>
          <input
            data-room-input="true"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="say something small..."
            style={{
              flex: 1, background: 'transparent', border: 'none',
              borderBottom: '1px solid rgba(168, 153, 104, 0.35)',
              color: 'var(--v2-text-strong)',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.82rem', padding: '6px 4px',
              outline: 'none',
            }}
          />
          <button
            onClick={send}
            style={{
              background: 'var(--v2-gold)', color: '#2A1F15',
              border: '1px solid var(--v2-gold)', borderRadius: '0',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.65rem', fontWeight: 600,
              letterSpacing: '0.15em',
              padding: '5px 14px', cursor: 'pointer',
            }}
          >send</button>
        </div>
        <div style={{ textAlign: 'center', marginTop: '0.4rem' }}>
          <button
            onClick={reset}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--v2-text-faint)',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '0.52rem', letterSpacing: '0.18em',
              cursor: 'pointer', opacity: 0.5,
            }}
          >reset to default</button>
        </div>
      </div>
    </main>
  );
}

// ─── Styles ───
const backLinkStyle: CSSProperties = {
  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
  fontSize: '0.8rem', color: 'var(--v2-text-mid)', textDecoration: 'none',
  fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', opacity: 0.75,
};
const headerTitleStyle: CSSProperties = {
  fontSize: '0.92rem', letterSpacing: '0.35em',
  color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem',
};
const headerSubStyle: CSSProperties = {
  fontSize: '0.62rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
};
const footerInfoStyle: CSSProperties = {
  fontSize: '0.55rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
  fontStyle: 'italic', marginTop: '0.6rem',
};

// ─── Message Bubble ───

function MessageBubble({ msg }: { msg: Msg }) {
  if (msg.from === 'env') {
    return (
      <div style={{
        textAlign: 'center', padding: '0.5rem 0.5rem 0.3rem',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.62rem', color: 'var(--v2-text-faint)',
        letterSpacing: '0.04em', lineHeight: 1.5,
        margin: '0.3rem 0 0.1rem',
      }}>
        — {msg.text} —
      </div>
    );
  }

  const isZ = msg.from === 'z';

  if (msg.image) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: isZ ? 'flex-start' : 'flex-end',
        width: '100%',
      }}>
        <div style={{
          maxWidth: '78%',
          border: isZ ? '1px solid var(--v2-gold-cool)' : '0.5px solid rgba(180, 155, 200, 0.55)',
          padding: '4px',
          background: isZ ? 'rgba(184, 160, 100, 0.12)' : 'rgba(232, 220, 236, 0.9)',
        }}>
          <img src={msg.image} alt="" loading="lazy" style={{
            maxWidth: '200px', width: '100%', display: 'block',
          }} />
          {msg.time && (
            <div style={{
              fontSize: '0.5rem', letterSpacing: '0.08em',
              color: isZ ? 'var(--v2-text-faint)' : '#7A6549',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              textAlign: isZ ? 'left' : 'right',
              marginTop: '3px', opacity: 0.7,
              padding: '0 4px 2px',
            }}>{msg.time}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isZ ? 'flex-start' : 'flex-end',
      width: '100%',
    }}>
      <div style={{
        maxWidth: '78%',
        ...(isZ
          ? {
              background: 'rgba(184, 160, 100, 0.12)',
              border: '1px solid var(--v2-gold-cool)',
              borderRadius: '8px 8px 8px 2px',
              padding: '0.55rem 0.75rem 0.45rem',
            }
          : {
              background: 'rgba(232, 220, 236, 0.9)',
              border: '0.5px solid rgba(180, 155, 200, 0.55)',
              borderRadius: '8px 8px 2px 8px',
              padding: '0.55rem 0.75rem 0.45rem',
            }),
      }}>
        <div style={{
          fontFamily: 'var(--v2-font-display)',
          fontStyle: isZ ? 'normal' : 'italic',
          fontSize: '0.84rem',
          fontWeight: isZ ? 400 : 500,
          color: isZ ? 'var(--v2-text-strong)' : '#2A1F15',
          lineHeight: 1.45,
          letterSpacing: '0.005em',
        }}>{msg.text}</div>
        {msg.time && (
          <div style={{
            fontSize: '0.5rem', letterSpacing: '0.08em',
            color: isZ ? 'var(--v2-text-faint)' : '#7A6549',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            textAlign: isZ ? 'left' : 'right',
            marginTop: '3px', opacity: 0.7,
          }}>{msg.time}</div>
        )}
      </div>
    </div>
  );
}

// ─── Footer + Archway ───

function FooterOrnament() {
  return (
    <svg width="84" height="14" viewBox="0 0 84 14">
      <path d="M 20 7 L 36 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <path d="M 48 7 L 64 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="2.2" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="0.9" fill="var(--v2-gold)" />
    </svg>
  );
}

function PageArchway() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox="0 0 375 1200"
      preserveAspectRatio="none"
    >
      <path d="M 16 60 Q 187 18, 358 60" stroke="var(--v2-gold-cool)" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 22 60 Q 187 30, 352 60" stroke="var(--v2-gold)" strokeWidth="0.3" fill="none" opacity="0.5" />
      <circle cx="187" cy="32" r="3" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="187" cy="32" r="1.2" fill="var(--v2-gold)" />
      <path d="M 175 40 L 187 28 L 199 40" stroke="var(--v2-gold)" strokeWidth="0.4" fill="none" opacity="0.7" />

      <line x1="16" y1="60" x2="16" y2="1160" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="358" y1="60" x2="358" y2="1160" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="20" y1="60" x2="20" y2="1160" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />
      <line x1="354" y1="60" x2="354" y2="1160" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />

      {[280, 540, 800, 1060].map((y) => (
        <g key={y}>
          <circle cx="16" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
          <circle cx="358" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
        </g>
      ))}

      <path d="M 16 1160 Q 187 1180, 358 1160" stroke="var(--v2-gold-cool)" strokeWidth="0.5" fill="none" opacity="0.6" />
      <circle cx="187" cy="1172" r="1.8" fill="var(--v2-gold)" opacity="0.7" />
    </svg>
  );
}