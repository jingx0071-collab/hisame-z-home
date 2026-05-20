'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type ChatMsg = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking: string | null;
  image_url: string | null;
  created_at: string;
};

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const maxH = 2400;
        let { width, height } = img;
        if (width > maxW) {
          height = (height * maxW) / width;
          width = maxW;
        }
        if (height > maxH) {
          width = (width * maxH) / height;
          height = maxH;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('img fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsDataURL(file);
  });
}

export default function TrainingSession() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/chat?mode=training&session_id=${sessionId}&limit=200`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) {
      console.error(e);
    } finally {
      setInitialLoad(false);
    }
  };

  const loadSession = async () => {
    try {
      const res = await fetch(`/api/training/sessions/${sessionId}`);
      const data = await res.json();
      if (data.session?.title) setSessionTitle(data.session.title);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // sessionId 切换时立刻清空 state，避免显示老 session 残留
    setMessages([]);
    setSessionTitle(null);
    setInitialLoad(true);
    setInput('');
    setPendingImage(null);
    setLoading(false);
    loadMessages();
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('图片太大');
      return;
    }
    setUploadingImage(true);
    try {
      const dataUri = await compressImage(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: dataUri, folder: 'training' }),
      });
      const data = await res.json();
      if (data.error) {
        alert('上传失败：' + data.error);
        return;
      }
      setPendingImage(data.url);
    } catch (e) {
      alert('图片处理失败');
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (loading) return;
    const text = input.trim();
    if (!text && !pendingImage) return;

    setLoading(true);
    const optimisticUserId = Date.now();
    const optimisticUser: ChatMsg = {
      id: optimisticUserId,
      role: 'user',
      content: text,
      thinking: null,
      image_url: pendingImage,
      created_at: new Date().toISOString(),
    };
    // streaming assistant 占位（id 用负数避免冲突）
    const streamingAssistantId = -optimisticUserId;
    const streamingPlaceholder: ChatMsg = {
      id: streamingAssistantId,
      role: 'assistant',
      content: '',
      thinking: '',
      image_url: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser, streamingPlaceholder]);
    setInput('');
    const img = pendingImage;
    setPendingImage(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          mode: 'training',
          session_id: sessionId,
          image_url: img,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        alert('出错：' + (errText || res.statusText));
        // remove optimistic streaming placeholder
        setMessages((prev) => prev.filter((m) => m.id !== streamingAssistantId));
        setLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let liveThinking = '';
      let liveContent = '';
      let thinkingBlocked = false;

      // 检测 model 偶尔在 thinking 阶段自审 produce 的英文 refusal——不显示
      const REFUSAL_PATTERN = /I can'?t|I cannot|I won'?t|I'm not able|regardless of (?:the )?fram|happy to help with|sexual content|explicit content|other thinking you'?d like/i;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: any;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === 'thinking') {
            if (thinkingBlocked) continue;
            liveThinking += event.delta || '';
            // 累积到一定长度后检测 refusal
            if (REFUSAL_PATTERN.test(liveThinking)) {
              thinkingBlocked = true;
              liveThinking = '';
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === streamingAssistantId ? { ...m, thinking: null } : m
                )
              );
              continue;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingAssistantId
                  ? { ...m, thinking: liveThinking }
                  : m
              )
            );
          } else if (event.type === 'content') {
            liveContent += event.delta || '';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === streamingAssistantId
                  ? { ...m, content: liveContent }
                  : m
              )
            );
          } else if (event.type === 'done') {
            // replace optimistic with persisted
            setMessages((prev) => {
              const filtered = prev.filter(
                (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
              );
              return [...filtered, event.user_message, event.assistant_message];
            });
            setTimeout(() => loadSession(), 2000);
          } else if (event.type === 'error') {
            alert('出错：' + event.error);
            setMessages((prev) =>
              prev.filter(
                (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
              )
            );
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '网络出错';
      alert('网络出错：' + msg);
      setMessages((prev) =>
        prev.filter(
          (m) => m.id !== optimisticUserId && m.id !== streamingAssistantId
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(26, 6, 6, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #3a1818',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push('/training')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#c9a978',
            cursor: 'pointer',
            fontSize: 22,
            padding: 0,
          }}
        >
          ←
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              color: '#f0e6d8',
              fontFamily: '"Playfair Display", serif',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sessionTitle || 'Z 先生的调教室'}
          </div>
        </div>
      </header>

      {/* Stream */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 20px 16px',
          maxWidth: 760,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {initialLoad ? (
          <div style={{ color: '#a89070', textAlign: 'center', padding: 40, fontStyle: 'italic' }}>
            载入中……
          </div>
        ) : messages.length === 0 ? (
          <div
            style={{
              color: '#a89070',
              textAlign: 'center',
              padding: '80px 20px',
              fontStyle: 'italic',
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            一个 setup，一句话，一个动作。
            <br />
            然后开始。
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={{ marginBottom: 28 }}>
              {msg.role === 'user' ? (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div
                    style={{
                      maxWidth: '78%',
                      padding: '12px 16px',
                      background: 'linear-gradient(135deg, #5a2020, #4a1818)',
                      color: '#f0e6d8',
                      borderRadius: '14px 14px 4px 14px',
                      fontSize: 15.5,
                      lineHeight: 1.6,
                      fontFamily: '"EB Garamond", "Songti SC", serif',
                    }}
                  >
                    {msg.image_url && (
                      <img
                        src={msg.image_url}
                        alt=""
                        style={{ maxWidth: '100%', borderRadius: 6, marginBottom: msg.content ? 8 : 0 }}
                      />
                    )}
                    {msg.content && <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>}
                  </div>
                </div>
              ) : (
                <div>
                  {msg.thinking && (
                    <details
                      style={{
                        marginBottom: 12,
                        padding: '10px 14px',
                        background: '#160404',
                        border: '1px solid #2a1010',
                        borderRadius: 8,
                        fontSize: 13.5,
                        color: '#8a7050',
                        fontStyle: 'italic',
                        lineHeight: 1.65,
                      }}
                    >
                      <summary
                        style={{
                          cursor: 'pointer',
                          fontSize: 12,
                          color: '#7a5050',
                          letterSpacing: '0.05em',
                          marginBottom: 4,
                          fontStyle: 'normal',
                        }}
                      >
                        Z 在想……
                      </summary>
                      <div style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{msg.thinking}</div>
                    </details>
                  )}
                  <div
                    style={{
                      maxWidth: '100%',
                      fontSize: 16.5,
                      lineHeight: 1.85,
                      color: '#f0e6d8',
                      fontFamily: '"EB Garamond", "Songti SC", serif',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div
            style={{
              padding: 16,
              color: '#a89070',
              fontStyle: 'italic',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span className="dot-pulse">·</span>
            <span className="dot-pulse" style={{ animationDelay: '0.2s' }}>
              ·
            </span>
            <span className="dot-pulse" style={{ animationDelay: '0.4s' }}>
              ·
            </span>
            <span>Z 在想……</span>
          </div>
        )}
        <style jsx>{`
          .dot-pulse {
            display: inline-block;
            animation: pulse 1.2s ease-in-out infinite;
            font-size: 20px;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>

      {/* Pending image preview */}
      {pendingImage && (
        <div
          style={{
            padding: '8px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderTop: '1px solid #3a1818',
            background: '#1a0606',
          }}
        >
          <img
            src={pendingImage}
            alt="待发送"
            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }}
          />
          <button
            onClick={() => setPendingImage(null)}
            style={{
              background: '#3a1818',
              border: 'none',
              color: '#f0e6d8',
              borderRadius: 4,
              cursor: 'pointer',
              padding: '4px 10px',
              fontSize: 13,
            }}
          >
            取消
          </button>
        </div>
      )}

      {/* Input bar */}
      <div
        style={{
          padding: '14px 20px 20px',
          borderTop: '1px solid #3a1818',
          background: '#1a0606',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}
      >
        <button
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage || loading}
          style={{
            background: 'transparent',
            border: '1px solid #3a1818',
            color: '#c9a978',
            borderRadius: 6,
            padding: '8px 10px',
            cursor: uploadingImage || loading ? 'wait' : 'pointer',
            fontSize: 16,
          }}
          aria-label="图片"
        >
          {uploadingImage ? '…' : '📷'}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="想被怎么调教……"
          disabled={loading}
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: '#2a0e0e',
            border: '1px solid #3a1818',
            borderRadius: 8,
            color: '#f0e6d8',
            fontSize: 15,
            fontFamily: '"EB Garamond", "Songti SC", serif',
            resize: 'none',
            outline: 'none',
            minHeight: 38,
            maxHeight: 120,
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || (!input.trim() && !pendingImage)}
          style={{
            background: loading ? '#3a1818' : 'linear-gradient(135deg, #8b1a1a, #5a1010)',
            border: 'none',
            color: '#f0e6d8',
            borderRadius: 6,
            padding: '10px 14px',
            cursor: loading ? 'wait' : 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
            opacity: loading || (!input.trim() && !pendingImage) ? 0.5 : 1,
          }}
        >
          ▶
        </button>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
