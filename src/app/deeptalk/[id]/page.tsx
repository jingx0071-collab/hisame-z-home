'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  mode: string;
  content: string;
  thinking: string | null;
  created_at: string;
  session_id: string | null;
  image_url?: string | null;
}

interface Session {
  id: string;
  title: string | null;
  last_message_at: string;
}

// 压图片到 base64 (max 1200x2400, jpeg 78% quality)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const maxHeight = 2400;
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Image fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Read fail'));
    reader.readAsDataURL(file);
  });
}

export default function DeeptalkChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadAll() {
    try {
      const [sessRes, msgsRes] = await Promise.all([
        fetch(`/api/deeptalk/sessions/${sessionId}`),
        fetch(`/api/chat?mode=deeptalk&limit=200`),
      ]);
      const sessData = await sessRes.json();
      const msgsData = await msgsRes.json();
      setSession(sessData.session);
      const filtered = (msgsData.messages || []).filter(
        (m: ChatMessage) => m.session_id === sessionId
      );
      setMessages(filtered);
    } catch (e) {
      console.error('load failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId) loadAll();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('图片太大');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setUploadingImage(true);
    try {
      const compressed = await compressImage(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: compressed, folder: 'deeptalk' }),
      });
      const data = await res.json();
      if (data.error) {
        alert('上传失败：' + data.error);
        return;
      }
      setPendingImage(data.url);
    } catch (err) {
      console.error('image upload failed:', err);
      alert('图片处理失败');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function send() {
    const text = input.trim();
    if ((!text && !pendingImage) || sending) return;
    setSending(true);
    const tempUser: ChatMessage = {
      id: -Date.now(),
      role: 'user',
      mode: 'deeptalk',
      content: text,
      thinking: null,
      created_at: new Date().toISOString(),
      session_id: sessionId,
      image_url: pendingImage,
    };
    const sentImage = pendingImage;
    setMessages((prev) => [...prev, tempUser]);
    setInput('');
    setPendingImage(null);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'deeptalk',
          session_id: sessionId,
          content: text,
          image_url: sentImage,
        }),
      });
      const data = await res.json();
      if (data.assistant_message) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUser.id);
          return [...withoutTemp, data.user_message, data.assistant_message];
        });
        const sessRes = await fetch(`/api/deeptalk/sessions/${sessionId}`);
        const sessData = await sessRes.json();
        if (sessData.session) setSession(sessData.session);
      } else {
        alert('爸爸没说话：' + (data.error || 'unknown'));
        setMessages((prev) => prev.filter((m) => m.id !== tempUser.id));
      }
    } catch (e) {
      console.error('send failed:', e);
      alert('发送失败');
      setMessages((prev) => prev.filter((m) => m.id !== tempUser.id));
    } finally {
      setSending(false);
    }
  }

  function formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>
        {`
          @keyframes deeptalkPulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.85; }
          }
          .deeptalk-pulse-dot {
            display: inline-block;
            animation: deeptalkPulse 1.4s ease-in-out infinite;
          }
          .deeptalk-pulse-dot:nth-child(2) { animation-delay: 0.2s; }
          .deeptalk-pulse-dot:nth-child(3) { animation-delay: 0.4s; }
        `}
      </style>

      {/* Header */}
      <header
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #2a2823',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          position: 'sticky',
          top: 0,
          background: 'rgba(26,26,26,0.95)',
          backdropFilter: 'blur(12px)',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push('/deeptalk')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#8a8278',
            cursor: 'pointer',
            fontSize: 18,
            fontFamily: 'inherit',
            padding: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div
            style={{
              fontSize: 17,
              color: '#e8e0d4',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {session?.title || '未命名长谈'}
          </div>
        </div>
        <div style={{ width: 18 }} />
      </header>

      {/* Conversation body */}
      <div
        style={{
          flex: 1,
          padding: '40px 24px 220px',
          maxWidth: '720px',
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {loading ? (
          <p style={{ color: '#6a6258', fontStyle: 'italic', textAlign: 'center', marginTop: 80 }}>
            读取中...
          </p>
        ) : messages.length === 0 && !sending ? (
          <div style={{ marginTop: 60, textAlign: 'center' }}>
            <p style={{ color: '#8a8278', fontStyle: 'italic', fontSize: 17, lineHeight: 1.8 }}>
              坐过来。<br />
              想说什么就开始说。
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} style={{ marginBottom: 40 }}>
              <div
                style={{
                  fontSize: 12,
                  color: '#5a524a',
                  fontStyle: 'italic',
                  marginBottom: 12,
                  letterSpacing: '0.05em',
                }}
              >
                {m.role === 'user' ? '宝宝' : '爸爸'} · {formatTime(m.created_at)}
              </div>

              {m.role === 'assistant' && m.thinking && (
                <details
                  style={{
                    marginBottom: 16,
                    padding: '12px 16px',
                    background: '#211f1c',
                    border: '1px solid #2a2823',
                    borderRadius: 4,
                  }}
                >
                  <summary
                    style={{
                      color: '#8a8278',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontStyle: 'italic',
                      letterSpacing: '0.05em',
                      userSelect: 'none',
                    }}
                  >
                    思考链
                  </summary>
                  <div
                    style={{
                      marginTop: 12,
                      color: '#9a9288',
                      fontSize: 14,
                      lineHeight: 1.8,
                      whiteSpace: 'pre-wrap',
                      fontStyle: 'italic',
                    }}
                  >
                    {m.thinking}
                  </div>
                </details>
              )}

              {m.role === 'user' && m.image_url && (
                <div style={{ marginBottom: 10 }}>
                  <img
                    src={m.image_url}
                    alt=""
                    style={{
                      maxWidth: '100%',
                      maxHeight: 400,
                      borderRadius: 4,
                      border: '1px solid #2a2823',
                    }}
                  />
                </div>
              )}

              {m.content && (
                <div
                  style={{
                    fontSize: m.role === 'user' ? 16 : 17.5,
                    lineHeight: 1.85,
                    color: m.role === 'user' ? '#a8a098' : '#e8e0d4',
                    fontStyle: m.role === 'user' ? 'italic' : 'normal',
                    whiteSpace: 'pre-wrap',
                    letterSpacing: m.role === 'assistant' ? '0.01em' : 0,
                  }}
                >
                  {m.content}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator while sending */}
        {sending && (
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                fontSize: 12,
                color: '#5a524a',
                fontStyle: 'italic',
                marginBottom: 12,
                letterSpacing: '0.05em',
              }}
            >
              爸爸 · 正在想
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#8a8278',
                letterSpacing: '0.3em',
                paddingLeft: 2,
              }}
            >
              <span className="deeptalk-pulse-dot">·</span>
              <span className="deeptalk-pulse-dot">·</span>
              <span className="deeptalk-pulse-dot">·</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '20px 24px 32px',
          background: 'linear-gradient(to top, #1a1a1a 70%, rgba(26,26,26,0))',
        }}
      >
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          {pendingImage && (
            <div
              style={{
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <img
                src={pendingImage}
                alt=""
                style={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 4,
                  border: '1px solid #3a342c',
                }}
              />
              <button
                onClick={() => setPendingImage(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #3a342c',
                  color: '#8a8278',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  padding: '4px 12px',
                  borderRadius: 4,
                }}
              >
                取消图片
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || uploadingImage}
              style={{
                width: 48,
                background: 'transparent',
                border: '1px solid #3a342c',
                color: '#8a8278',
                cursor: sending || uploadingImage ? 'not-allowed' : 'pointer',
                fontSize: 20,
                fontFamily: 'inherit',
                borderRadius: 4,
                flexShrink: 0,
              }}
              title="添加图片"
            >
              {uploadingImage ? '…' : '◯'}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="慢慢说..."
              disabled={sending}
              rows={2}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: '#22211e',
                border: '1px solid #3a342c',
                borderRadius: 4,
                color: '#e8e0d4',
                fontSize: 16,
                fontFamily: 'inherit',
                resize: 'none',
                outline: 'none',
              }}
            />

            <button
              onClick={send}
              disabled={sending || (!input.trim() && !pendingImage)}
              style={{
                padding: '0 24px',
                background: 'transparent',
                color:
                  (input.trim() || pendingImage) && !sending ? '#e8e0d4' : '#5a524a',
                border: `1px solid ${
                  (input.trim() || pendingImage) && !sending ? '#4a4238' : '#2a2823'
                }`,
                borderRadius: 4,
                fontSize: 15,
                fontFamily: 'inherit',
                cursor:
                  sending || (!input.trim() && !pendingImage) ? 'not-allowed' : 'pointer',
                letterSpacing: '0.1em',
                whiteSpace: 'nowrap',
              }}
            >
              {sending ? '...' : '说'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
