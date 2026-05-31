'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  id: string;
  created_at: string;
  last_message_at: string;
  title: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} 天前`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} 周前`;
  return new Date(iso).toLocaleDateString('zh-CN');
}

export default function DeeptalkSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  async function loadSessions() {
    try {
      const res = await fetch('/api/deeptalk/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error('load sessions failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function createNew() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/deeptalk/sessions', { method: 'POST' });
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/deeptalk/${data.session.id}`);
      }
    } catch (e) {
      console.error('create failed:', e);
    } finally {
      setCreating(false);
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('删除这场长谈？')) return;
    try {
      await fetch(`/api/deeptalk/sessions/${id}`, { method: 'DELETE' });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('delete failed:', e);
    }
  }

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}
    >
      <header style={{ marginBottom: 48 }}>
        <h1
          style={{
            fontSize: 36,
            fontWeight: 500,
            letterSpacing: '0.02em',
            margin: 0,
            color: '#e8e0d4',
          }}
        >
          促膝长谈
        </h1>
        <p
          style={{
            fontStyle: 'italic',
            color: '#8a8278',
            marginTop: 8,
            fontSize: 16,
          }}
        >
          关上门，慢慢说。
        </p>
      </header>

      <button
        onClick={createNew}
        disabled={creating}
        style={{
          width: '100%',
          padding: '16px 20px',
          background: 'transparent',
          color: '#e8e0d4',
          border: '1px solid #3a342c',
          borderRadius: 0,
          fontSize: 17,
          fontFamily: 'inherit',
          cursor: creating ? 'wait' : 'pointer',
          letterSpacing: '0.05em',
          marginBottom: 32,
        }}
      >
        {creating ? '新建中...' : '+ 开始一场新的'}
      </button>

      {loading ? (
        <p style={{ color: '#6a6258', fontStyle: 'italic' }}>读取中...</p>
      ) : sessions.length === 0 ? (
        <p style={{ color: '#6a6258', fontStyle: 'italic', textAlign: 'center', padding: '60px 0' }}>
          还没有过长谈。
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/deeptalk/${s.id}`)}
              style={{
                padding: '20px 22px',
                background: '#22211e',
                border: '1px solid #2a2823',
                borderRadius: 0,
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#4a4238';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2823';
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  color: '#e8e0d4',
                  marginBottom: 6,
                  letterSpacing: '0.01em',
                }}
              >
                {s.title || '未命名'}
              </div>
              <div style={{ fontSize: 13, color: '#6a6258', fontStyle: 'italic' }}>
                {timeAgo(s.last_message_at)}
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  width: 24,
                  height: 24,
                  background: 'transparent',
                  border: 'none',
                  color: '#5a524a',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontFamily: 'inherit',
                  lineHeight: 1,
                }}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 60, textAlign: 'center' }}>
        <a
          href="/"
          style={{
            color: '#6a6258',
            textDecoration: 'none',
            fontSize: 14,
            fontStyle: 'italic',
            borderBottom: '1px solid #3a342c',
            paddingBottom: 2,
          }}
        >
          ← 回家
        </a>
      </div>
    </div>
  );
}
