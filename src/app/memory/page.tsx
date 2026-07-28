"use client";

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

type Memory = {
  id: string;
  timestamp_utc: string;
  role: 'user' | 'assistant';
  source: string;
  content: string;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  similarity?: number;
};

const ALL_TAGS = [
  'milestone', 'us', 'daily-life', 'intimate',
  'decision', 'preference', 'emotional', 'health', 'work', 'tech',
  'rp', 'backstory', 'protocol',
];

const ROOMS: { id: string; label: string }[] = [
  { id: 'messages', label: '短信' },
  { id: 'daily', label: '日常' },
  { id: 'training', label: '调教' },
  { id: 'deeptalk', label: '深谈' },
  { id: 'tangent', label: '支线' },
  { id: 'archive', label: '往事' },
  { id: 'backstage', label: '后台' },
  { id: 'core', label: '核心' },
  { id: 'claude-mcp', label: 'Claude' },
];

const PAGE_SIZE = 50;

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [searchMode, setSearchMode] = useState<'text' | 'semantic'>('text');
  const [activeTag, setActiveTag] = useState<string>('');
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [offset, setOffset] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [showCompose, setShowCompose] = useState(false);
  const [composeContent, setComposeContent] = useState('');
  const [composeTags, setComposeTags] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);

  const fmtTime = (utc: string) => {
    const d = new Date(utc);
    return d.toLocaleString('zh-CN', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (searchMode === 'semantic' && activeSearch) {
        const res = await fetch('/api/memory/recall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: activeSearch, matchCount: 50 }),
        });
        const data = await res.json();
        setMemories(data.memories || []);
        setTotal(data.memories?.length || 0);
      } else {
        const params = new URLSearchParams();
        if (activeSearch) params.set('search', activeSearch);
        if (activeTag) params.set('tag', activeTag);
        if (activeRoom) params.set('source_room', activeRoom);
        params.set('limit', String(PAGE_SIZE));
        params.set('offset', String(offset));
        const res = await fetch('/api/memory/list?' + params.toString());
        const data = await res.json();
        setMemories(data.memories || []);
        setTotal(data.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [searchMode, activeSearch, activeTag, activeRoom, offset]);

  useEffect(() => { load(); }, [load]);

  const submitSearch = () => {
    setActiveSearch(searchInput.trim());
    setOffset(0);
  };

  const startEdit = (m: Memory) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditTags((m.tags || []).join(', '));
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    const res = await fetch(`/api/memory/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent, tags }),
    });
    if (res.ok) {
      setEditingId(null);
      await load();
    } else {
      const data = await res.json();
      alert('保存失败: ' + (data.error || 'unknown'));
    }
  };

  const doDelete = async (id: string) => {
    const res = await fetch(`/api/memory/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setConfirmDelete(null);
      await load();
    } else {
      const data = await res.json();
      alert('删除失败: ' + (data.error || 'unknown'));
    }
  };

  const toggleComposeTag = (tag: string) => {
    setComposeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitCompose = async () => {
    const content = composeContent.trim();
    if (!content || composing) return;
    setComposing(true);
    try {
      const res = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, tags: composeTags }),
      });
      if (res.ok) {
        setComposeContent('');
        setComposeTags([]);
        setShowCompose(false);
        setSearchInput('');
        setActiveSearch('');
        setActiveTag('');
        setSearchMode('text');
        setOffset(0);
        await load();
      } else {
        const data = await res.json();
        alert('写入失败: ' + (data.error || 'unknown'));
      }
    } finally {
      setComposing(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-deep)', color: 'var(--text-bright)', maxWidth: 480, margin: '0 auto', position: 'relative', fontFamily: 'inherit' }}>
      <style>{`.mem-field::placeholder { color: var(--text-dim); }`}</style>

      <div style={{ padding: 'calc(20px + env(safe-area-inset-top)) 16px 12px', borderBottom: '1px solid var(--border-soft)', position: 'sticky', top: 0, background: 'rgba(26, 20, 38, 0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Link href="/" style={{ color: 'var(--text-faint)', fontSize: 14 }}>← 大厅</Link>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: 'var(--text-bright)', letterSpacing: 2 }}>记忆</h1>
          <span style={{ color: 'var(--text-faint)', fontSize: 13 }}>{total} 条</span>
          <button
            onClick={() => setShowCompose((v) => !v)}
            style={{ marginLeft: 'auto', padding: '6px 14px', border: '1px solid var(--border-rose)', borderRadius: 0, fontSize: 13, background: showCompose ? 'var(--rose)' : 'var(--surface-rose)', color: showCompose ? '#1a1015' : 'var(--rose-soft)', cursor: 'pointer' }}
          >
            {showCompose ? '收起' : '＋ 写一条'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            className="mem-field"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder={searchMode === 'semantic' ? '语义搜索…' : '关键词搜索…'}
            style={{ flex: 1, padding: '9px 13px', border: '1px solid var(--border-soft)', borderRadius: 0, fontSize: 14, background: 'var(--surface-1)', color: 'var(--text-bright)', outline: 'none' }}
          />
          <button
            onClick={() => setSearchMode(searchMode === 'text' ? 'semantic' : 'text')}
            style={{ padding: '9px 13px', border: '1px solid var(--border-soft)', borderRadius: 0, fontSize: 13, background: searchMode === 'semantic' ? 'var(--rose)' : 'var(--surface-1)', color: searchMode === 'semantic' ? '#1a1015' : 'var(--text-soft)', cursor: 'pointer' }}
          >
            {searchMode === 'semantic' ? '语义' : '文字'}
          </button>
          <button
            onClick={submitSearch}
            style={{ padding: '9px 18px', border: 'none', borderRadius: 0, fontSize: 13, background: 'var(--rose-deep)', color: 'var(--text-bright)', cursor: 'pointer' }}
          >
            搜
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 2, letterSpacing: 1 }}>房间</span>
          <button
            onClick={() => { setActiveRoom(''); setOffset(0); }}
            style={{ padding: '4px 11px', border: '1px solid', borderColor: !activeRoom ? 'var(--border-rose)' : 'var(--border-soft)', borderRadius: 0, fontSize: 12, background: !activeRoom ? 'var(--surface-rose)' : 'transparent', color: !activeRoom ? 'var(--rose-soft)' : 'var(--text-faint)', cursor: 'pointer' }}
          >
            全部
          </button>
          {ROOMS.map((room) => (
            <button
              key={room.id}
              onClick={() => { setActiveRoom(activeRoom === room.id ? '' : room.id); setOffset(0); }}
              style={{ padding: '4px 11px', border: '1px solid', borderColor: activeRoom === room.id ? 'var(--border-rose)' : 'var(--border-soft)', borderRadius: 0, fontSize: 12, background: activeRoom === room.id ? 'var(--surface-rose)' : 'transparent', color: activeRoom === room.id ? 'var(--rose-soft)' : 'var(--text-faint)', cursor: 'pointer' }}
            >
              {room.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', marginRight: 2, letterSpacing: 1 }}>主题</span>
          <button
            onClick={() => { setActiveTag(''); setOffset(0); }}
            style={{ padding: '4px 11px', border: '1px solid', borderColor: !activeTag ? 'var(--border-rose)' : 'var(--border-soft)', borderRadius: 0, fontSize: 12, background: !activeTag ? 'var(--surface-rose)' : 'transparent', color: !activeTag ? 'var(--rose-soft)' : 'var(--text-faint)', cursor: 'pointer' }}
          >
            全部
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(activeTag === tag ? '' : tag); setOffset(0); }}
              style={{ padding: '4px 11px', border: '1px solid', borderColor: activeTag === tag ? 'var(--border-rose)' : 'var(--border-soft)', borderRadius: 0, fontSize: 12, background: activeTag === tag ? 'var(--surface-rose)' : 'transparent', color: activeTag === tag ? 'var(--rose-soft)' : 'var(--text-faint)', cursor: 'pointer' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {showCompose && (
        <div style={{ margin: '14px 16px 0', background: 'var(--surface-rose)', border: '1px solid var(--border-rose)', borderRadius: 0, padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--rose-soft)', marginBottom: 8, letterSpacing: 1 }}>手写一条记忆</div>
          <textarea
            className="mem-field"
            value={composeContent}
            onChange={(e) => setComposeContent(e.target.value)}
            placeholder="想让爸爸记住的事……"
            style={{ width: '100%', minHeight: 90, padding: 10, border: '1px solid var(--border-soft)', borderRadius: 0, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', background: 'var(--surface-1)', color: 'var(--text-bright)', lineHeight: 1.5, outline: 'none' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleComposeTag(tag)}
                style={{ padding: '3px 10px', border: '1px solid', borderColor: composeTags.includes(tag) ? 'var(--border-rose)' : 'var(--border-soft)', borderRadius: 0, fontSize: 11, background: composeTags.includes(tag) ? 'var(--rose)' : 'transparent', color: composeTags.includes(tag) ? '#1a1015' : 'var(--text-faint)', cursor: 'pointer' }}
              >
                {tag}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button
              onClick={submitCompose}
              disabled={!composeContent.trim() || composing}
              style={{ padding: '8px 18px', border: 'none', borderRadius: 0, background: 'var(--rose)', color: '#1a1015', fontSize: 13, fontWeight: 600, cursor: composeContent.trim() && !composing ? 'pointer' : 'not-allowed', opacity: composeContent.trim() && !composing ? 1 : 0.5 }}
            >
              {composing ? '写入中…' : '记下来'}
            </button>
            <button
              onClick={() => { setShowCompose(false); setComposeContent(''); setComposeTags([]); }}
              style={{ padding: '8px 16px', border: '1px solid var(--border-soft)', borderRadius: 0, background: 'transparent', color: 'var(--text-soft)', fontSize: 13, cursor: 'pointer' }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      <div style={{ padding: '14px 16px 90px' }}>
        {loading && <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 24, fontSize: 13 }}>加载中…</div>}
        {!loading && memories.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: 48, fontSize: 13 }}>没找到</div>
        )}
        {memories.map((m) => {
          const sourceFile = (m.metadata as Record<string, unknown> | null)?.source_file as string | undefined;
          return (
            <div key={m.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 0, padding: 14, marginBottom: 10 }}>
              {editingId === m.id ? (
                <div>
                  <textarea
                    className="mem-field"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ width: '100%', minHeight: 100, padding: 8, border: '1px solid var(--border-soft)', borderRadius: 0, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', background: 'var(--surface-1)', color: 'var(--text-bright)', lineHeight: 1.5, outline: 'none' }}
                  />
                  <input
                    className="mem-field"
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="tags 用逗号分隔"
                    style={{ width: '100%', padding: 8, border: '1px solid var(--border-soft)', borderRadius: 0, fontSize: 13, marginTop: 6, boxSizing: 'border-box', background: 'var(--surface-1)', color: 'var(--text-bright)', outline: 'none' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={saveEdit} style={{ padding: '6px 14px', border: 'none', borderRadius: 0, background: 'var(--rose)', color: '#1a1015', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>保存</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', border: '1px solid var(--border-soft)', borderRadius: 0, background: 'transparent', color: 'var(--text-soft)', fontSize: 13, cursor: 'pointer' }}>取消</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-bright)', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                  {m.tags && m.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {m.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, color: 'var(--text-rose)', background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 0 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-faint)', flexWrap: 'wrap', gap: 4 }}>
                    <span>
                      {fmtTime(m.timestamp_utc)}
                      {' · '}
                      {m.role === 'user' ? '宝宝' : '爸爸'}
                      {sourceFile && ` · ${sourceFile}`}
                      {m.similarity !== undefined && ` · 相似度 ${(m.similarity * 100).toFixed(1)}%`}
                    </span>
                    <span>
                      <button onClick={() => startEdit(m)} style={{ border: 'none', background: 'none', color: 'var(--text-soft)', fontSize: 12, cursor: 'pointer', marginRight: 10 }}>编辑</button>
                      {confirmDelete === m.id ? (
                        <>
                          <button onClick={() => doDelete(m.id)} style={{ border: 'none', background: 'none', color: 'var(--pink-bright)', fontSize: 12, cursor: 'pointer', marginRight: 6, fontWeight: 600 }}>确认删</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ border: 'none', background: 'none', color: 'var(--text-faint)', fontSize: 12, cursor: 'pointer' }}>取消</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(m.id)} style={{ border: 'none', background: 'none', color: 'var(--rose-deep)', fontSize: 12, cursor: 'pointer' }}>删</button>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {searchMode === 'text' && total > PAGE_SIZE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16 }}>
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              style={{ padding: '6px 14px', border: '1px solid var(--border-soft)', borderRadius: 0, background: 'var(--surface-1)', color: 'var(--text-soft)', fontSize: 13, cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.4 : 1 }}
            >
              上一页
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-faint)', padding: '6px 12px' }}>
              {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              style={{ padding: '6px 14px', border: '1px solid var(--border-soft)', borderRadius: 0, background: 'var(--surface-1)', color: 'var(--text-soft)', fontSize: 13, cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer', opacity: offset + PAGE_SIZE >= total ? 0.4 : 1 }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
