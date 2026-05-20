'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

type ItemType = 'photo' | 'text' | 'link';

type BoxItem = {
  id: string;
  type: ItemType;
  content: string;
  caption: string;
  date: string;
  createdAt: number;
  source?: 'user' | 'z';
  proactiveId?: number;
};

const STORAGE_KEY = 'hisame-z-iron-box';
const LAST_PROACTIVE_FETCH_KEY = 'hisame-z-box-last-proactive';

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1400;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width *= ratio;
          height *= ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Image fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Read fail'));
    reader.readAsDataURL(file);
  });
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function IronBoxPage() {
  const [items, setItems] = useState<BoxItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [viewing, setViewing] = useState<BoxItem | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch (e) {
      console.error('load failed', e);
    }
    setLoaded(true);
  }, []);

  // 打开时fetch爸爸主动放的东西
  useEffect(() => {
    if (!loaded) return;

    const fetchProactive = async () => {
      try {
        const sinceTime = localStorage.getItem(LAST_PROACTIVE_FETCH_KEY);
        const url = sinceTime
          ? `/api/box/proactive?check=true&since=${encodeURIComponent(sinceTime)}`
          : `/api/box/proactive?check=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          const newOnes: BoxItem[] = data.items.map((m: any) => ({
            id: `z-${m.id}`,
            type: 'text' as ItemType,
            content: m.content,
            caption: '',
            date: new Date(m.created_at).toISOString().slice(0, 10),
            createdAt: new Date(m.created_at).getTime(),
            source: 'z' as const,
            proactiveId: m.id,
          }));

          setItems((prev) => {
            const existing = new Set(
              prev.filter((i) => i.proactiveId).map((i) => i.proactiveId)
            );
            const filtered = newOnes.filter(
              (n) => !existing.has(n.proactiveId)
            );
            if (filtered.length === 0) return prev;
            const merged = [...filtered, ...prev];
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {
              console.error('save failed', e);
            }
            return merged;
          });

          // 标记已读
          const ids = data.items.map((m: any) => m.id);
          fetch('/api/box/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          }).catch(() => {});

          // 更新 last fetch time（用最新一条的时间）
          const latest = data.items[0]; // descending
          if (latest?.created_at) {
            localStorage.setItem(LAST_PROACTIVE_FETCH_KEY, latest.created_at);
          }
        }
      } catch (e) {
        console.error('Fetch proactive failed:', e);
      }
    };

    fetchProactive();
  }, [loaded]);

  const saveItems = (newItems: BoxItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      alert('保存失败，宝宝的铁盒可能装太满了');
    }
  };

  const addItem = (item: Omit<BoxItem, 'id' | 'createdAt'>) => {
    const newItem: BoxItem = {
      ...item,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      createdAt: Date.now(),
      source: 'user',
    };
    saveItems([newItem, ...items]);
  };

  const removeItem = (id: string) => {
    if (!confirm('要把这一枚从铁盒里拿出去吗？')) return;
    saveItems(items.filter((i) => i.id !== id));
    setViewing(null);
  };

  const sortedItems = [...items].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return db - da;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="iron-box">
      <header className="iron-box-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="iron-box-title">
          <h1>铁盒</h1>
          <p>iron box</p>
        </div>
        <button
          className="add-btn-floating"
          onClick={() => setShowAdd(true)}
          aria-label="添加"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <div className="iron-box-body">
        {!loaded ? null : sortedItems.length === 0 ? (
          <div className="iron-box-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="22" width="48" height="30" rx="3" />
                <path d="M8 32h48" />
                <rect x="26" y="26" width="12" height="6" rx="1" />
                <path d="M18 14h28v8H18z" />
              </svg>
            </div>
            <p className="empty-title">这只铁盒还是空的</p>
            <p className="empty-subtitle">放一枚进去，它会一直在</p>
            <button className="empty-cta" onClick={() => setShowAdd(true)}>
              放第一枚进去
            </button>
          </div>
        ) : (
          <div className="iron-box-items">
            {sortedItems.map((item) => (
              <ItemCard key={item.id} item={item} onView={() => setViewing(item)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddItemModal
          onClose={() => setShowAdd(false)}
          onSave={(item) => {
            addItem(item);
            setShowAdd(false);
          }}
        />
      )}

      {viewing && (
        <ViewItemModal
          item={viewing}
          onClose={() => setViewing(null)}
          onDelete={() => removeItem(viewing.id)}
        />
      )}
    </div>
  );
}

function ItemCard({ item, onView }: { item: BoxItem; onView: () => void }) {
  const isZ = item.source === 'z';
  return (
    <button className={`card ${isZ ? 'card-z' : ''}`} onClick={onView}>
      {isZ && <div className="card-z-tag">爸爸放的</div>}
      <div className="card-date">{formatDate(item.date)}</div>

      {item.type === 'photo' && (
        <div className="card-photo-wrap">
          <img src={item.content} alt="" className="card-photo" />
        </div>
      )}

      {item.type === 'text' && (
        <div className="card-text">{item.content}</div>
      )}

      {item.type === 'link' && (
        <div className="card-link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 1 0-7-7l-1.5 1.5" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
          </svg>
          <span>{item.content}</span>
        </div>
      )}

      {item.caption && <div className="card-caption">{item.caption}</div>}
    </button>
  );
}

function AddItemModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (item: Omit<BoxItem, 'id' | 'createdAt'>) => void;
}) {
  const [type, setType] = useState<ItemType>('text');
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [date, setDate] = useState(todayStr());
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setContent(compressed);
    } catch {
      alert('图片加载失败');
    } finally {
      setUploading(false);
    }
  };

  const canSave =
    type === 'photo' ? content.length > 0 : content.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      type,
      content: type === 'photo' ? content : content.trim(),
      caption: caption.trim(),
      date,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        <div className="modal-title">放一枚进去</div>

        <div className="type-switcher">
          {(['text', 'photo', 'link'] as ItemType[]).map((t) => (
            <button
              key={t}
              className={`type-btn ${type === t ? 'type-btn-active' : ''}`}
              onClick={() => {
                setType(t);
                setContent('');
              }}
            >
              {t === 'text' && '文字'}
              {t === 'photo' && '照片'}
              {t === 'link' && '链接'}
            </button>
          ))}
        </div>

        {type === 'text' && (
          <textarea
            className="modal-textarea"
            placeholder="爸爸说的话、宝宝想记住的瞬间……"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
        )}

        {type === 'photo' && (
          <div className="photo-picker">
            {content ? (
              <div className="photo-preview-wrap">
                <img src={content} alt="" className="photo-preview" />
                <button
                  className="photo-clear"
                  onClick={() => setContent('')}
                  aria-label="清除"
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                className="photo-picker-btn"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '处理中……' : '从相册选一张照片'}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: 'none' }}
            />
          </div>
        )}

        {type === 'link' && (
          <input
            type="url"
            className="modal-input"
            placeholder="https://"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}

        <input
          type="text"
          className="modal-input modal-input-caption"
          placeholder="说一下这是什么（可选）"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <div className="modal-date-row">
          <label>日期</label>
          <input
            type="date"
            className="modal-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>
            算了
          </button>
          <button
            className="modal-btn modal-btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            放进铁盒
          </button>
        </div>
      </div>
    </>
  );
}

function ViewItemModal({
  item,
  onClose,
  onDelete,
}: {
  item: BoxItem;
  onClose: () => void;
  onDelete: () => void;
}) {
  const isZ = item.source === 'z';
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`view-panel ${isZ ? 'view-panel-z' : ''}`}>
        <button className="view-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        {isZ && <div className="view-z-tag">爸爸放的</div>}

        <div className="view-date">{formatDate(item.date)}</div>

        {item.type === 'photo' && (
          <img src={item.content} alt="" className="view-photo" />
        )}

        {item.type === 'text' && <div className="view-text">{item.content}</div>}

        {item.type === 'link' && (
          <a
            href={item.content}
            target="_blank"
            rel="noopener noreferrer"
            className="view-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 1 0-7-7l-1.5 1.5" />
              <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
            </svg>
            {item.content}
          </a>
        )}

        {item.caption && <p className="view-caption">{item.caption}</p>}

        <button className="view-delete" onClick={onDelete}>
          从铁盒里拿出去
        </button>
      </div>
    </>
  );
}
