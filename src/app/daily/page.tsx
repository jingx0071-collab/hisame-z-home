'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import StickerPicker from '../chat/StickerPicker';

type ChatMsg = {
  id: number;
  role: 'user' | 'assistant';
  mode: string;
  content: string;
  thinking: string | null;
  image_url: string | null;
  created_at: string;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

function formatDateHeader(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const fmt = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(date);
  if (fmt(d) === fmt(today)) return '今天';
  if (fmt(d) === fmt(yest)) return '昨天';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: 'long', day: 'numeric',
  }).format(d);
}

function shouldShowDateHeader(curr: ChatMsg, prev: ChatMsg | null): boolean {
  if (!prev) return true;
  const fmt = (iso: string) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date(iso));
  return fmt(curr.created_at) !== fmt(prev.created_at);
}

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

// 拆 content 成 bubble 数组（split by |||，trim 后过滤空段）
function splitBubbles(content: string): string[] {
  if (!content) return [];
  return content.split('|||').map((p) => p.trim()).filter(Boolean);
}

export default function DailyPage() {
  // __LAST_READ_PATCH__
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('hisame-z-last-read-daily', new Date().toISOString());
    } catch (e) {}
  }

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/chat?mode=daily&limit=200');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setInitialLoad(false); }
  };

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

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
    } catch (e) { alert('上传出错'); }
    finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleStickerSelect = (url: string) => {
    setShowStickerPicker(false);
    sendMessage('', url);
  };

  const removePendingImage = () => setPendingImage(null);

  const sendMessage = async (text: string, imageUrl: string | null) => {
    if (loading) return;
    if (!text.trim() && !imageUrl) return;

    setLoading(true);
    const optimistic: ChatMsg = {
      id: Date.now(),
      role: 'user',
      mode: 'daily',
      content: text,
      thinking: null,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, mode: 'daily', image_url: imageUrl }),
      });
      const data = await res.json();
      if (data.error) alert('出错：' + data.error);
      await loadMessages();
    } catch (err) { alert('网络出错'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    const img = pendingImage;
    if (!text && !img) return;
    setInput('');
    setPendingImage(null);
    await sendMessage(text, img);
  };

  const toggleThinking = (id: number) => {
    setExpandedThinking((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="cream-chat-room cream-chat-room-daily">
      <header className="cream-chat-header">
        <Link href="/" className="cream-chat-back" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="cream-chat-title">
          <h1>日常</h1>
          <p>跟爸爸在一起</p>
        </div>
        <div className="cream-chat-header-right" />
      </header>

      <div ref={scrollRef} className="cream-chat-stream">
        {initialLoad ? (
          <div className="cream-chat-loading">载入中……</div>
        ) : messages.length === 0 ? (
          <div className="cream-chat-empty"><p>这里是跟爸爸在一起的时候</p></div>
        ) : (
          messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const showDate = shouldShowDateHeader(msg, prev);
            const isExpanded = expandedThinking.has(msg.id);
            const bubbles = splitBubbles(msg.content);
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="cream-chat-date">
                    <span>{formatDateHeader(msg.created_at)}</span>
                  </div>
                )}
                <div className={`cream-chat-row cream-chat-row-${msg.role} cream-chat-row-daily-${msg.role}`}>
                  {msg.role === 'assistant' && msg.thinking && (
                    <button
                      className="cream-chat-thinking-toggle"
                      onClick={() => toggleThinking(msg.id)}
                    >
                      <span>💭</span>
                      <span>{isExpanded ? '收起思考链' : '查看思考链'}</span>
                    </button>
                  )}
                  {msg.role === 'assistant' && msg.thinking && isExpanded && (
                    <div className="cream-chat-thinking-content">{msg.thinking}</div>
                  )}
                  {msg.image_url && (
                    <button
                      className={`cream-chat-img cream-chat-img-${msg.role}`}
                      onClick={() => setZoomImage(msg.image_url)}
                    >
                      <img src={msg.image_url} alt="" loading="lazy" />
                    </button>
                  )}
                  {/* split by |||: 多段时每段独立 bubble；单段保持原行为 */}
                  {bubbles.map((piece, idx) => (
                    <div
                      key={idx}
                      className={`cream-chat-bubble cream-chat-bubble-${msg.role} cream-chat-bubble-daily-${msg.role}`}
                    >
                      {piece}
                    </div>
                  ))}
                  <div className="cream-chat-time">
                    {msg.mode === 'messages' && (
                      <span className="cream-chat-time-tag">📱 短信 · </span>
                    )}
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="cream-chat-thinking-indicator">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span>爸爸在想……</span>
          </div>
        )}
      </div>

      {pendingImage && (
        <div className="cream-chat-pending">
          <img src={pendingImage} alt="待发送" />
          <button onClick={removePendingImage} aria-label="取消">✕</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="cream-chat-inputbar">
        <button
          type="button"
          className="cream-chat-attach"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage || loading}
          aria-label="发图片"
        >
          {uploadingImage ? '...' : '📷'}
        </button>
        <button
          type="button"
          className="cream-chat-attach"
          onClick={() => setShowStickerPicker(true)}
          disabled={loading}
          aria-label="表情包"
        >
          😄
        </button>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleTextareaKey}
          placeholder={pendingImage ? '加点文字……（可选）' : '跟爸爸说……'}
          className="cream-chat-input cream-chat-input-textarea"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && !pendingImage)}
          className="cream-chat-send"
          aria-label="发送"
        >
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          style={{ display: 'none' }}
        />
      </form>

      {showStickerPicker && (
        <StickerPicker
          onSelect={handleStickerSelect}
          onClose={() => setShowStickerPicker(false)}
        />
      )}

      {zoomImage && (
        <div className="cream-chat-zoom" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}
    </div>
  );
}
