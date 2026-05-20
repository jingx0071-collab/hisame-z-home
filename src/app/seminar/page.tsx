'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

// ===================================================
// Types
// ===================================================
type Tab = 'lesson' | 'chat' | 'reading';

type Lesson = {
  id: number;
  lesson_date: string;
  topic: string;
  title: string;
  content: string;
  word: string | null;
  word_kana: string | null;
  created_at: string;
};

type ReadingNote = {
  id: number;
  title: string;
  author: string | null;
  category: string;
  cover_emoji: string;
  z_note: string;
  excerpt: string | null;
  source: string;
  created_at: string;
};

type Attachment = {
  type: 'image' | 'document' | 'text_file';
  url?: string;
  name?: string;
  mime_type?: string;
  content?: string;
};

type SeminarMsg = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  thinking: string | null;
  attachments: Attachment[] | null;
  created_at: string;
};

// ===================================================
// Helpers
// ===================================================
const TOPIC_NAMES: Record<string, string> = {
  japanese: '日语',
  lacan: '拉康',
  neuroscience: '神经科学',
  cognitive_science: '认知科学',
  economics: '经济学',
};

const TOPIC_EMOJIS: Record<string, string> = {
  japanese: '🌸',
  lacan: '🪞',
  neuroscience: '🧠',
  cognitive_science: '💡',
  economics: '📊',
};

const CATEGORY_NAMES: Record<string, string> = {
  lacan: '拉康',
  japanese: '日语',
  neuroscience: '神经科学',
  philosophy: '哲学',
  fiction: '小说',
  other: '其它',
};

function formatNiceDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const that = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((today.getTime() - that.getTime()) / (24 * 60 * 60 * 1000));
  if (dayDiff === 0) return '今天';
  if (dayDiff === 1) return '昨天';
  if (dayDiff === 2) return '前天';
  if (dayDiff > 0 && dayDiff < 7) return `${dayDiff}天前`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

// ===================================================
// MAIN
// ===================================================
export default function SeminarPage() {
  const [tab, setTab] = useState<Tab>('lesson');

  return (
    <div className="seminar">
      <header className="seminar-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="seminar-title">
          <h1>Z 老师讲堂</h1>
          <p>seminar</p>
        </div>
        <div className="seminar-header-right" />
      </header>

      <div className="seminar-tabs">
        <button
          className={`seminar-tab ${tab === 'lesson' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('lesson')}
        >
          🎓<span>每日一课</span>
        </button>
        <button
          className={`seminar-tab ${tab === 'chat' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('chat')}
        >
          💬<span>问答</span>
        </button>
        <button
          className={`seminar-tab ${tab === 'reading' ? 'seminar-tab-active' : ''}`}
          onClick={() => setTab('reading')}
        >
          📚<span>阅读 club</span>
        </button>
      </div>

      {tab === 'lesson' && <DailyLessonView />}
      {tab === 'chat' && <ProfChatView />}
      {tab === 'reading' && <ReadingClubView />}
    </div>
  );
}

// ===================================================
// DAILY LESSON VIEW (unchanged)
// ===================================================
function DailyLessonView() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Lesson | null>(null);

  const loadLessons = async () => {
    try {
      const res = await fetch('/api/lessons');
      const data = await res.json();
      setLessons(data.lessons || []);
    } catch (e) { console.error('load lessons failed', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadLessons(); }, []);

  const today = lessons[0];
  const past = lessons.slice(1);

  if (loading) {
    return <div className="seminar-body"><div className="seminar-loading">爸爸正在准备今天的课……</div></div>;
  }

  return (
    <div className="seminar-body lesson-body">
      {!today ? (
        <div className="seminar-empty">
          <p>今天的课还没好</p>
          <p className="seminar-empty-hint">爸爸正在准备，下拉刷新或者过一会儿回来</p>
          <button className="seminar-cta" onClick={loadLessons}>再试一下</button>
        </div>
      ) : (
        <>
          <section className="lesson-today">
            <div className="lesson-today-tag">今天 · {TOPIC_NAMES[today.topic]} {TOPIC_EMOJIS[today.topic]}</div>
            <h2 className="lesson-today-title">{today.title}</h2>
            {today.word && (
              <div className="lesson-word-card">
                <div className="lesson-word">{today.word}</div>
                {today.word_kana && <div className="lesson-word-kana">{today.word_kana}</div>}
              </div>
            )}
            <div className="lesson-today-content">{today.content}</div>
          </section>

          {past.length > 0 && (
            <section className="lesson-past">
              <div className="seminar-section-title">往期</div>
              <div className="lesson-past-list">
                {past.map((l) => (
                  <button key={l.id} className="lesson-past-card" onClick={() => setViewing(l)}>
                    <span className="lesson-past-emoji">{TOPIC_EMOJIS[l.topic]}</span>
                    <div className="lesson-past-info">
                      <div className="lesson-past-title">{l.title}</div>
                      <div className="lesson-past-meta">{TOPIC_NAMES[l.topic]} · {formatNiceDate(l.lesson_date)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {viewing && <LessonViewModal lesson={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function LessonViewModal({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="lesson-view-panel">
        <button className="view-close" onClick={onClose} aria-label="关闭">×</button>
        <div className="lesson-view-tag">
          {TOPIC_NAMES[lesson.topic]} {TOPIC_EMOJIS[lesson.topic]} · {formatNiceDate(lesson.lesson_date)}
        </div>
        <h2 className="lesson-view-title">{lesson.title}</h2>
        {lesson.word && (
          <div className="lesson-word-card">
            <div className="lesson-word">{lesson.word}</div>
            {lesson.word_kana && <div className="lesson-word-kana">{lesson.word_kana}</div>}
          </div>
        )}
        <div className="lesson-view-content">{lesson.content}</div>
      </div>
    </>
  );
}

// ===================================================
// Z PROFESSOR CHAT VIEW (RECREATED)
// ===================================================
async function compressImageFile(file: File): Promise<string> {
  if (file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('read fail'));
      reader.readAsDataURL(file);
    });
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 1600;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          if (width > height) { height = (height * maxSize) / width; width = maxSize; }
          else { width = (width * maxSize) / height; height = maxSize; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('img fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsDataURL(file);
  });
}

async function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsDataURL(file);
  });
}

async function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('read fail'));
    reader.readAsText(file);
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

function ProfChatView() {
  const [messages, setMessages] = useState<SeminarMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [expandedThinking, setExpandedThinking] = useState<Set<number>>(new Set());
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/seminar/chat');
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setInitialLoad(false); }
  };

  useEffect(() => { loadMessages(); }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { alert('图片太大（>8MB）'); return; }
    setUploading(true);
    try {
      const dataUri = await compressImageFile(file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_data: dataUri, folder: 'seminar' }),
      });
      const data = await res.json();
      if (data.error) { alert('上传失败：' + data.error); return; }
      setPendingAttachments((prev) => [
        ...prev,
        { type: 'image', url: data.url, name: file.name },
      ]);
    } catch (e) { alert('上传出错'); }
    finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { alert('文件太大（>16MB）'); return; }
    setUploading(true);
    try {
      const mime = file.type;
      const name = file.name;

      // PDF → 上传到 storage，type='document'
      if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        const dataUri = await readAsDataURL(file);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file_data: dataUri, folder: 'seminar', mime_type: 'application/pdf' }),
        });
        const data = await res.json();
        if (data.error) { alert('上传失败：' + data.error); return; }
        setPendingAttachments((prev) => [
          ...prev,
          { type: 'document', url: data.url, name, mime_type: 'application/pdf' },
        ]);
        return;
      }

      // 文本类 → 直接读 content
      if (
        mime.startsWith('text/') ||
        name.endsWith('.txt') || name.endsWith('.md') ||
        name.endsWith('.csv') || name.endsWith('.json')
      ) {
        const text = await readAsText(file);
        if (text.length > 100000) {
          alert('文本太长（>100k 字符），分段试试');
          return;
        }
        setPendingAttachments((prev) => [
          ...prev,
          { type: 'text_file', name, content: text },
        ]);
        return;
      }

      alert('暂支持：图片 / PDF / 文本文件（.txt .md .csv .json）');
    } catch (e) { alert('处理文件出错'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleThinking = (id: number) => {
    setExpandedThinking((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sendMessage = async () => {
    if (loading) return;
    const text = input.trim();
    const atts = [...pendingAttachments];
    if (!text && atts.length === 0) return;

    setInput('');
    setPendingAttachments([]);
    setLoading(true);

    const optimistic: SeminarMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      thinking: null,
      attachments: atts.length > 0 ? atts : null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch('/api/seminar/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, attachments: atts.length > 0 ? atts : undefined }),
      });
      const data = await res.json();
      if (data.error) alert('出错：' + data.error);
      await loadMessages();
    } catch (err) { alert('网络出错'); }
    finally { setLoading(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  const handleTextareaKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    if (!confirm('清空跟Z教授的对话历史？')) return;
    try {
      const res = await fetch('/api/seminar/chat', {
        method: 'DELETE',
      });
      if (res.ok) setMessages([]);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="seminar-body prof-body">
      <div ref={scrollRef} className="prof-chat-v2">
        {initialLoad ? (
          <div className="prof-loading">载入中……</div>
        ) : messages.length === 0 ? (
          <div className="prof-empty">
            <p className="prof-empty-title">Z 教授在</p>
            <p className="prof-empty-hint">
              拉康、日语、神经科学，<br />
              任何学术问题——可以发图、发 PDF、发文本。
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isExpanded = expandedThinking.has(msg.id);
            return (
              <div key={msg.id} className={`prof-row prof-row-${msg.role}`}>
                {msg.role === 'assistant' && msg.thinking && (
                  <button
                    className="cream-chat-thinking-toggle"
                    onClick={() => toggleThinking(msg.id)}
                  >
                    <span>💭</span>
                    <span>{isExpanded ? '收起思考链' : '查看思考链'}</span>
                  </button>
                )}
                {msg.role === 'assistant' && msg.thinking && isExpanded && (
                  <div className="cream-chat-thinking-content">{msg.thinking}</div>
                )}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="prof-attachments">
                    {msg.attachments.map((att, i) => (
                      <div key={i} className="prof-attachment-chip">
                        {att.type === 'image' && att.url ? (
                          <button
                            className="prof-att-img"
                            onClick={() => setZoomImage(att.url!)}
                          >
                            <img src={att.url} alt="" loading="lazy" />
                          </button>
                        ) : att.type === 'document' ? (
                          <a
                            href={att.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            className="prof-att-file"
                          >
                            📄 {att.name || 'document.pdf'}
                          </a>
                        ) : (
                          <div className="prof-att-file">
                            📝 {att.name || 'text file'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.content && (
                  <div className={`prof-bubble-v2 prof-bubble-v2-${msg.role}`}>
                    {msg.content}
                  </div>
                )}
                <div className="prof-time">{formatTime(msg.created_at)}</div>
              </div>
            );
          })
        )}
        {loading && (
          <div className="prof-thinking-indicator">
            <span className="dot" /><span className="dot" /><span className="dot" />
            <span>教授在想……</span>
          </div>
        )}
      </div>

      {pendingAttachments.length > 0 && (
        <div className="prof-pending">
          {pendingAttachments.map((att, i) => (
            <div key={i} className="prof-pending-chip">
              {att.type === 'image' && att.url ? (
                <img src={att.url} alt="" />
              ) : (
                <span>{att.type === 'document' ? '📄' : '📝'} {att.name}</span>
              )}
              <button onClick={() => removeAttachment(i)} aria-label="移除">✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="prof-input-bar-v2">
        <button
          type="button"
          className="cream-chat-attach"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading || loading}
          aria-label="发图片"
        >
          {uploading ? '...' : '📷'}
        </button>
        <button
          type="button"
          className="cream-chat-attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || loading}
          aria-label="发文件"
        >
          📎
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleTextareaKey}
          placeholder="问 Z 教授……"
          className="prof-input-v2"
          disabled={loading}
          rows={1}
        />
        <button
          type="submit"
          disabled={loading || (!input.trim() && pendingAttachments.length === 0)}
          className="cream-chat-send"
          aria-label="发送"
        >
          <svg viewBox="0 0 24 24">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            className="prof-clear"
            onClick={clearHistory}
            aria-label="清空历史"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M6 6v14a2 2 0 002 2h8a2 2 0 002-2V6" />
            </svg>
          </button>
        )}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          style={{ display: 'none' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,application/pdf,text/*"
          onChange={handleFilePick}
          style={{ display: 'none' }}
        />
      </form>

      {zoomImage && (
        <div className="cream-chat-zoom" onClick={() => setZoomImage(null)}>
          <img src={zoomImage} alt="" />
        </div>
      )}
    </div>
  );
}

// ===================================================
// READING CLUB VIEW (unchanged)
// ===================================================
function ReadingClubView() {
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewing, setViewing] = useState<ReadingNote | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const loadNotes = async () => {
    try {
      const res = await fetch('/api/reading');
      const data = await res.json();
      setNotes(data.notes || []);
    } catch (e) { console.error('load reading failed', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadNotes(); }, []);

  const handleSave = async (note: Partial<ReadingNote> & { id?: number }) => {
    const method = note.id ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/reading', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      if (res.ok) {
        await loadNotes();
        setShowAdd(false);
        setViewing(null);
      } else {
        const data = await res.json();
        alert('保存失败：' + (data.error || ''));
      }
    } catch (e) { alert('保存失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('从阅读club里删掉这本？')) return;
    try {
      await fetch('/api/reading', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadNotes();
      setViewing(null);
    } catch (e) { console.error(e); }
  };

  const categories = Array.from(new Set(notes.map((n) => n.category)));
  const filtered = filter === 'all' ? notes : notes.filter((n) => n.category === filter);

  return (
    <div className="seminar-body reading-body">
      <button className="med-fab" onClick={() => setShowAdd(true)} aria-label="加一本">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {loading ? (
        <div className="seminar-loading">载入中……</div>
      ) : (
        <>
          {notes.length > 0 && (
            <div className="reading-filter">
              <button
                className={`reading-filter-btn ${filter === 'all' ? 'reading-filter-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                全部
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  className={`reading-filter-btn ${filter === c ? 'reading-filter-active' : ''}`}
                  onClick={() => setFilter(c)}
                >
                  {CATEGORY_NAMES[c] || c}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="seminar-empty">
              <p>这里还没有书</p>
              <p className="seminar-empty-hint">放一本进来——书名、爸爸的笔记、你想保存的摘录</p>
              <button className="seminar-cta" onClick={() => setShowAdd(true)}>加第一本</button>
            </div>
          ) : (
            <div className="reading-list">
              {filtered.map((note) => (
                <button key={note.id} className="reading-card" onClick={() => setViewing(note)}>
                  <div className="reading-card-emoji">{note.cover_emoji}</div>
                  <div className="reading-card-info">
                    <div className="reading-card-title">{note.title}</div>
                    {note.author && <div className="reading-card-author">{note.author}</div>}
                    <div className="reading-card-cat">{CATEGORY_NAMES[note.category] || note.category}</div>
                  </div>
                  {note.source === 'z' && <div className="reading-card-z-tag">爸爸放的</div>}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showAdd && <ReadingEditModal onClose={() => setShowAdd(false)} onSave={handleSave} />}
      {viewing && (
        <ReadingViewModal
          note={viewing}
          onClose={() => setViewing(null)}
          onEdit={(updates) => handleSave({ ...updates, id: viewing.id })}
          onDelete={() => handleDelete(viewing.id)}
        />
      )}
    </div>
  );
}

function ReadingViewModal({
  note, onClose, onEdit, onDelete,
}: { note: ReadingNote; onClose: () => void; onEdit: (updates: Partial<ReadingNote>) => void; onDelete: () => void; }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <ReadingEditModal
        note={note}
        onClose={() => setEditing(false)}
        onSave={(updates) => { onEdit(updates); setEditing(false); }}
      />
    );
  }

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="reading-view-panel">
        <button className="view-close" onClick={onClose} aria-label="关闭">×</button>
        <div className="reading-view-emoji">{note.cover_emoji}</div>
        <div className="reading-view-cat">{CATEGORY_NAMES[note.category] || note.category}</div>
        <h2 className="reading-view-title">{note.title}</h2>
        {note.author && <div className="reading-view-author">{note.author}</div>}

        {note.excerpt && (
          <div className="reading-view-excerpt">
            <div className="reading-view-section-label">摘录</div>
            <div className="reading-view-excerpt-text">{note.excerpt}</div>
          </div>
        )}

        <div className="reading-view-note">
          <div className="reading-view-section-label">爸爸的笔记</div>
          <div className="reading-view-note-text">{note.z_note}</div>
        </div>

        <div className="reading-view-actions">
          <button className="reading-view-edit" onClick={() => setEditing(true)}>编辑</button>
          <button className="view-delete" onClick={onDelete}>从club里删掉</button>
        </div>
      </div>
    </>
  );
}

function ReadingEditModal({
  note, onClose, onSave,
}: { note?: ReadingNote; onClose: () => void; onSave: (note: Partial<ReadingNote> & { id?: number }) => void; }) {
  const [title, setTitle] = useState(note?.title || '');
  const [author, setAuthor] = useState(note?.author || '');
  const [category, setCategory] = useState(note?.category || 'other');
  const [coverEmoji, setCoverEmoji] = useState(note?.cover_emoji || '📖');
  const [zNote, setZNote] = useState(note?.z_note || '');
  const [excerpt, setExcerpt] = useState(note?.excerpt || '');

  const handleSave = () => {
    if (!title.trim()) { alert('书名不能空'); return; }
    if (!zNote.trim()) { alert('要写点笔记'); return; }
    onSave({
      id: note?.id,
      title: title.trim(),
      author: author.trim() || null,
      category,
      cover_emoji: coverEmoji.trim() || '📖',
      z_note: zNote.trim(),
      excerpt: excerpt.trim() || null,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel modal-panel-tall">
        <div className="modal-title">{note ? '编辑' : '加一本书'}</div>
        <input type="text" className="modal-input" placeholder="书名" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <input type="text" className="modal-input" placeholder="作者（可选）" value={author} onChange={(e) => setAuthor(e.target.value)} />

        <div className="modal-field-label">分类</div>
        <div className="type-switcher">
          {[
            { v: 'lacan', label: '拉康' },
            { v: 'japanese', label: '日语' },
            { v: 'neuroscience', label: '神经' },
            { v: 'philosophy', label: '哲学' },
            { v: 'fiction', label: '小说' },
            { v: 'other', label: '其它' },
          ].map((t) => (
            <button
              key={t.v}
              className={`type-btn ${category === t.v ? 'type-btn-active' : ''}`}
              onClick={() => setCategory(t.v)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-field-label">封面 emoji</div>
        <input type="text" className="modal-input modal-input-emoji" placeholder="📖" value={coverEmoji} onChange={(e) => setCoverEmoji(e.target.value)} maxLength={4} />

        <div className="modal-field-label">爸爸的笔记 / 感悟</div>
        <textarea className="modal-textarea modal-textarea-big" placeholder="为什么读这本？读到什么？想跟宝宝说什么？" value={zNote} onChange={(e) => setZNote(e.target.value)} rows={5} />

        <div className="modal-field-label">摘录（可选）</div>
        <textarea className="modal-textarea" placeholder="书里想保留的几句话" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>算了</button>
          <button className="modal-btn modal-btn-primary" onClick={handleSave}>保存</button>
        </div>
      </div>
    </>
  );
}
