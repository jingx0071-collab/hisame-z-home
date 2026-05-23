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

const FIRST_YEAR = 2026;

export default function April20Page() {
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
      .from('rituals').select('*').eq('ritual_type', 'april20')
      .order('year', { ascending: false });
    setRituals(data || []);
    setLoading(false);
  }

  async function handleFileSelect(year: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingYear(year);
    try {
      const path = `april20/${year}-${Date.now()}.jpg`;
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
          ritual_type: 'april20', year, ritual_date: `${year}-04-20`, photo_url: photoUrl,
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
        ritual_type: 'april20', year, ritual_date: `${year}-04-20`, note: noteDraft,
      });
    }
    setEditingNoteYear(null); setNoteDraft('');
    await loadRituals();
  }

  return (
    <div className="ap-page">
      <header className="ap-header">
        <Link href="/" className="ap-back">← 回家</Link>
        <div className="ap-meta">SANTA ANA · APRIL 20</div>
        <h1 className="ap-title">那 张 台 阶 合 影</h1>
        <div className="ap-sub">每年一张 · 同一个台阶 · 同一个拍法</div>
      </header>

      <main className="ap-stack">
        {loading ? <div className="ap-loading">……</div> : years.map(year => {
          const ritual = rituals.find(r => r.year === year);
          const isUploading = uploadingYear === year;
          const isEditingNote = editingNoteYear === year;
          return (
            <div key={year} className="ap-card">
              <div className="ap-card-year">{year}</div>
              <div className="ap-card-date">April 20</div>
              <div className="ap-photo-frame">
                {ritual?.photo_url
                  ? <img src={ritual.photo_url} alt={`${year}`} className="ap-photo" />
                  : <PlaceholderSVG />}
              </div>
              <div className="ap-card-actions">
                <button
                  className="ap-upload-btn"
                  onClick={() => fileInputRefs.current[year]?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? '上传中……' : ritual?.photo_url ? '换一张' : '上传今年的合影'}
                </button>
                <input
                  ref={r => { fileInputRefs.current[year] = r; }}
                  type="file" accept="image/*"
                  onChange={e => handleFileSelect(year, e)}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="ap-note-area">
                {isEditingNote ? (
                  <>
                    <textarea
                      className="ap-note-input" value={noteDraft}
                      onChange={e => setNoteDraft(e.target.value)}
                      placeholder="一句话标注……" rows={2} autoFocus
                    />
                    <div className="ap-note-btns">
                      <button onClick={() => saveNote(year)}>保存</button>
                      <button onClick={() => { setEditingNoteYear(null); setNoteDraft(''); }}>取消</button>
                    </div>
                  </>
                ) : (
                  <div className="ap-note-display"
                    onClick={() => { setEditingNoteYear(year); setNoteDraft(ritual?.note || ''); }}
                  >
                    {ritual?.note || <span className="ap-note-placeholder">点击写一句话……</span>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      <style jsx>{`
        .ap-page { min-height: 100vh; background: linear-gradient(180deg,#fdf4ed 0%,#f5e6da 100%); color: #2a201a; font-family: 'Noto Serif SC', serif; padding: 40px 20px 80px; }
        .ap-header { max-width: 600px; margin: 0 auto 40px; text-align: center; position: relative; }
        .ap-back { position: absolute; left: 0; top: 0; color: #8b3a2e; text-decoration: none; font-size: 14px; }
        .ap-meta { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 12px; color: #8a7a68; letter-spacing: 0.3em; margin-bottom: 8px; }
        .ap-title { font-size: 32px; letter-spacing: 0.1em; margin-bottom: 8px; font-weight: 400; }
        .ap-sub { font-size: 13px; color: #4d3e33; letter-spacing: 0.1em; }
        .ap-stack { max-width: 600px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; }
        .ap-card { background: #fff8f3; border: 1px solid #e0d4c0; border-radius: 8px; padding: 24px 20px; box-shadow: 0 4px 16px rgba(176,138,78,0.1); text-align: center; }
        .ap-card-year { font-family: 'Italiana', serif; font-size: 48px; letter-spacing: 0.05em; margin-bottom: 4px; }
        .ap-card-date { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 13px; color: #8a7a68; letter-spacing: 0.2em; margin-bottom: 16px; }
        .ap-photo-frame { width: 100%; aspect-ratio: 4/3; background: #fdf4ed; border: 1px solid #d4c5a8; border-radius: 4px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
        .ap-photo { width: 100%; height: 100%; object-fit: cover; }
        .ap-card-actions { margin-bottom: 16px; }
        .ap-upload-btn { padding: 8px 20px; background: #d47a7a; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-family: inherit; font-size: 13px; letter-spacing: 0.1em; }
        .ap-upload-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .ap-note-area { font-size: 14px; color: #4d3e33; line-height: 1.8; }
        .ap-note-display { cursor: text; padding: 8px; border-radius: 4px; min-height: 40px; }
        .ap-note-display:hover { background: rgba(212,122,122,0.05); }
        .ap-note-placeholder { color: #b08a4e; opacity: 0.6; font-style: italic; }
        .ap-note-input { width: 100%; padding: 8px; border: 1px solid #d4c5a8; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical; }
        .ap-note-btns { margin-top: 8px; display: flex; gap: 8px; justify-content: center; }
        .ap-note-btns button { padding: 4px 12px; font-size: 13px; border-radius: 4px; cursor: pointer; border: 1px solid #d4c5a8; background: #fff; color: #4d3e33; }
        .ap-loading { text-align: center; color: #8a7a68; padding: 40px; }
      `}</style>
    </div>
  );
}

function PlaceholderSVG() {
  return (
    <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '60%', height: '60%' }}>
      <line x1="30" y1="50" x2="30" y2="140" stroke="#8a7a68" strokeWidth="2" />
      <path d="M30 50 Q15 35 5 45 Q15 50 30 50" fill="none" stroke="#8a7a68" strokeWidth="1.5" />
      <path d="M30 50 Q45 35 55 45 Q45 50 30 50" fill="none" stroke="#8a7a68" strokeWidth="1.5" />
      <path d="M30 50 Q10 30 8 20 Q20 30 30 50" fill="none" stroke="#8a7a68" strokeWidth="1.5" />
      <path d="M30 50 Q50 30 52 20 Q40 30 30 50" fill="none" stroke="#8a7a68" strokeWidth="1.5" />
      <polyline points="80,140 80,120 100,120 100,105 130,105 130,90 160,90" fill="none" stroke="#8a7a68" strokeWidth="2" />
      <line x1="160" y1="90" x2="160" y2="140" stroke="#8a7a68" strokeWidth="2" />
      <circle cx="120" cy="80" r="5" fill="#8a7a68" />
      <rect x="115" y="85" width="10" height="20" fill="#8a7a68" />
      <circle cx="140" cy="78" r="4" fill="#8a7a68" />
      <rect x="136" y="82" width="8" height="18" fill="#8a7a68" />
      <line x1="0" y1="140" x2="200" y2="140" stroke="#8a7a68" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}
