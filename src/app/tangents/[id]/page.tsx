'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking: string | null;
  created_at: string;
}

interface SessionInfo {
  id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
}

function formatTime(iso: string): string {
  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return fmt.format(new Date(iso));
}

export default function TangentChatPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function loadSession() {
    setLoading(true);
    try {
      const res = await fetch(`/api/tangents/sessions/${sessionId}`);
      const data = await res.json();
      if (data.session) setSession(data.session);
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error('Load session failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionId) loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // 自动滚到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || sending) return;

    setSending(true);
    setInput('');

    // optimistic 添加 user message
    const optimisticUser: Message = {
      id: Date.now(),
      role: 'user',
      content,
      thinking: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'tangent',
          session_id: sessionId,
          content,
        }),
      });
      const data = await res.json();
      if (data.error) {
        alert('出错：' + data.error);
        // 把 optimistic 移除
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      } else {
        // 用 server 返回的真实消息替换 optimistic + 添加 assistant
        setMessages((prev) => {
          const withoutOpt = prev.filter((m) => m.id !== optimisticUser.id);
          return [...withoutOpt, data.user_message, data.assistant_message];
        });
        // 如果是第一条消息，session title 可能马上生成——刷新 session info
        if (!session?.title) {
          setTimeout(loadSession, 3000);
        }
      }
    } catch (e) {
      alert('网络错误：' + (e instanceof Error ? e.message : ''));
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="tangent-chat">
      <header className="tangent-chat-header">
        <button
          className="tangent-back"
          onClick={() => router.push('/tangents')}
          aria-label="返回"
        >
          ‹
        </button>
        <h1 className="tangent-chat-title pixel-font">
          {session?.title || '碎碎念'}
        </h1>
        <div className="tangent-spacer" />
      </header>

      <div ref={scrollRef} className="tangent-messages">
        {loading ? (
          <div className="tangent-empty">加载中...</div>
        ) : messages.length === 0 ? (
          <div className="tangent-empty">
            说点什么吧
            <br />
            随便聊聊
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`tangent-msg ${
                m.role === 'user' ? 'tangent-msg-right' : 'tangent-msg-left'
              }`}
            >
              <div className="tangent-msg-meta pixel-font">
                <span className="tangent-msg-name">
                  {m.role === 'user' ? '宝宝' : '爸爸'}
                </span>
                <span className="tangent-msg-time">
                  {formatTime(m.created_at)}
                </span>
              </div>
              <div className="tangent-msg-content">{m.content}</div>
              {m.role === 'assistant' && m.thinking && (
                <details className="tangent-thinking">
                  <summary className="tangent-thinking-summary pixel-font">
                    · 思考
                  </summary>
                  <div className="tangent-thinking-content">{m.thinking}</div>
                </details>
              )}
            </div>
          ))
        )}
      </div>

      <footer className="tangent-input-bar">
        <textarea
          className="tangent-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="说点什么..."
          rows={1}
          disabled={sending}
        />
        <button
          className="tangent-send"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="发送"
        >
          {sending ? '...' : '➤'}
        </button>
      </footer>

      <style jsx>{`
        .tangent-chat {
          min-height: 100vh;
          max-height: 100vh;
          background: linear-gradient(180deg, #f6f1e8 0%, #efe6d4 100%);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC',
            'Microsoft YaHei', sans-serif;
        }

        .tangent-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 56px 16px 14px;
          backdrop-filter: blur(10px);
          background: rgba(246, 241, 232, 0.6);
          position: sticky;
          top: 0;
          z-index: 10;
          border-bottom: 1px solid rgba(180, 160, 130, 0.15);
        }

        .tangent-back {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          border: none;
          font-size: 22px;
          color: #6b5a45;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tangent-chat-title {
          flex: 1;
          text-align: center;
          font-size: 16px;
          color: #4a3c28;
          letter-spacing: 1.5px;
          margin: 0 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pixel-font {
          font-family: var(--font-pixel), 'PingFang SC', 'Microsoft YaHei',
            monospace;
        }

        .tangent-spacer {
          width: 36px;
        }

        .tangent-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .tangent-empty {
          text-align: center;
          padding: 80px 24px;
          color: #9d8b71;
          line-height: 1.8;
          font-size: 14px;
        }

        .tangent-msg {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 85%;
        }
        .tangent-msg-left {
          align-self: flex-start;
        }
        .tangent-msg-right {
          align-self: flex-end;
          align-items: flex-end;
        }

        .tangent-msg-meta {
          display: flex;
          gap: 8px;
          font-size: 11px;
          color: #b8a387;
          letter-spacing: 0.5px;
        }
        .tangent-msg-name {
          color: #8a7558;
          font-weight: 500;
        }

        .tangent-msg-content {
          font-size: 15px;
          color: #3d3022;
          line-height: 1.6;
          padding: 2px 4px;
          word-break: break-word;
        }

        .tangent-thinking {
          margin-top: 6px;
          font-size: 13px;
          align-self: stretch;
          max-width: 100%;
        }
        .tangent-thinking-summary {
          cursor: pointer;
          user-select: none;
          color: #b8a387;
          padding: 4px 6px;
          letter-spacing: 1.5px;
          font-size: 12px;
          list-style: none;
          display: inline-block;
        }
        .tangent-thinking-summary::-webkit-details-marker {
          display: none;
        }
        .tangent-thinking-summary::before {
          content: '▸ ';
          font-size: 10px;
          color: #c9b89e;
        }
        .tangent-thinking[open] .tangent-thinking-summary::before {
          content: '▾ ';
        }
        .tangent-thinking-summary:hover {
          color: #8a7558;
        }
        .tangent-thinking-content {
          margin-top: 6px;
          padding: 12px 14px;
          background: rgba(255, 255, 255, 0.4);
          border-left: 2px solid rgba(180, 160, 130, 0.45);
          border-radius: 2px;
          line-height: 1.75;
          color: #6b5a45;
          font-size: 13px;
          white-space: pre-wrap;
          word-break: break-word;
        }

        .tangent-input-bar {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 10px 14px 28px;
          background: rgba(246, 241, 232, 0.85);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(180, 160, 130, 0.15);
        }

        .tangent-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.7);
          border: none;
          border-radius: 18px;
          padding: 10px 14px;
          font-size: 15px;
          color: #3d3022;
          resize: none;
          max-height: 100px;
          font-family: inherit;
          outline: none;
        }
        .tangent-input:focus {
          background: rgba(255, 255, 255, 0.9);
        }
        .tangent-input:disabled {
          opacity: 0.5;
        }

        .tangent-send {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #c9824a;
          border: none;
          color: white;
          font-size: 14px;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s, transform 0.1s;
        }
        .tangent-send:active {
          transform: scale(0.94);
        }
        .tangent-send:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
