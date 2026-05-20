'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface TangentSession {
  id: string;
  title: string | null;
  created_at: string;
  last_message_at: string;
}

function formatRelativeTime(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;

  const fmt = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'America/Los_Angeles',
    month: 'numeric',
    day: 'numeric',
  });
  return fmt.format(then);
}

export default function TangentsListPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TangentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await fetch('/api/tangents/sessions');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error('Load sessions failed:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/tangents/sessions', { method: 'POST' });
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/tangents/${data.session.id}`);
      } else {
        alert('创建失败：' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      alert('创建失败：' + (e instanceof Error ? e.message : 'Network error'));
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('确定删除这个碎碎念吗？里面所有消息会一起删除。')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/tangents/sessions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
      } else {
        const data = await res.json();
        alert('删除失败：' + (data.error || 'Unknown'));
      }
    } catch (e) {
      alert('删除失败：' + (e instanceof Error ? e.message : 'Network'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="tangents-page">
      <header className="tangents-header">
        <button
          className="tangents-back"
          onClick={() => router.push('/')}
          aria-label="返回"
        >
          ‹
        </button>
        <h1 className="tangents-title">碎碎念</h1>
        <button
          className="tangents-create"
          onClick={handleCreate}
          disabled={creating}
          aria-label="新建"
        >
          {creating ? '...' : '+'}
        </button>
      </header>

      <main className="tangents-list">
        {loading ? (
          <div className="tangents-empty">加载中...</div>
        ) : sessions.length === 0 ? (
          <div className="tangents-empty">
            还没有碎碎念呢
            <br />
            点右上角 + 开一个吧
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="tangents-item"
              onClick={() => router.push(`/tangents/${s.id}`)}
            >
              <div className="tangents-item-main">
                <div className="tangents-item-title pixel-font">
                  {s.title || '新的碎碎念'}
                </div>
                <div className="tangents-item-time">
                  {formatRelativeTime(s.last_message_at)}
                </div>
              </div>
              <button
                className="tangents-item-delete"
                onClick={(e) => handleDelete(s.id, e)}
                disabled={deletingId === s.id}
                aria-label="删除"
              >
                ×
              </button>
            </div>
          ))
        )}
      </main>

      <style jsx>{`
        .tangents-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #f6f1e8 0%, #efe6d4 100%);
          display: flex;
          flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC',
            'Microsoft YaHei', sans-serif;
        }

        .tangents-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 56px 16px 16px;
          backdrop-filter: blur(10px);
          background: rgba(246, 241, 232, 0.6);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .tangents-back,
        .tangents-create {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.7);
          border: none;
          font-size: 22px;
          font-weight: 300;
          color: #6b5a45;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .tangents-back:hover,
        .tangents-create:hover {
          background: rgba(255, 255, 255, 0.9);
        }
        .tangents-create:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tangents-title {
          font-size: 18px;
          font-weight: 500;
          color: #4a3c28;
          letter-spacing: 2px;
          margin: 0;
        }

        .tangents-list {
          flex: 1;
          padding: 12px 16px 32px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tangents-empty {
          text-align: center;
          padding: 80px 24px;
          color: #9d8b71;
          line-height: 1.8;
          font-size: 14px;
        }

        .tangents-item {
          display: flex;
          align-items: center;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(6px);
          border-radius: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .tangents-item:hover {
          background: rgba(255, 255, 255, 0.7);
        }

        .tangents-item-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tangents-item-title {
          font-size: 16px;
          color: #4a3c28;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          letter-spacing: 1px;
        }

        .pixel-font {
          font-family: var(--font-pixel), 'PingFang SC', 'Microsoft YaHei',
            monospace;
        }

        .tangents-item-time {
          font-size: 12px;
          color: #9d8b71;
        }

        .tangents-item-delete {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: #c9b89e;
          font-size: 18px;
          cursor: pointer;
          flex-shrink: 0;
          margin-left: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tangents-item-delete:hover {
          background: rgba(180, 100, 80, 0.15);
          color: #b46450;
        }
        .tangents-item-delete:disabled {
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
