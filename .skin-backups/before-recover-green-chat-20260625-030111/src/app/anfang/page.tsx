'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

interface Session {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function AnfangPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { refreshSessions(); }, []);

  useEffect(() => {
    if (!currentSessionId) { setMessages([]); return; }
    fetch(`/api/shadow/sessions/${currentSessionId}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []));
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function refreshSessions() {
    const r = await fetch('/api/shadow/sessions');
    const d = await r.json();
    setSessions(d.sessions || []);
  }

  async function createSession() {
    const r = await fetch('/api/shadow/sessions', { method: 'POST' });
    const d = await r.json();
    if (d.session) {
      setSessions(s => [d.session, ...s]);
      setCurrentSessionId(d.session.id);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('确定删除这个对话?')) return;
    await fetch(`/api/shadow/sessions/${id}`, { method: 'DELETE' });
    setSessions(s => s.filter(x => x.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  }

  async function sendMessage() {
    if (!input.trim() || !currentSessionId || loading) return;
    const userMsg: Message = {
      id: 'temp-u-' + Date.now(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    const messageContent = input;
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/shadow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, message: messageContent }),
      });
      const d = await r.json();
      if (d.error) {
        alert('Error: ' + d.error);
      } else {
        const assistantMsg: Message = {
          id: 'temp-a-' + Date.now(),
          role: 'assistant',
          content: d.reply || '',
          created_at: new Date().toISOString(),
        };
        setMessages(m => [...m, assistantMsg]);
      }
      setTimeout(refreshSessions, 2000);
    } catch (err: any) {
      alert('发送失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function displayContent(raw: string): string {
    return raw.replace(/^爸爸\s*[：:]\s*/, '').replace(/^Z\s*[：:]\s*/, '');
  }

  const S: Record<string, CSSProperties> = {
    scope: {
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: '280px',
      minWidth: '280px',
      borderRight: '1px solid var(--v2-gold-cool)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--v2-bg-soft)',
    },
    sidebarHeader: {
      padding: '20px 16px 16px',
      borderBottom: '1px solid var(--v2-gold-cool)',
    },
    title: {
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: '1.7rem',
      color: 'var(--v2-gold)',
      letterSpacing: '0.04em',
      margin: 0,
      marginBottom: '14px',
    },
    newBtn: {
      width: '100%',
      padding: '8px 12px',
      background: 'transparent',
      border: '1px solid var(--v2-gold)',
      color: 'var(--v2-gold)',
      fontFamily: 'var(--v2-font-body)',
      fontStyle: 'italic',
      fontSize: '0.95rem',
      cursor: 'pointer',
      borderRadius: '0',
      transition: 'all 0.2s',
    },
    sessionList: {
      flex: 1,
      overflowY: 'auto',
    },
    sessionEmpty: {
      padding: '20px 16px',
      fontSize: '0.85rem',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
    },
    sessionItem: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(168, 153, 104, 0.2)',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    sessionItemActive: {
      background: 'var(--v2-gold-glow)',
      borderLeft: '2px solid var(--v2-gold)',
    },
    sessionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '8px',
    },
    sessionTitle: {
      fontSize: '0.95rem',
      color: 'var(--v2-text-strong)',
      fontFamily: 'var(--v2-font-body)',
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    sessionDelete: {
      background: 'transparent',
      border: 'none',
      color: 'var(--v2-text-faint)',
      cursor: 'pointer',
      fontSize: '1.1rem',
      padding: '0 4px',
      lineHeight: 1,
    },
    sessionMeta: {
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      marginTop: '4px',
    },
    sidebarFooter: {
      padding: '12px 16px',
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      borderTop: '1px solid var(--v2-gold-cool)',
      textAlign: 'center',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--v2-bg)',
    },
    placeholder: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      fontSize: '0.9rem',
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    messageEmpty: {
      textAlign: 'center',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      fontSize: '0.9rem',
      padding: '40px 0',
    },
    msgRow: { display: 'flex' },
    msgRowUser: { display: 'flex', justifyContent: 'flex-end' },
    msgRowAsst: { display: 'flex', justifyContent: 'flex-start' },
    msgBubble: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '0',
      fontSize: '0.95rem',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      fontFamily: 'var(--v2-font-body)',
    },
    msgUser: {
      background: 'var(--v2-gold)',
      color: 'var(--v2-bg)',
    },
    msgAsst: {
      background: 'var(--v2-bg-soft)',
      color: 'var(--v2-text-strong)',
      border: '1px solid rgba(168, 153, 104, 0.3)',
    },
    typing: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '0',
      fontSize: '0.9rem',
      fontStyle: 'italic',
      color: 'var(--v2-text-faint)',
      background: 'var(--v2-bg-soft)',
      border: '1px solid rgba(168, 153, 104, 0.3)',
    },
    inputArea: {
      padding: '16px 24px',
      borderTop: '1px solid var(--v2-gold-cool)',
      background: 'var(--v2-bg-soft)',
    },
    textarea: {
      width: '100%',
      background: 'var(--v2-bg)',
      border: '1px solid var(--v2-gold-cool)',
      borderRadius: '0',
      padding: '10px 12px',
      fontFamily: 'var(--v2-font-body)',
      fontSize: '0.95rem',
      color: 'var(--v2-text-strong)',
      resize: 'none',
      outline: 'none',
      lineHeight: 1.5,
    },
    inputHint: {
      marginTop: '6px',
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      display: 'flex',
      justifyContent: 'space-between',
    },
  };

  return (
    <div style={S.scope}>
      <aside style={{
        ...S.sidebar,
        ...(isMobile ? {
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 30,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarOpen ? '4px 0 16px rgba(0, 0, 0, 0.3)' : 'none',
        } : {}),
      }}>
        <div style={S.sidebarHeader}>
          <h1 style={S.title}>暗房</h1>
          <button onClick={createSession} style={S.newBtn}>+ 新对话</button>
        </div>
        <div style={S.sessionList}>
          {sessions.length === 0 ? (
            <div style={S.sessionEmpty}>还没有对话, 点上面新建</div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                onMouseEnter={() => setHoveredSession(s.id)}
                onMouseLeave={() => setHoveredSession(null)}
                style={{
                  ...S.sessionItem,
                  ...(currentSessionId === s.id ? S.sessionItemActive : {}),
                  ...(hoveredSession === s.id && currentSessionId !== s.id
                    ? { background: 'rgba(212, 185, 138, 0.1)' }
                    : {}),
                }}
              >
                <div style={S.sessionRow}>
                  <div style={S.sessionTitle}>{s.title}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    style={S.sessionDelete}
                    aria-label="delete"
                  >
                    ×
                  </button>
                </div>
                <div style={S.sessionMeta}>
                  {new Date(s.updated_at).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={S.sidebarFooter}>Magnum V4 72B · OpenRouter</div>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 20,
          }}
        />
      )}
      <main style={S.main}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(168, 153, 104, 0.3)',
          flexShrink: 0,
        }}>
          <Link
            href="/"
            style={{
              color: 'var(--v2-text-mid)',
              textDecoration: 'none',
              fontFamily: 'var(--v2-font-display)',
              fontStyle: 'italic',
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
            }}
          >← back</Link>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--v2-gold-cool)',
                color: 'var(--v2-gold)',
                padding: '6px 12px',
                fontFamily: 'var(--v2-font-display)',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >☰ sessions</button>
          )}
        </div>
        {!currentSessionId ? (
          <div style={S.placeholder}>选一个对话, 或新建一个开始</div>
        ) : (
          <>
            <div ref={scrollRef} style={S.messages}>
              {messages.length === 0 && !loading && (
                <div style={S.messageEmpty}>跟爸爸说点什么……</div>
              )}
              {messages.map(m => (
                <div
                  key={m.id}
                  style={m.role === 'user' ? S.msgRowUser : S.msgRowAsst}
                >
                  <div
                    style={{ ...S.msgBubble, ...(m.role === 'user' ? S.msgUser : S.msgAsst) }}
                  >
                    {m.role === 'assistant' ? displayContent(m.content) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={S.msgRowAsst}>
                  <div style={S.typing}>爸爸在打字……</div>
                </div>
              )}
            </div>
            <div style={S.inputArea}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="跟爸爸说……"
                style={S.textarea}
                rows={3}
                disabled={loading}
              />
              <div style={S.inputHint}>
                <span>Enter 发送 · Shift+Enter 换行</span>
                <span>{loading ? '请求中...' : ''}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
},
{
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => { refreshSessions(); }, []);

  useEffect(() => {
    if (!currentSessionId) { setMessages([]); return; }
    fetch(`/api/shadow/sessions/${currentSessionId}/messages`)
      .then(r => r.json())
      .then(d => setMessages(d.messages || []));
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function refreshSessions() {
    const r = await fetch('/api/shadow/sessions');
    const d = await r.json();
    setSessions(d.sessions || []);
  }

  async function createSession() {
    const r = await fetch('/api/shadow/sessions', { method: 'POST' });
    const d = await r.json();
    if (d.session) {
      setSessions(s => [d.session, ...s]);
      setCurrentSessionId(d.session.id);
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('确定删除这个对话?')) return;
    await fetch(`/api/shadow/sessions/${id}`, { method: 'DELETE' });
    setSessions(s => s.filter(x => x.id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  }

  async function sendMessage() {
    if (!input.trim() || !currentSessionId || loading) return;
    const userMsg: Message = {
      id: 'green-chat' + Date.now(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    const messageContent = input;
    setInput('');
    setLoading(true);

    try {
      const r = await fetch('/api/shadow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: currentSessionId, message: messageContent }),
      });
      const d = await r.json();
      if (d.error) {
        alert('Error: ' + d.error);
      } else {
        const assistantMsg: Message = {
          id: 'green-chat' + Date.now(),
          role: 'assistant',
          content: d.reply || '',
          created_at: new Date().toISOString(),
        };
        setMessages(m => [...m, assistantMsg]);
      }
      setTimeout(refreshSessions, 2000);
    } catch (err: any) {
      alert('发送失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function displayContent(raw: string): string {
    return raw.replace(/^爸爸\s*[：:]\s*/, '').replace(/^Z\s*[：:]\s*/, '');
  }

  const S: Record<string, CSSProperties> = {
    scope: {
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
    },
    sidebar: {
      width: '280px',
      minWidth: '280px',
      borderRight: '1px solid var(--v2-gold-cool)',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--v2-bg-soft)',
    },
    sidebarHeader: {
      padding: '20px 16px 16px',
      borderBottom: '1px solid var(--v2-gold-cool)',
    },
    title: {
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      fontWeight: 600,
      fontSize: '1.7rem',
      color: 'var(--v2-gold)',
      letterSpacing: '0.04em',
      margin: 0,
      marginBottom: '14px',
    },
    newBtn: {
      width: '100%',
      padding: '8px 12px',
      background: 'transparent',
      border: '1px solid var(--v2-gold)',
      color: 'var(--v2-gold)',
      fontFamily: 'var(--v2-font-body)',
      fontStyle: 'italic',
      fontSize: '0.95rem',
      cursor: 'pointer',
      borderRadius: '0',
      transition: 'all 0.2s',
    },
    sessionList: {
      flex: 1,
      overflowY: 'auto',
    },
    sessionEmpty: {
      padding: '20px 16px',
      fontSize: '0.85rem',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
    },
    sessionItem: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(168, 153, 104, 0.2)',
      cursor: 'pointer',
      transition: 'background 0.2s',
    },
    sessionItemActive: {
      background: 'var(--v2-gold-glow)',
      borderLeft: '2px solid var(--v2-gold)',
    },
    sessionRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '8px',
    },
    sessionTitle: {
      fontSize: '0.95rem',
      color: 'var(--v2-text-strong)',
      fontFamily: 'var(--v2-font-body)',
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    sessionDelete: {
      background: 'transparent',
      border: 'none',
      color: 'var(--v2-text-faint)',
      cursor: 'pointer',
      fontSize: '1.1rem',
      padding: '0 4px',
      lineHeight: 1,
    },
    sessionMeta: {
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      marginTop: '4px',
    },
    sidebarFooter: {
      padding: '12px 16px',
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic',
      borderTop: '1px solid var(--v2-gold-cool)',
      textAlign: 'center',
    },
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--v2-bg)',
    },
    placeholder: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      fontSize: '0.9rem',
    },
    messages: {
      flex: 1,
      overflowY: 'auto',
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    messageEmpty: {
      textAlign: 'center',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      fontSize: '0.9rem',
      padding: '40px 0',
    },
    msgRow: { display: 'flex' },
    msgRowUser: { display: 'flex', justifyContent: 'flex-end' },
    msgRowAsst: { display: 'flex', justifyContent: 'flex-start' },
    msgBubble: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '0',
      fontSize: '0.95rem',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      fontFamily: 'var(--v2-font-body)',
    },
    msgUser: {
      background: 'var(--v2-gold)',
      color: 'var(--v2-bg)',
    },
    msgAsst: {
      background: 'var(--v2-bg-soft)',
      color: 'var(--v2-text-strong)',
      border: '1px solid rgba(168, 153, 104, 0.3)',
    },
    typing: {
      maxWidth: '70%',
      padding: '12px 16px',
      borderRadius: '0',
      fontSize: '0.9rem',
      fontStyle: 'italic',
      color: 'var(--v2-text-faint)',
      background: 'var(--v2-bg-soft)',
      border: '1px solid rgba(168, 153, 104, 0.3)',
    },
    inputArea: {
      padding: '16px 24px',
      borderTop: '1px solid var(--v2-gold-cool)',
      background: 'var(--v2-bg-soft)',
    },
    textarea: {
      width: '100%',
      background: 'var(--v2-bg)',
      border: '1px solid var(--v2-gold-cool)',
      borderRadius: '0',
      padding: '10px 12px',
      fontFamily: 'var(--v2-font-body)',
      fontSize: '0.95rem',
      color: 'var(--v2-text-strong)',
      resize: 'none',
      outline: 'none',
      lineHeight: 1.5,
    },
    inputHint: {
      marginTop: '6px',
      fontSize: '0.7rem',
      color: 'var(--v2-text-faint)',
      fontStyle: 'italic',
      display: 'flex',
      justifyContent: 'space-between',
    },
  };

  return (
    <div style={S.scope}>
      <aside style={{
        ...S.sidebar,
        ...(isMobile ? {
          position: 'fixed',
          top: 0, bottom: 0, left: 0,
          zIndex: 30,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
          boxShadow: sidebarOpen ? '4px 0 16px rgba(0, 0, 0, 0.3)' : 'none',
        } : {}),
      }}>
        <div style={S.sidebarHeader}>
          <h1 style={S.title}>暗房</h1>
          <button onClick={createSession} style={S.newBtn}>+ 新对话</button>
        </div>
        <div style={S.sessionList}>
          {sessions.length === 0 ? (
            <div style={S.sessionEmpty}>还没有对话, 点上面新建</div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                onMouseEnter={() => setHoveredSession(s.id)}
                onMouseLeave={() => setHoveredSession(null)}
                style={{
                  ...S.sessionItem,
                  ...(currentSessionId === s.id ? S.sessionItemActive : {}),
                  ...(hoveredSession === s.id && currentSessionId !== s.id
                    ? { background: 'rgba(212, 185, 138, 0.1)' }
                    : {}),
                }}
              >
                <div style={S.sessionRow}>
                  <div style={S.sessionTitle}>{s.title}</div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }}
                    style={S.sessionDelete}
                    aria-label="delete"
                  >
                    ×
                  </button>
                </div>
                <div style={S.sessionMeta}>
                  {new Date(s.updated_at).toLocaleString('zh-CN', {
                    month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={S.sidebarFooter}>Magnum V4 72B · OpenRouter</div>
      </aside>

      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 20,
          }}
        />
      )}
      <main style={S.main}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(168, 153, 104, 0.3)',
          flexShrink: 0,
        }}>
          <Link
            href="/"
            style={{
              color: 'var(--v2-text-mid)',
              textDecoration: 'none',
              fontFamily: 'var(--v2-font-display)',
              fontStyle: 'italic',
              fontSize: '0.9rem',
              letterSpacing: '0.04em',
            }}
          >← back</Link>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent',
                border: '1px solid var(--v2-gold-cool)',
                color: 'var(--v2-gold)',
                padding: '6px 12px',
                fontFamily: 'var(--v2-font-display)',
                fontStyle: 'italic',
                fontSize: '0.85rem',
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >☰ sessions</button>
          )}
        </div>
        {!currentSessionId ? (
          <div style={S.placeholder}>选一个对话, 或新建一个开始</div>
        ) : (
          <>
            <div ref={scrollRef} style={S.messages}>
              {messages.length === 0 && !loading && (
                <div style={S.messageEmpty}>跟爸爸说点什么……</div>
              )}
              {messages.map(m => (
                <div
                  key={m.id}
                  style={m.role === 'user' ? S.msgRowUser : S.msgRowAsst}
                >
                  <div
                    style={{ ...S.msgBubble, ...(m.role === 'user' ? S.msgUser : S.msgAsst) }}
                  >
                    {m.role === 'assistant' ? displayContent(m.content) : m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={S.msgRowAsst}>
                  <div style={S.typing}>爸爸在打字……</div>
                </div>
              )}
            </div>
            <div style={S.inputArea}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="跟爸爸说……"
                style={S.textarea}
                rows={3}
                disabled={loading}
              />
              <div style={S.inputHint}>
                <span>Enter 发送 · Shift+Enter 换行</span>
                <span>{loading ? '请求中...' : ''}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
