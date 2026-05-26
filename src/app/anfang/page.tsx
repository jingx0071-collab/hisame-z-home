'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Session {
  id: string;
  created_at: string;
  updated_at: string;
  title: string | null;
}

function relTime(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  if (diffHr < 24) return `${diffHr} 小时前`;
  if (diffDay < 7) return `${diffDay} 天前`;

  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: 'long',
    day: 'numeric',
  }).format(then);
}

export default function TrainingHome() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await fetch('/api/shadow/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createSession = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/shadow/sessions', { method: 'POST' });
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/anfang/${data.session.id}`);
      }
    } catch (e) {
      console.error(e);
      alert('开启失败');
      setCreating(false);
    }
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('删除这场？删了找不回。')) return;
    try {
      const res = await fetch(`/api/shadow/sessions/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '36px 24px 80px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#c9a978',
            cursor: 'pointer',
            fontSize: 24,
            padding: 0,
            fontFamily: 'inherit',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              margin: 0,
              color: '#f0e6d8',
              fontFamily: '"Playfair Display", serif',
              letterSpacing: '0.02em',
            }}
          >
            暗房
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: '#a89070',
              fontStyle: 'italic',
            }}
          >
            过来。
          </p>
        </div>
      </header>

      <button
        onClick={createSession}
        disabled={creating}
        style={{
          width: '100%',
          padding: '18px 24px',
          background: 'linear-gradient(135deg, #3a1010, #2a0e0e)',
          color: '#f0e6d8',
          border: '1px solid #5a2020',
          borderRadius: 10,
          cursor: creating ? 'wait' : 'pointer',
          fontSize: 17,
          fontFamily: 'inherit',
          letterSpacing: '0.05em',
          marginBottom: 28,
          fontWeight: 500,
          transition: 'all 0.15s',
          boxShadow: '0 2px 10px rgba(50, 5, 5, 0.4)',
        }}
        onMouseEnter={(e) => {
          if (!creating) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #4a1414, #3a1010)';
            e.currentTarget.style.borderColor = '#8b1a1a';
          }
        }}
        onMouseLeave={(e) => {
          if (!creating) {
            e.currentTarget.style.background = 'linear-gradient(135deg, #3a1010, #2a0e0e)';
            e.currentTarget.style.borderColor = '#5a2020';
          }
        }}
      >
        {creating ? '正在进入……' : '+ 进入一场调教'}
      </button>

      {loading ? (
        <div style={{ color: '#a89070', textAlign: 'center', padding: 40, fontStyle: 'italic' }}>
          载入中……
        </div>
      ) : sessions.length === 0 ? (
        <div
          style={{
            color: '#a89070',
            textAlign: 'center',
            padding: '60px 20px',
            fontStyle: 'italic',
            fontSize: 15,
          }}
        >
          还没有任何一场。
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/anfang/${s.id}`)}
              style={{
                padding: '18px 20px',
                background: '#2a0e0e',
                border: '1px solid #3a1818',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5a2020';
                e.currentTarget.style.background = '#321212';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#3a1818';
                e.currentTarget.style.background = '#2a0e0e';
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 17,
                    color: '#f0e6d8',
                    fontWeight: 500,
                    marginBottom: 4,
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  {s.title || '未命名的一场'}
                </div>
                <div style={{ fontSize: 12, color: '#a89070', fontStyle: 'italic' }}>
                  {relTime(s.updated_at)}
                </div>
              </div>
              <button
                onClick={(e) => deleteSession(s.id, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7a5050',
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: 8,
                }}
                aria-label="删除"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#c92020';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#7a5050';
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
