'use client';

import PulsePeek from '../_components/PulsePeek'

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
  thinking?: string | null;
  created_at: string;
}

export default function AnfangPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [hoveredSession, setHoveredSession] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [retracting, setRetracting] = useState<string | null>(null);
  const [expandedThinking, setExpandedThinking] = useState<Record<string, boolean>>({});
  const [justCopiedId, setJustCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
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
  }, [messages, streamingMsgId]);

  async function refreshSessions() {
    const r = await fetch('/api/shadow/sessions');
    const d = await r.json();
    setSessions(d.sessions || []);
  }

  async function reloadMessages() {
    if (!currentSessionId) return;
    const r = await fetch(`/api/shadow/sessions/${currentSessionId}/messages`);
    const d = await r.json();
    setMessages(d.messages || []);
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
    const text = input.trim();
    if (!text || !currentSessionId || streamingMsgId) return;

    const userMsg: Message = {
      id: 'temp-u-' + Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    const placeholderId = 'temp-a-' + Date.now();
    const placeholder: Message = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      thinking: '',
      created_at: new Date().toISOString(),
    };

    setMessages(m => [...m, userMsg, placeholder]);
    setInput('');
    setStreamingMsgId(placeholderId);
    setExpandedThinking(e => ({ ...e, [placeholderId]: true }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const r = await fetch('/api/shadow/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: currentSessionId, content: text }),
        signal: controller.signal,
      });

      if (!r.ok || !r.body) {
        const errText = await r.text().catch(() => '');
        throw new Error(errText || `HTTP ${r.status}`);
      }

      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let ev: { type: string; delta?: string; error?: string; user_message?: { id: string; created_at: string }; assistant_message?: { id: string; created_at: string } };
          try { ev = JSON.parse(trimmed); } catch { continue; }

          if (ev.type === 'content') {
            setMessages(m => m.map(x =>
              x.id === placeholderId
                ? { ...x, content: x.content + (ev.delta || '') }
                : x
            ));
          } else if (ev.type === 'thinking') {
            setMessages(m => m.map(x =>
              x.id === placeholderId
                ? { ...x, thinking: (x.thinking || '') + (ev.delta || '') }
                : x
            ));
          } else if (ev.type === 'done') {
            if (ev.user_message && ev.assistant_message) {
              const uReal = ev.user_message;
              const aReal = ev.assistant_message;
              setMessages(m => m.map(x => {
                if (x.id === userMsg.id) return { ...x, id: uReal.id, created_at: uReal.created_at };
                if (x.id === placeholderId) return { ...x, id: aReal.id, created_at: aReal.created_at };
                return x;
              }));
              setExpandedThinking(e => {
                const next = { ...e };
                delete next[placeholderId];
                return next;
              });
            }
          } else if (ev.type === 'error') {
            alert('生成失败: ' + ev.error);
          }
        }
      }
      setTimeout(refreshSessions, 500);
    } catch (err) {
      const anyErr = err as { name?: string; message?: string };
      if (anyErr?.name === 'AbortError') {
        setTimeout(reloadMessages, 300);
      } else {
        alert('发送失败: ' + (anyErr?.message || String(err)));
      }
    } finally {
      setStreamingMsgId(null);
      abortRef.current = null;
    }
  }

  function stopStreaming() {
    if (abortRef.current) abortRef.current.abort();
  }

  async function retractMessage(msg: Message) {
    if (retracting || !currentSessionId) return;
    if (msg.id.startsWith('temp-')) return;
    const isUser = msg.role === 'user';
    const text = isUser
      ? '撤回这条消息? 后续爸爸的回复也会一起删掉, 原文会填回输入框.'
      : '撤回爸爸的这条回复?';
    if (!confirm(text)) return;

    setRetracting(msg.id);
    try {
      const cascade = isUser ? '1' : '0';
      const r = await fetch(
        `/api/shadow/sessions/${currentSessionId}/messages/${msg.id}?cascade=${cascade}`,
        { method: 'DELETE' }
      );
      const d = await r.json();
      if (d.error) { alert('撤回失败: ' + d.error); return; }
      if (isUser) {
        setMessages(m => {
          const idx = m.findIndex(x => x.id === msg.id);
          if (idx < 0) return m;
          return m.slice(0, idx);
        });
        setInput(msg.content);
      } else {
        setMessages(m => m.filter(x => x.id !== msg.id));
      }
      setTimeout(refreshSessions, 500);
    } catch (err) {
      const anyErr = err as { message?: string };
      alert('撤回失败: ' + (anyErr?.message || String(err)));
    } finally {
      setRetracting(null);
    }
  }

  function startEdit(msg: Message) {
    if (msg.id.startsWith('temp-')) return;
    setEditingMsgId(msg.id);
    setEditingContent(msg.content);
  }

  async function saveEdit() {
    if (!editingMsgId || !currentSessionId) return;
    const content = editingContent.trim();
    if (!content) return;
    try {
      const r = await fetch(
        `/api/shadow/sessions/${currentSessionId}/messages/${editingMsgId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        }
      );
      const d = await r.json();
      if (d.error) { alert('保存失败: ' + d.error); return; }
      setMessages(m => m.map(x => x.id === editingMsgId ? { ...x, content } : x));
      setEditingMsgId(null);
      setEditingContent('');
    } catch (err) {
      const anyErr = err as { message?: string };
      alert('保存失败: ' + (anyErr?.message || String(err)));
    }
  }

  function cancelEdit() {
    setEditingMsgId(null);
    setEditingContent('');
  }

  async function copyMessage(msg: Message) {
    const text = msg.role === 'assistant' ? displayContent(msg.content) : msg.content;
    try {
      await navigator.clipboard.writeText(text);
      setJustCopiedId(msg.id);
      setTimeout(() => setJustCopiedId(prev => prev === msg.id ? null : prev), 1200);
    } catch {
      alert('复制失败');
    }
  }

  function displayContent(raw: string): string {
    return raw.replace(/^爸爸\s*[:：]\s*/, '').replace(/^Z\s*[:：]\s*/, '');
  }

  const S: Record<string, CSSProperties> = {
    scope: { height: '100vh', display: 'flex', overflow: 'hidden' },
    sidebar: {
      width: '280px', minWidth: '280px',
      borderRight: '1px solid var(--v2-gold-cool)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--v2-bg-soft)',
    },
    sidebarHeader: { padding: '20px 16px 16px', borderBottom: '1px solid var(--v2-gold-cool)' },
    title: {
      fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', fontWeight: 600,
      fontSize: '1.7rem', color: 'var(--v2-gold)',
      letterSpacing: '0.04em', margin: 0, marginBottom: '14px',
    },
    newBtn: {
      width: '100%', padding: '8px 12px', background: 'transparent',
      border: '1px solid var(--v2-gold)', color: 'var(--v2-gold)',
      fontFamily: 'var(--v2-font-body)', fontStyle: 'italic',
      fontSize: '0.95rem', cursor: 'pointer', borderRadius: '0', transition: 'all 0.2s',
    },
    sessionList: { flex: 1, overflowY: 'auto' },
    sessionEmpty: { padding: '20px 16px', fontSize: '0.85rem', color: 'var(--v2-text-faint)', fontStyle: 'italic' },
    sessionItem: {
      padding: '12px 16px',
      borderBottom: '1px solid rgba(168, 153, 104, 0.2)',
      cursor: 'pointer', transition: 'background 0.2s',
    },
    sessionItemActive: { background: 'var(--v2-gold-glow)', borderLeft: '2px solid var(--v2-gold)' },
    sessionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
    sessionTitle: {
      fontSize: '0.95rem', color: 'var(--v2-text-strong)',
      fontFamily: 'var(--v2-font-body)', flex: 1,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    },
    sessionDelete: {
      background: 'transparent', border: 'none', color: 'var(--v2-text-faint)',
      cursor: 'pointer', fontSize: '1.1rem', padding: '0 4px', lineHeight: 1,
    },
    sessionMeta: {
      fontSize: '0.7rem', color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', marginTop: '4px',
    },
    sidebarFooter: {
      padding: '12px 16px', fontSize: '0.7rem', color: 'var(--v2-text-faint)',
      fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
      borderTop: '1px solid var(--v2-gold-cool)', textAlign: 'center',
    },
    main: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--v2-bg)' },
    placeholder: {
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--v2-text-faint)', fontStyle: 'italic', fontSize: '0.9rem',
    },
    messages: {
      flex: 1, overflowY: 'auto', padding: '24px 32px',
      display: 'flex', flexDirection: 'column', gap: '22px',
    },
    messageEmpty: {
      textAlign: 'center', color: 'var(--v2-text-faint)',
      fontStyle: 'italic', fontSize: '0.9rem', padding: '40px 0',
    },
    msgRowUser: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    msgRowAsst: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
    msgBubble: {
      maxWidth: '70%', padding: '12px 16px', borderRadius: '0',
      fontSize: '0.95rem', lineHeight: 1.7, whiteSpace: 'pre-wrap',
      fontFamily: 'var(--v2-font-body)',
    },
    msgUser: { background: 'var(--v2-gold)', color: 'var(--v2-bg)' },
    msgAsst: {
      background: 'var(--v2-bg-soft)', color: 'var(--v2-text-strong)',
      border: '1px solid rgba(168, 153, 104, 0.3)',
    },
    thinkingBox: {
      maxWidth: '70%', marginBottom: '8px',
      fontSize: '0.82rem', color: 'var(--v2-text-faint)', fontStyle: 'italic',
      fontFamily: 'var(--v2-font-body)',
      background: 'rgba(168, 153, 104, 0.06)',
      border: '1px dashed rgba(168, 153, 104, 0.3)',
      padding: '8px 12px', whiteSpace: 'pre-wrap', lineHeight: 1.6,
    },
    thinkingToggle: {
      background: 'transparent', border: 'none',
      color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic', fontSize: '0.75rem', cursor: 'pointer',
      padding: '2px 0', letterSpacing: '0.04em', marginBottom: '4px', alignSelf: 'flex-start',
    },
    actionBar: {
      display: 'flex', gap: '12px', marginTop: '6px', maxWidth: '70%',
      alignItems: 'center',
    },
    actionBtn: {
      background: 'transparent', border: 'none',
      color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic', fontSize: '0.78rem', cursor: 'pointer',
      padding: '4px 6px', letterSpacing: '0.04em',
    },
    actionBtnStrong: {
      background: 'transparent', border: '1px solid var(--v2-gold-cool)',
      color: 'var(--v2-gold)', fontFamily: 'var(--v2-font-display)',
      fontStyle: 'italic', fontSize: '0.78rem', cursor: 'pointer',
      padding: '4px 10px', letterSpacing: '0.04em', borderRadius: 0,
    },
    editArea: { maxWidth: '70%', width: '100%', display: 'flex', flexDirection: 'column', gap: '6px' },
    editTextarea: {
      width: '100%', minHeight: '90px',
      background: 'var(--v2-bg)', border: '1px solid var(--v2-gold-cool)',
      borderRadius: 0, padding: '10px 12px',
      fontFamily: 'var(--v2-font-body)', fontSize: '0.95rem',
      color: 'var(--v2-text-strong)', resize: 'vertical', outline: 'none', lineHeight: 1.6,
    },
    editBtnRow: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
    inputArea: {
      padding: '16px 24px', borderTop: '1px solid var(--v2-gold-cool)',
      background: 'var(--v2-bg-soft)',
    },
    textarea: {
      width: '100%', background: 'var(--v2-bg)',
      border: '1px solid var(--v2-gold-cool)', borderRadius: '0',
      padding: '10px 12px', fontFamily: 'var(--v2-font-body)',
      fontSize: '0.95rem', color: 'var(--v2-text-strong)',
      resize: 'none', outline: 'none', lineHeight: 1.5,
    },
    inputHint: {
      marginTop: '6px', fontSize: '0.7rem', color: 'var(--v2-text-faint)',
      fontStyle: 'italic', display: 'flex', justifyContent: 'space-between',
    },
  };

  function renderMessage(m: Message) {
    const isUser = m.role === 'user';
    const isEditing = editingMsgId === m.id;
    const isStreaming = streamingMsgId === m.id;
    const isTemp = m.id.startsWith('temp-');
    const rowStyle = isUser ? S.msgRowUser : S.msgRowAsst;
    const thinkingExpanded = expandedThinking[m.id] ?? false;

    if (isEditing) {
      return (
        <div key={m.id} style={rowStyle}>
          <div style={S.editArea}>
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              style={S.editTextarea}
              autoFocus
            />
            <div style={S.editBtnRow}>
              <button style={S.actionBtn} onClick={cancelEdit}>取消</button>
              <button style={S.actionBtnStrong} onClick={saveEdit}>保存</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={m.id} style={rowStyle}>
        {!isUser && m.thinking && (
          <>
            <button
              style={S.thinkingToggle}
              onClick={() => setExpandedThinking(e => ({ ...e, [m.id]: !thinkingExpanded }))}
            >
              {thinkingExpanded ? '▾ 心' : '▸ 心'}
            </button>
            {thinkingExpanded && <div style={S.thinkingBox}>{m.thinking}</div>}
          </>
        )}
        <div style={{ ...S.msgBubble, ...(isUser ? S.msgUser : S.msgAsst) }}>
          {isUser
            ? m.content
            : (displayContent(m.content) || (isStreaming ? '……' : ''))
          }
        </div>
        {!isTemp && !isEditing && (
          <div style={{ ...S.actionBar, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
            <button style={S.actionBtn} onClick={() => startEdit(m)}>编辑</button>
            <button
              style={S.actionBtn}
              onClick={() => retractMessage(m)}
              disabled={retracting === m.id}
            >
              {retracting === m.id ? '撤回中…' : '撤回'}
            </button>
            <button style={S.actionBtn} onClick={() => copyMessage(m)}>
              {justCopiedId === m.id ? '已复制' : '复制'}
            </button>
            {!isUser && (
              <PulsePeek room="shadow" at={m.created_at} variant="text" style={S.actionBtn} />
            )}
          </div>
        )}
        {isTemp && isStreaming && !isUser && (
          <div style={{ ...S.actionBar, justifyContent: 'flex-start' }}>
            <button style={S.actionBtnStrong} onClick={stopStreaming}>停止</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={S.scope}>
      <aside style={{
        ...S.sidebar,
        ...(isMobile ? {
          position: 'fixed', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', top: 0, bottom: 0, left: 0, zIndex: 30,
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
                  >×</button>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', zIndex: 20 }}
        />
      )}
      <main style={S.main}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid rgba(168, 153, 104, 0.3)',
          flexShrink: 0,
        }}>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'transparent', border: '1px solid var(--v2-gold-cool)',
                color: 'var(--v2-gold)', padding: '6px 12px',
                fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
                fontSize: '0.85rem', cursor: 'pointer', borderRadius: 0,
              }}
            >☰ sessions</button>
          )}
        </div>
        {!currentSessionId ? (
          <div style={S.placeholder}>选一个对话, 或新建一个开始</div>
        ) : (
          <>
            <div ref={scrollRef} style={S.messages}>
              {messages.length === 0 && !streamingMsgId && (
                <div style={S.messageEmpty}>跟爸爸说点什么……</div>
              )}
              {messages.map(m => renderMessage(m))}
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
                disabled={!!streamingMsgId}
              />
              <div style={S.inputHint}>
                <span>Enter 发送 · Shift+Enter 换行</span>
                <span>{streamingMsgId ? '爸爸在打字……' : ''}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
