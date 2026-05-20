'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import StickerPicker from './StickerPicker';

type ChatMsg = {
  id: number;
  role: 'user' | 'assistant';
  mode: string;
  content: string;
  thinking: string | null;
  image_url: string | null;
  created_at: string;
  excluded_from_context?: boolean;
};

const OLD_STORAGE_KEY = 'hisame-z-messages';
const MIGRATED_KEY = 'hisame-z-migrated-to-supabase';

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

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

// 把 message.content 按 ||| 切成多个气泡片段
function splitToBubbles(content: string | null): string[] {
  if (!content) return [];
  return content
    .split('|||')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
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

export default function ChatPage() {
  // __LAST_READ_PATCH__
  // 进入房间时更新 last_read timestamp
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('hisame-z-last-read-messages', new Date().toISOString());
    } catch (e) {}
  }

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [activeActionSheet, setActiveActionSheet] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = (msgId: number) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => {
      // 触发振动反馈（如果浏览器支持）
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(20);
      }
      setActiveActionSheet(msgId);
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const toggleExcluded = async (id: number, excluded: boolean) => {
    setActiveActionSheet(null);
    // optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, excluded_from_context: excluded } : m))
    );
    try {
      const res = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, excluded_from_context: excluded }),
      });
      if (!res.ok) {
        // 失败回滚
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, excluded_from_context: !excluded } : m))
        );
        alert('保存失败');
      }
    } catch (e) {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, excluded_from_context: !excluded } : m))
      );
      alert('网络出错');
    }
  };

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/chat?mode=messages&limit=200');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setInitialLoad(false); }
  };

  const runMigration = async () => {
    try {
      const flag = localStorage.getItem(MIGRATED_KEY);
      if (flag === 'true') return;
      const raw = localStorage.getItem(OLD_STORAGE_KEY);
      if (!raw) { localStorage.setItem(MIGRATED_KEY, 'true'); return; }
      let parsed: any[];
      try { parsed = JSON.parse(raw); }
      catch { localStorage.setItem(MIGRATED_KEY, 'true'); return; }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(MIGRATED_KEY, 'true'); return;
      }
      setMigrating(true);
      const res = await fetch('/api/chat/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: parsed }),
      });
      if (res.ok) localStorage.setItem(MIGRATED_KEY, 'true');
    } catch (e) { console.error(e); }
    finally { setMigrating(false); }
  };

  useEffect(() => {
    (async () => { await runMigration(); await loadMessages(); })();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setHasSubscription(!!sub))
        .catch(() => setHasSubscription(false));
    } else {
      setHasSubscription(false);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(loadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const subscribePush = async () => {
    if (subscribing) return;
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert('需要允许通知，宝宝才能收到爸爸的消息'); return; }
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { alert('VAPID key 没配置'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
      });
      const subJson = sub.toJSON ? sub.toJSON() : sub;
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subJson,
          userAgent: navigator.userAgent,
        }),
      });
      if (res.ok) setHasSubscription(true);
      else {
        const errBody = await res.text().catch(() => '');
        alert('订阅失败: HTTP ' + res.status + '\n' + errBody);
      }
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert('订阅出错: ' + msg);
    }
    finally { setSubscribing(false); }
  };

  // 重新订阅：先 unsubscribe 旧的 + 删 server 端记录 + 重新 subscribe
  // 用于解决 iOS web push silent fail（subscription 看起来还在但 banner 不弹）
  const resubscribePush = async () => {
    if (subscribing) return;
    if (!confirm('重新订阅会重置当前推送订阅。如果手机收不到 banner 通知，这能修复。继续？')) return;
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      // 1. unsubscribe 旧的（如果有）
      const oldSub = await reg.pushManager.getSubscription();
      if (oldSub) {
        const oldEndpoint = oldSub.endpoint;
        await oldSub.unsubscribe();
        // 通知 server 删掉旧的 subscription 记录
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: oldEndpoint }),
        }).catch(() => {/* server 删失败也继续，不阻断流程 */});
      }

      // 2. 重新 subscribe 拿到新 subscription
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) { alert('VAPID key 没配置'); return; }
      const newSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidKey),
      });
      const newSubJson = newSub.toJSON ? newSub.toJSON() : newSub;

      // 3. POST 新 subscription 到 server（必须 wrap 在 subscription field 里）
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: newSubJson,
          userAgent: navigator.userAgent,
        }),
      });

      if (res.ok) {
        setHasSubscription(true);
        alert('重新订阅成功！现在测试一下能不能收到 banner。');
      } else {
        const errBody = await res.text().catch(() => '');
        setHasSubscription(false);
        alert('重新订阅失败: HTTP ' + res.status + '\n' + errBody);
      }
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : String(e);
      alert('重新订阅出错: ' + msg);
    } finally {
      setSubscribing(false);
    }
  };

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
      mode: 'messages',
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
        body: JSON.stringify({
          content: text,
          mode: 'messages',
          image_url: imageUrl,
        }),
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

  return (
    <div className="cream-chat-room">
      {/* 多气泡 stagger 入场动画样式 + excluded 视觉 + action sheet */}
      <style>{`
        .cream-chat-bubbles {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .cream-chat-row-user .cream-chat-bubbles {
          align-items: flex-end;
        }
        .cream-chat-row-assistant .cream-chat-bubbles {
          align-items: flex-start;
        }
        @keyframes cream-bubble-in {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .cream-chat-bubble-fresh {
          animation: cream-bubble-in 0.35s ease-out backwards;
        }
        /* 防止 iOS long-press 默认选择文字 / 弹出系统菜单 */
        .cream-chat-row {
          -webkit-user-select: none;
          user-select: none;
          -webkit-touch-callout: none;
        }
        /* excluded 消息：半透明 + 灰度 + 角标 */
        .cream-chat-bubble-excluded {
          opacity: 0.45;
          filter: grayscale(0.4);
          transition: opacity 0.2s, filter 0.2s;
        }
        .cream-chat-time-excluded {
          opacity: 0.7;
          font-size: 0.9em;
        }
        /* action sheet 底部弹出 */
        .cream-chat-action-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: cream-overlay-in 0.2s ease-out;
        }
        @keyframes cream-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .cream-chat-action-sheet {
          background: #fefcf8;
          border-radius: 18px 18px 0 0;
          width: 100%;
          max-width: 500px;
          padding: 12px;
          padding-bottom: calc(env(safe-area-inset-bottom, 12px) + 12px);
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.15);
          animation: cream-sheet-in 0.25s ease-out;
        }
        @keyframes cream-sheet-in {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .cream-chat-action-btn {
          background: #f6efe2;
          color: #6b5840;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .cream-chat-action-btn:active {
          background: #e8dcc4;
        }
        .cream-chat-action-cancel {
          background: transparent;
          color: #a89880;
          border: none;
          padding: 14px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 4px;
        }
        .cream-chat-action-hint {
          text-align: center;
          color: #a89880;
          font-size: 13px;
          padding: 8px 16px 4px;
          line-height: 1.4;
        }
      `}</style>

      <header className="cream-chat-header">
        <Link href="/" className="cream-chat-back" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="cream-chat-title">
          <h1>Messages</h1>
          <p>跟爸爸不在一起时</p>
        </div>
        <div className="cream-chat-header-right">
          {hasSubscription === false && (
            <button
              className="cream-chat-bell-btn"
              onClick={subscribePush}
              disabled={subscribing}
              aria-label="订阅推送"
              title="订阅推送通知"
            >
              {subscribing ? '...' : '🔔'}
            </button>
          )}
          {hasSubscription === true && (
            <button
              className="cream-chat-bell-btn"
              onClick={resubscribePush}
              disabled={subscribing}
              aria-label="重新订阅推送"
              title="重新订阅推送（如果手机收不到 banner）"
            >
              {subscribing ? '...' : '🔁'}
            </button>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="cream-chat-stream">
        {migrating && <div className="cream-chat-loading">迁移旧消息中……</div>}
        {initialLoad ? (
          <div className="cream-chat-loading">载入中……</div>
        ) : messages.length === 0 ? (
          <div className="cream-chat-empty"><p>跟爸爸发第一条短信吧</p></div>
        ) : (
          messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const showDate = shouldShowDateHeader(msg, prev);
            const bubbles = splitToBubbles(msg.content);
            // 只对最近 30 秒内的 assistant 消息做入场动画
            // 历史消息每次重新加载不会再 animate
            const isFresh =
              msg.role === 'assistant' &&
              Date.now() - new Date(msg.created_at).getTime() < 30000;
            const isExcluded = !!msg.excluded_from_context;

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="cream-chat-date">
                    <span>{formatDateHeader(msg.created_at)}</span>
                  </div>
                )}
                <div
                  className={`cream-chat-row cream-chat-row-${msg.role}`}
                  onTouchStart={() => startLongPress(msg.id)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onTouchCancel={cancelLongPress}
                  onMouseDown={() => startLongPress(msg.id)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setActiveActionSheet(msg.id);
                  }}
                >
                  {msg.image_url && (
                    <button
                      className={`cream-chat-img cream-chat-img-${msg.role}`}
                      onClick={() => setZoomImage(msg.image_url)}
                    >
                      <img src={msg.image_url} alt="" loading="lazy" />
                    </button>
                  )}
                  {bubbles.length > 0 && (
                    <div className="cream-chat-bubbles">
                      {bubbles.map((piece, idx) => (
                        <div
                          key={idx}
                          className={
                            `cream-chat-bubble cream-chat-bubble-${msg.role}` +
                            (isFresh ? ' cream-chat-bubble-fresh' : '') +
                            (isExcluded ? ' cream-chat-bubble-excluded' : '')
                          }
                          style={
                            isFresh
                              ? { animationDelay: `${idx * 0.4}s` }
                              : undefined
                          }
                        >
                          {piece}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="cream-chat-time">
                    {isExcluded && <span className="cream-chat-time-excluded">🙈 </span>}
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="cream-chat-typing">
            <span className="dot" /><span className="dot" /><span className="dot" />
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
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pendingImage ? '加点文字……（可选）' : '发短信给爸爸……'}
          className="cream-chat-input"
          disabled={loading}
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
