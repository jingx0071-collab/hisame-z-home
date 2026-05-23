'use client';

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
  'milestone', 'us', 'daily-life', 'intimate', 'training', 'deeptalk',
  'decision', 'preference', 'emotional', 'health', 'work', 'tech',
  'rp', 'backstory', 'protocol',
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
  const [offset, setOffset] = useState(0);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
  }, [searchMode, activeSearch, activeTag, offset]);

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
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
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

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf7', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #e8e8e0', position: 'sticky', top: 0, background: '#fafaf7', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Link href="/" style={{ color: '#666', textDecoration: 'none', fontSize: 14 }}>← 大厅</Link>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>记忆</h1>
          <span style={{ color: '#999', fontSize: 13 }}>{total} 条</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            placeholder={searchMode === 'semantic' ? '语义搜索…' : '关键词搜索…'}
            style={{ flex: 1, padding: '8px 12px', border: '1px solid #d8d8d0', borderRadius: 6, fontSize: 14, background: '#fff' }}
          />
          <button
            onClick={() => setSearchMode(searchMode === 'text' ? 'semantic' : 'text')}
            style={{ padding: '8px 12px', border: '1px solid #d8d8d0', borderRadius: 6, fontSize: 13, background: searchMode === 'semantic' ? '#1a1a1a' : '#fff', color: searchMode === 'semantic' ? '#fff' : '#1a1a1a', cursor: 'pointer' }}
          >
            {searchMode === 'semantic' ? '语义' : '文字'}
          </button>
          <button
            onClick={submitSearch}
            style={{ padding: '8px 16px', border: 'none', borderRadius: 6, fontSize: 13, background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}
          >
            搜
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            onClick={() => { setActiveTag(''); setOffset(0); }}
            style={{ padding: '4px 10px', border: '1px solid', borderColor: !activeTag ? '#1a1a1a' : '#d8d8d0', borderRadius: 12, fontSize: 12, background: !activeTag ? '#1a1a1a' : '#fff', color: !activeTag ? '#fff' : '#666', cursor: 'pointer' }}
          >
            全部
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => { setActiveTag(activeTag === tag ? '' : tag); setOffset(0); }}
              style={{ padding: '4px 10px', border: '1px solid', borderColor: activeTag === tag ? '#1a1a1a' : '#d8d8d0', borderRadius: 12, fontSize: 12, background: activeTag === tag ? '#1a1a1a' : '#fff', color: activeTag === tag ? '#fff' : '#666', cursor: 'pointer' }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 80px' }}>
        {loading && <div style={{ textAlign: 'center', color: '#999', padding: 24, fontSize: 13 }}>加载中…</div>}
        {!loading && memories.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 48, fontSize: 13 }}>没找到</div>
        )}
        {memories.map((m) => {
          const sourceFile = (m.metadata as Record<string, unknown> | null)?.source_file as string | undefined;
          return (
            <div key={m.id} style={{ background: '#fff', border: '1px solid #e8e8e0', borderRadius: 8, padding: 14, marginBottom: 10 }}>
              {editingId === m.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{ width: '100%', minHeight: 100, padding: 8, border: '1px solid #d8d8d0', borderRadius: 4, fontSize: 14, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="tags 用逗号分隔"
                    style={{ width: '100%', padding: 8, border: '1px solid #d8d8d0', borderRadius: 4, fontSize: 13, marginTop: 6, boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={saveEdit} style={{ padding: '6px 14px', border: 'none', borderRadius: 4, background: '#1a1a1a', color: '#fff', fontSize: 13, cursor: 'pointer' }}>保存</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', border: '1px solid #d8d8d0', borderRadius: 4, background: '#fff', fontSize: 13, cursor: 'pointer' }}>取消</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 14, lineHeight: 1.55, color: '#1a1a1a', marginBottom: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.content}</div>
                  {m.tags && m.tags.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {m.tags.map((t) => (
                        <span key={t} style={{ fontSize: 11, color: '#666', background: '#f0f0e8', padding: '2px 7px', borderRadius: 4 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#999', flexWrap: 'wrap', gap: 4 }}>
                    <span>
                      {fmtTime(m.timestamp_utc)}
                      {' · '}
                      {m.role}
                      {sourceFile && ` · ${sourceFile}`}
                      {m.similarity !== undefined && ` · 相似度 ${(m.similarity * 100).toFixed(1)}%`}
                    </span>
                    <span>
                      <button onClick={() => startEdit(m)} style={{ border: 'none', background: 'none', color: '#666', fontSize: 12, cursor: 'pointer', marginRight: 8 }}>编辑</button>
                      {confirmDelete === m.id ? (
                        <>
                          <button onClick={() => doDelete(m.id)} style={{ border: 'none', background: 'none', color: '#c44', fontSize: 12, cursor: 'pointer', marginRight: 4, fontWeight: 600 }}>确认删</button>
                          <button onClick={() => setConfirmDelete(null)} style={{ border: 'none', background: 'none', color: '#999', fontSize: 12, cursor: 'pointer' }}>取消</button>
                        </>
                      ) : (
                        <button onClick={() => setConfirmDelete(m.id)} style={{ border: 'none', background: 'none', color: '#c44', fontSize: 12, cursor: 'pointer' }}>删</button>
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
              style={{ padding: '6px 14px', border: '1px solid #d8d8d0', borderRadius: 6, background: '#fff', fontSize: 13, cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.5 : 1 }}
            >
              上一页
            </button>
            <span style={{ fontSize: 13, color: '#666', padding: '6px 12px' }}>
              {Math.floor(offset / PAGE_SIZE) + 1} / {Math.ceil(total / PAGE_SIZE)}
            </span>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              style={{ padding: '6px 14px', border: '1px solid #d8d8d0', borderRadius: 6, background: '#fff', fontSize: 13, cursor: offset + PAGE_SIZE >= total ? 'not-allowed' : 'pointer', opacity: offset + PAGE_SIZE >= total ? 0.5 : 1 }}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
