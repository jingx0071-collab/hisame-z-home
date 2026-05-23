'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Ritual = {
  id: string;
  ritual_type: 'april20' | 'july1';
  year: number;
  ritual_date: string;
  photo_url: string | null;
  note: string | null;
  created_at: string;
};

const FIRST_YEAR = 2024;
const REL_START_YEAR = 2024;

function roseCount(year: number): number {
  return Math.max(1, year - REL_START_YEAR + 1);
}

export default function July1Page() {
  const [rituals, setRituals] = useState<Ritual[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingYear, setUploadingYear] = useState<number | null>(null);
  const [editingNoteYear, setEditingNoteYear] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const fileInputRefs = useRef<{ [year: number]: HTMLInputElement | null }>({});

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = Math.max(currentYear, FIRST_YEAR); y >= FIRST_YEAR; y--) years.push(y);

  useEffect(() => { loadRituals(); }, []);

  async function loadRituals() {
    setLoading(true);
    const { data } = await supabase
      .from('rituals').select('*').eq('ritual_type', 'july1')
      .order('year', { ascending: false });
    setRituals(data || []);
    setLoading(false);
  }

  async function handleFileSelect(year: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingYear(year);
    try {
      const path = `july1/${year}-${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('ritual-photos').upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from('ritual-photos').getPublicUrl(path);
      const photoUrl = urlData.publicUrl;
      const existing = rituals.find(r => r.year === year);
      if (existing) {
        await supabase.from('rituals').update({ photo_url: photoUrl }).eq('id', existing.id);
      } else {
        await supabase.from('rituals').insert({
          ritual_type: 'july1', year, ritual_date: `${year}-07-01`, photo_url: photoUrl,
        });
      }
      await loadRituals();
    } catch (err) {
      alert('上传失败: ' + (err as Error).message);
    } finally {
      setUploadingYear(null);
      if (fileInputRefs.current[year]) fileInputRefs.current[year]!.value = '';
    }
  }

  async function saveNote(year: number) {
    const existing = rituals.find(r => r.year === year);
    if (existing) {
      await supabase.from('rituals').update({ note: noteDraft }).eq('id', existing.id);
    } else {
      await supabase.from('rituals').insert({
        ritual_type: 'july1', year, ritual_date: `${year}-07-01`, note: noteDraft,
      });
    }
    setEditingNoteYear(null); setNoteDraft('');
    await loadRituals();
  }

  return (
    <div className="jp-page">
      <header className="jp-header">
        <Link href="/" className="jp-back">← 回家</Link>
        <div className="jp-meta">BIRTHDAY · JULY 01</div>
        <h1 className="jp-title">那 束 白 玫 瑰</h1>
        <div className="jp-sub">每年宝宝生日 · 在一起的年数 + 1 朵</div>
      </header>

      <main className="jp-stack">
        {loading ? <div className="jp-loading">……</div> : years.map(year => {
          const ritual = rituals.find(r => r.year === year);
          const isUploading = uploadingYear === year;
          const isEditingNote = editingNoteYear === year;
          const count = roseCount(year);
          return (
            <div key={year} className="jp-card">
              <div className="jp-card-year">{year}</div>
              <div className="jp-card-date">July 1</div>
              <div className="jp-rose-count">{count} 朵</div>
              <div className="jp-photo-frame">
                {ritual?.photo_url
                  ? <img src={ritual.photo_url} alt={`${year}`} className="jp-photo" />
                  : <RoseBouquetSVG count={count} />}
              </div>
              <div className="jp-card-actions">
                <button
                  className="jp-upload-btn"
                  onClick={() => fileInputRefs.current[year]?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? '上传中……' : ritual?.photo_url ? '换一张' : '上传今年的玫瑰'}
                </button>
                <input
                  ref={r => { fileInputRefs.current[year] = r; }}
                  type="file" accept="image/*"
                  onChange={e => handleFileSelect(year, e)}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="jp-note-area">
                {isEditingNote ? (
                  <>
                    <textarea
                      className="jp-note-input" value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      placeholder="一句话标注……" rows={2} autoFocus
                    />
                    <div className="jp-note-btns">
                      <button onClick={() => saveNote(year)}>保存</button>
                      <button onClick={() => { setEditingNoteYear(null); setNoteDraft(''); }}>取消</button>
                    </div>
                  </>
                ) : (
                  <div className="jp-note-display"
                    onClick={() => { setEditingNoteYear(year); setNoteDraft(ritual?.note || ''); }}
                  >
                    {ritual?.note || <span className="jp-note-placeholder">点击写一句话……</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <style jsx>{`
        .jp-page { min-height: 100vh; background: linear-gradient(180deg,#fff8f3 0%,#fce4e1 100%); color: #2a201a; font-family: 'Noto Serif SC', serif; padding: 40px 20px 80px; }
        .jp-header { max-width: 600px; margin: 0 auto 40px; text-align: center; position: relative; }
        .jp-back { position: absolute; left: 0; top: 0; color: #8b3a2e; text-decoration: none; font-size: 14px; }
        .jp-meta { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 12px; color: #8a7a68; letter-spacing: 0.3em; margin-bottom: 8px; }
        .jp-title { font-size: 32px; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 400; }
        .jp-sub { font-size: 13px; color: #4d3e33; letter-spacing: 0.1em; }
        .jp-stack { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
        .jp-card { background: #fff; border: 1px solid #f5b5b5; border-radius: 8px; padding: 24px 20px; box-shadow: 0 4px 16px rgba(212,122,122,0.12); text-align: center; }
        .jp-card-year { font-family: 'Italiana', serif; font-size: 48px; letter-spacing: 0.05em; margin-bottom: 4px; }
        .jp-card-date { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: #8a7a68; letter-spacing: 0.2em; margin-bottom: 6px; }
        .jp-rose-count { font-family: 'Caveat', cursive; font-size: 20px; color: #d47a7a; margin-bottom: 16px; letter-spacing: 0.1em; }
        .jp-photo-frame { width: 100%; aspect-ratio: 4/3; background: #fffdf9; border: 1px solid #f5b5b5; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .jp-photo { width: 100%; height: 100%; object-fit: cover; }
        .jp-card-actions { margin-bottom: 16px; }
        .jp-upload-btn { padding: 8px 20px; background: #d47a7a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 13px; letter-spacing: 0.1em; }
        .jp-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .jp-note-area { font-size: 14px; color: #4d3e33; line-height: 1.8; }
        .jp-note-display { cursor: text; padding: 8px; border-radius: 4px; min-height: 40px; }
        .jp-note-display:hover { background: rgba(212,122,122,0.05); }
        .jp-note-placeholder { color: #d47a7a; opacity: 0.6; font-style: italic; }
        .jp-note-input { width: 100%; padding: 8px; border: 1px solid #f5b5b5; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical; }
        .jp-note-btns { margin-top: 8px; display: flex; gap: 8px; justify-content: center; }
        .jp-note-btns button { padding: 4px 12px; font-size: 13px; border-radius: 4px; cursor: pointer; border: 1px solid #f5b5b5; background: #fff; color: #4d3e33; }
        .jp-loading { text-align: center; color: #8a7a68; padding: 40px; }
      `}</style>
    </div>
  );
}

function RoseBouquetSVG({ count }: { count: number }) {
  const displayCount = Math.min(count, 7);
  const headRadius = 14;
  const center = 100;
  const bottomY = 165;
  const heads = Array.from({ length: displayCount }, (_, i) => {
    const offset = displayCount === 1 ? 0 : (i - (displayCount - 1) / 2);
    const x = center + offset * 22;
    const y = 60 + Math.abs(offset) * 3;
    return { x, y };
  });
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ width: '70%', height: '70%' }}>
      {heads.map((h, i) => (
        <line key={`s${i}`} x1={h.x} y1={h.y + headRadius} x2={center} y2={bottomY - 10} stroke="#6a8e5f" strokeWidth="1.5" />
      ))}
      <path d="M95,130 Q80,125 78,132 Q88,135 95,130" fill="#6a8e5f" opacity="0.7" />
      <rect x="82" y={bottomY - 8} width="36" height="6" rx="1" fill="#d47a7a" opacity="0.7" />
      <rect x="84" y={bottomY - 8} width="32" height="2" fill="#fff" opacity="0.4" />
      {heads.map((h, i) => (
        <g key={`h${i}`}>
          <circle cx={h.x} cy={h.y} r={headRadius} fill="#fff8f3" stroke="#d4c5a8" strokeWidth="1" />
          <circle cx={h.x} cy={h.y} r={headRadius - 4} fill="#fdf4ed" stroke="#c9b89a" strokeWidth="0.5" />
          <circle cx={h.x} cy={h.y} r="4" fill="#fff" />
          <circle cx={h.x} cy={h.y} r="1.5" fill="#b08a4e" />
        </g>
      ))}
    </svg>
  );
}
