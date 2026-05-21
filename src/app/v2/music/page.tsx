'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Track = {
  id: string;
  title: string;
  artist: string;
  year: string;
  duration: string;
  position: number; // hidden from UI, used for db sort + swap
};
type TracksState = { sideA: Track[]; sideB: Track[] };

type ApiTrack = {
  id: string;
  side: 'sideA' | 'sideB';
  position: number;
  title: string;
  artist: string;
  year: string;
  duration: string;
};

const STORAGE_KEY = 'v2-music-tracks';
const API_URL = '/api/v2/music';

const newTmpId = () =>
  'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

function fromApi(t: ApiTrack): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    year: t.year,
    duration: t.duration,
    position: t.position,
  };
}

const EMPTY_STATE: TracksState = { sideA: [], sideB: [] };

const SPINNING_PLACEHOLDER: Track = {
  id: '',
  title: 'silent',
  artist: '—',
  year: '----',
  duration: '0:00',
  position: 0,
};

export default function MusicPage() {
  const [tracks, setTracks] = useState<TracksState>(EMPTY_STATE);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const saveCache = (state: TracksState) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  };

  useEffect(() => {
    // Instant cache
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.sideA) && Array.isArray(parsed.sideB)) {
          setTracks(parsed);
        }
      }
    } catch {}
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data.tracks)) {
        const sideA: Track[] = [];
        const sideB: Track[] = [];
        for (const t of data.tracks as ApiTrack[]) {
          const track = fromApi(t);
          if (t.side === 'sideA') sideA.push(track);
          else if (t.side === 'sideB') sideB.push(track);
        }
        // Server already sorts by side asc, position asc
        const next = { sideA, sideB };
        setTracks(next);
        saveCache(next);
        setSyncError(null);
      } else if (data.error) {
        setSyncError(data.error);
      }
    } catch (e) {
      console.error('fetch music failed:', e);
      setSyncError('offline · 用本地 cache');
    } finally {
      setLoading(false);
    }
  };

  const updateTrack = async (
    side: 'sideA' | 'sideB',
    id: string,
    patch: Partial<Track>
  ) => {
    const isNew = id.startsWith('tmp-');
    try {
      if (isNew) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            side,
            title: patch.title,
            artist: patch.artist,
            year: patch.year,
            duration: patch.duration,
          }),
        });
        const data = await res.json();
        if (!data.track) throw new Error(data.error || 'POST failed');
        const serverTrack = fromApi(data.track);
        setTracks((prev) => {
          const next = {
            ...prev,
            [side]: prev[side].map((t) => (t.id === id ? serverTrack : t)),
          };
          saveCache(next);
          return next;
        });
      } else {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: patch.title,
            artist: patch.artist,
            year: patch.year,
            duration: patch.duration,
          }),
        });
        const data = await res.json();
        if (!data.track) throw new Error(data.error || 'PATCH failed');
        const serverTrack = fromApi(data.track);
        setTracks((prev) => {
          const next = {
            ...prev,
            [side]: prev[side].map((t) => (t.id === id ? serverTrack : t)),
          };
          saveCache(next);
          return next;
        });
      }
      setSyncError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'save failed';
      setSyncError(msg);
      console.error('save music failed:', err);
    }
  };

  const addTrack = (side: 'sideA' | 'sideB') => {
    const tmpId = newTmpId();
    const positionGuess =
      (tracks[side][tracks[side].length - 1]?.position ?? 0) + 1;
    const t: Track = {
      id: tmpId,
      title: 'untitled',
      artist: 'unknown',
      year: '----',
      duration: '0:00',
      position: positionGuess,
    };
    setTracks((prev) => ({ ...prev, [side]: [...prev[side], t] }));
    setEditingId(tmpId);
  };

  const cancelEdit = () => {
    if (editingId?.startsWith('tmp-')) {
      setTracks((prev) => ({
        sideA: prev.sideA.filter((t) => t.id !== editingId),
        sideB: prev.sideB.filter((t) => t.id !== editingId),
      }));
    }
    setEditingId(null);
  };

  const deleteTrack = async (side: 'sideA' | 'sideB', id: string) => {
    if (id.startsWith('tmp-')) {
      setTracks((prev) => ({
        ...prev,
        [side]: prev[side].filter((t) => t.id !== id),
      }));
      if (editingId === id) setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'DELETE failed');
      }
      setTracks((prev) => {
        const next = {
          ...prev,
          [side]: prev[side].filter((t) => t.id !== id),
        };
        saveCache(next);
        return next;
      });
      if (editingId === id) setEditingId(null);
      setSyncError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'delete failed';
      setSyncError(msg);
      console.error('delete music failed:', err);
    }
  };

  const moveTrack = async (
    side: 'sideA' | 'sideB',
    index: number,
    dir: -1 | 1
  ) => {
    const arr = tracks[side];
    const next = index + dir;
    if (next < 0 || next >= arr.length) return;
    const a = arr[index];
    const b = arr[next];

    // Skip if either is unsaved tmp-
    if (a.id.startsWith('tmp-') || b.id.startsWith('tmp-')) return;

    // Optimistic UI swap (also swaps stored position)
    setTracks((prev) => {
      const newArr = [...prev[side]];
      newArr[index] = { ...b, position: a.position };
      newArr[next] = { ...a, position: b.position };
      const out = { ...prev, [side]: newArr };
      saveCache(out);
      return out;
    });

    // Server-side swap via two PATCH
    try {
      await Promise.all([
        fetch(`${API_URL}/${a.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: b.position }),
        }),
        fetch(`${API_URL}/${b.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ position: a.position }),
        }),
      ]);
      setSyncError(null);
    } catch (err) {
      setSyncError('move failed (refresh to verify)');
      console.error('move failed:', err);
    }
  };

  const spinning = tracks.sideA[0] ?? SPINNING_PLACEHOLDER;

  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.8rem' }}>
          <Link href="/v2" style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.8rem', color: 'var(--v2-text-mid)', textDecoration: 'none',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', opacity: 0.75,
          }}>← back</Link>
          <div className="v2-display" style={{
            fontSize: '0.92rem', letterSpacing: '0.35em',
            color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem',
          }}>
            XVI — MUSIC
          </div>
          <div style={{
            fontSize: '0.62rem', letterSpacing: '0.4em',
            color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
          }}>
            听 歌
          </div>
        </header>

        {syncError && (
          <div style={{
            padding: '6px 12px', marginBottom: '0.8rem',
            background: 'rgba(170, 80, 80, 0.08)',
            border: '1px solid rgba(170, 80, 80, 0.25)',
            borderRadius: '3px',
            fontSize: '0.6rem', fontStyle: 'italic',
            color: '#8a3a3a', letterSpacing: '0.1em',
            textAlign: 'center',
            fontFamily: 'var(--v2-font-display)',
          }}>· sync · {syncError}</div>
        )}

        <div style={{
          textAlign: 'center', fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-mid)', letterSpacing: '0.04em',
          marginBottom: '1.5rem', lineHeight: 1.6,
        }}>
          a turntable, and the songs we keep
        </div>

        <Turntable spinning={spinning} />

        <div style={{ textAlign: 'center', margin: '1.5rem 0 0.5rem' }}>
          <div style={{
            fontSize: '0.5rem', letterSpacing: '0.4em',
            color: 'var(--v2-gold)', fontFamily: 'var(--v2-font-display)',
            fontStyle: 'italic', marginBottom: '0.4rem',
          }}>
            NOW SPINNING · SIDE A · 01
          </div>
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '1.05rem', fontWeight: 600,
            color: 'var(--v2-text-strong)', lineHeight: 1.2,
            marginBottom: '0.2rem',
          }}>
            {spinning.title}
          </div>
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.75rem', color: 'var(--v2-text-mid)',
            letterSpacing: '0.04em',
          }}>
            {spinning.artist} · {spinning.year} · {spinning.duration}
          </div>
        </div>

        <SectionDivider />

        <SideHeader letter="A" label="her side" cn="她 的 这 一 面" />
        {loading && tracks.sideA.length === 0 ? (
          <div style={loadingStyle}>· loading ·</div>
        ) : (
          tracks.sideA.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              side="sideA"
              index={i}
              total={tracks.sideA.length}
              editing={editingId === track.id}
              onEnterEdit={(id) => setEditingId(id)}
              onSave={async (side, id, patch) => {
                await updateTrack(side, id, patch);
                setEditingId(null);
              }}
              onCancel={cancelEdit}
              onDelete={deleteTrack}
              onMove={moveTrack}
            />
          ))
        )}
        <AddButton onClick={() => addTrack('sideA')} />

        <div style={{ height: '1rem' }} />

        <SideHeader letter="B" label="his side" cn="他 的 这 一 面" />
        {loading && tracks.sideB.length === 0 ? (
          <div style={loadingStyle}>· loading ·</div>
        ) : (
          tracks.sideB.map((track, i) => (
            <TrackRow
              key={track.id}
              track={track}
              side="sideB"
              index={i}
              total={tracks.sideB.length}
              editing={editingId === track.id}
              onEnterEdit={(id) => setEditingId(id)}
              onSave={async (side, id, patch) => {
                await updateTrack(side, id, patch);
                setEditingId(null);
              }}
              onCancel={cancelEdit}
              onDelete={deleteTrack}
              onMove={moveTrack}
            />
          ))
        )}
        <AddButton onClick={() => addTrack('sideB')} />

        <div style={{ textAlign: 'center', marginTop: '2.5rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={{
            fontSize: '0.55rem', letterSpacing: '0.4em',
            color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
            fontStyle: 'italic', marginTop: '0.6rem',
          }}>
            spinning · HISAME · Z · MMXXVI
          </div>
        </div>
      </div>
    </main>
  );
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center', padding: '1rem 0',
  fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
  fontSize: '0.7rem', color: 'var(--v2-text-faint)',
  letterSpacing: '0.2em',
};

// ─────────────────────────────────────────────
// Turntable
// ─────────────────────────────────────────────

function Turntable({ spinning }: { spinning: Track }) {
  return (
    <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 35%, #2a2018 0%, #0e0905 45%, #050302 100%)',
        boxShadow: '0 4px 22px rgba(0,0,0,0.55), inset 0 0 24px rgba(0,0,0,0.5)',
        animation: 'v2-rotate 12s linear infinite',
      }}>
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 220 220">
          {[105, 100, 94, 88, 82, 76, 70, 64, 58, 52].map((r) => (
            <circle key={r} cx="110" cy="110" r={r}
              fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="0.4" />
          ))}
        </svg>

        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '92px', height: '92px', borderRadius: '50%',
          background: 'radial-gradient(circle at 40% 40%, var(--v2-magnolia) 0%, var(--v2-magnolia-shade) 70%, #B89A6E 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', padding: '6px',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.3)',
        }}>
          <div style={{
            fontSize: '0.45rem', letterSpacing: '0.15em',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            color: '#5C4A38', lineHeight: 1.2, marginBottom: '2px',
            maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {spinning.artist}
          </div>
          <div style={{
            fontSize: '0.55rem', fontWeight: 600,
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            color: '#2A1F15', lineHeight: 1.15,
            maxWidth: '74px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {spinning.title}
          </div>
          <div style={{
            fontSize: '0.42rem', letterSpacing: '0.2em',
            color: '#5C4A38', marginTop: '3px',
          }}>
            {spinning.year}
          </div>
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#0a0604',
            boxShadow: 'inset 0 0 1px rgba(0,0,0,0.8)',
          }} />
        </div>
      </div>

      <svg
        style={{
          position: 'absolute', top: '-18px', right: '-32px',
          width: '120px', height: '170px',
          pointerEvents: 'none',
        }}
        viewBox="0 0 120 170"
      >
        <circle cx="100" cy="20" r="11" fill="var(--v2-gold-cool)" stroke="var(--v2-gold)" strokeWidth="0.5" />
        <circle cx="100" cy="20" r="6" fill="var(--v2-gold)" />
        <circle cx="100" cy="20" r="2" fill="#3a2e1c" />
        <path d="M 100 20 L 62 95 L 42 118"
          stroke="var(--v2-gold-cool)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 100 20 L 62 95 L 42 118"
          stroke="var(--v2-gold)" strokeWidth="1" fill="none" strokeLinecap="round" />
        <rect x="32" y="110" width="18" height="11"
          fill="var(--v2-gold)" stroke="var(--v2-gold-cool)" strokeWidth="0.4"
          transform="rotate(-32 41 115.5)" />
        <circle cx="40" cy="119" r="1.2" fill="#2a1f15" />
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// Side Header
// ─────────────────────────────────────────────

function SideHeader({ letter, label, cn }: { letter: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.2rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '1.4rem', fontWeight: 600,
          color: 'var(--v2-gold)', letterSpacing: '0.05em',
        }}>
          {letter}
        </span>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.78rem', color: 'var(--v2-text-strong)',
          letterSpacing: '0.06em',
        }}>
          · {label}
        </span>
        <span style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool)', opacity: 0.4 }} />
        <span style={{
          fontSize: '0.5rem', letterSpacing: '0.3em',
          color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        }}>
          {cn}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Track Row
// ─────────────────────────────────────────────

function TrackRow({
  track, side, index, total, editing,
  onEnterEdit, onSave, onCancel, onDelete, onMove,
}: {
  track: Track;
  side: 'sideA' | 'sideB';
  index: number;
  total: number;
  editing: boolean;
  onEnterEdit: (id: string) => void;
  onSave: (side: 'sideA' | 'sideB', id: string, patch: Partial<Track>) => void;
  onCancel: () => void;
  onDelete: (side: 'sideA' | 'sideB', id: string) => void;
  onMove: (side: 'sideA' | 'sideB', index: number, dir: -1 | 1) => void;
}) {
  if (editing) {
    return <TrackEdit track={track} side={side} onSave={onSave} onCancel={onCancel} />;
  }
  return (
    <div
      onClick={() => onEnterEdit(track.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.5rem 0.2rem',
        borderBottom: '1px dashed rgba(168, 153, 104, 0.25)',
        cursor: 'pointer',
      }}
    >
      <span style={{
        fontSize: '0.55rem', letterSpacing: '0.1em',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        color: 'var(--v2-gold)', minWidth: '18px',
      }}>
        {(index + 1).toString().padStart(2, '0')}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.85rem', fontWeight: 500,
          color: 'var(--v2-text-strong)', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.title}
        </div>
        <div style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.6rem', color: 'var(--v2-text-mid)',
          letterSpacing: '0.02em', marginTop: '1px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {track.artist} · {track.year}
        </div>
      </div>

      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.05em',
        color: 'var(--v2-gold-cool)', fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic', minWidth: '32px', textAlign: 'right',
      }}>
        {track.duration}
      </div>

      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        <IconBtn
          disabled={index === 0}
          onClick={(e) => { e.stopPropagation(); onMove(side, index, -1); }}
          label="▲"
        />
        <IconBtn
          disabled={index === total - 1}
          onClick={(e) => { e.stopPropagation(); onMove(side, index, 1); }}
          label="▼"
        />
        <IconBtn
          onClick={(e) => { e.stopPropagation(); onDelete(side, track.id); }}
          label="×"
          isDelete
        />
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, isDelete }: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isDelete?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer',
        padding: '4px 5px',
        fontSize: isDelete ? '0.85rem' : '0.65rem',
        color: disabled ? 'rgba(168, 153, 104, 0.25)' : isDelete ? 'var(--v2-text-mid)' : 'var(--v2-gold-cool)',
        lineHeight: 1, opacity: disabled ? 0.4 : 0.7,
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = disabled ? '0.4' : '0.7'; }}
    >
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────
// Track Edit
// ─────────────────────────────────────────────

function TrackEdit({ track, side, onSave, onCancel }: {
  track: Track;
  side: 'sideA' | 'sideB';
  onSave: (side: 'sideA' | 'sideB', id: string, patch: Partial<Track>) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState<Track>(track);

  const save = () => onSave(side, track.id, local);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') onCancel();
  };

  const inp: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--v2-gold-cool)',
    color: 'var(--v2-text-strong)',
    fontFamily: 'var(--v2-font-display)',
    fontStyle: 'italic',
    fontSize: '0.78rem',
    padding: '4px 4px 3px',
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{
      padding: '0.7rem 0.4rem 0.6rem',
      borderTop: '0.5px solid var(--v2-gold)',
      borderBottom: '0.5px solid var(--v2-gold)',
      background: 'rgba(212, 185, 138, 0.06)',
      marginBottom: '2px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 0.7rem', marginBottom: '0.6rem' }}>
        <input
          autoFocus
          value={local.title}
          onChange={(e) => setLocal({ ...local, title: e.target.value })}
          onKeyDown={handleKey}
          placeholder="title"
          style={inp}
        />
        <input
          value={local.artist}
          onChange={(e) => setLocal({ ...local, artist: e.target.value })}
          onKeyDown={handleKey}
          placeholder="artist"
          style={inp}
        />
        <input
          value={local.year}
          onChange={(e) => setLocal({ ...local, year: e.target.value })}
          onKeyDown={handleKey}
          placeholder="year"
          style={inp}
        />
        <input
          value={local.duration}
          onChange={(e) => setLocal({ ...local, duration: e.target.value })}
          onKeyDown={handleKey}
          placeholder="0:00"
          style={inp}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={onCancel} style={btnSecondaryStyle}>cancel</button>
        <button onClick={save} style={btnPrimaryStyle}>save</button>
      </div>
    </div>
  );
}

const btnSecondaryStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--v2-gold-cool)',
  color: 'var(--v2-text-mid)',
  fontFamily: 'var(--v2-font-display)',
  fontStyle: 'italic',
  fontSize: '0.62rem',
  letterSpacing: '0.12em',
  padding: '4px 12px',
  cursor: 'pointer',
  borderRadius: '1px',
};

const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--v2-gold)',
  border: '1px solid var(--v2-gold)',
  color: '#2A1F15',
  fontFamily: 'var(--v2-font-display)',
  fontStyle: 'italic',
  fontSize: '0.62rem',
  fontWeight: 600,
  letterSpacing: '0.12em',
  padding: '4px 14px',
  cursor: 'pointer',
  borderRadius: '1px',
};

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'transparent',
        border: '1px dashed var(--v2-gold-cool)',
        color: 'var(--v2-gold-cool)',
        fontFamily: 'var(--v2-font-display)',
        fontStyle: 'italic',
        fontSize: '0.65rem',
        letterSpacing: '0.18em',
        padding: '0.5rem 0',
        marginTop: '0.4rem',
        cursor: 'pointer',
        borderRadius: '1px',
        opacity: 0.6,
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
    >
      + add track
    </button>
  );
}

function SectionDivider() {
  return (
    <div style={{ textAlign: 'center', margin: '1.2rem 0 1.4rem' }}>
      <svg width="80" height="10" viewBox="0 0 80 10">
        <path d="M 12 5 L 32 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <path d="M 48 5 L 68 5" stroke="var(--v2-gold-cool)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="1.6" fill="none" stroke="var(--v2-gold)" strokeWidth="0.4" />
        <circle cx="40" cy="5" r="0.6" fill="var(--v2-gold)" />
      </svg>
    </div>
  );
}

function FooterOrnament() {
  return (
    <svg width="84" height="14" viewBox="0 0 84 14">
      <path d="M 20 7 L 36 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <path d="M 48 7 L 64 7" stroke="var(--v2-gold-cool)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="2.2" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="42" cy="7" r="0.9" fill="var(--v2-gold)" />
    </svg>
  );
}

function PageArchway() {
  return (
    <svg
      style={{
        position: 'absolute', top: '34px', left: 0, right: 0,
        width: '100%', height: 'calc(100% - 34px)',
        pointerEvents: 'none', zIndex: 1,
      }}
      viewBox="0 0 375 1400"
      preserveAspectRatio="none"
    >
      <path d="M 16 60 Q 187 18, 358 60" stroke="var(--v2-gold-cool)" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 22 60 Q 187 30, 352 60" stroke="var(--v2-gold)" strokeWidth="0.3" fill="none" opacity="0.5" />
      <circle cx="187" cy="32" r="3" fill="none" stroke="var(--v2-gold)" strokeWidth="0.5" />
      <circle cx="187" cy="32" r="1.2" fill="var(--v2-gold)" />
      <path d="M 175 40 L 187 28 L 199 40" stroke="var(--v2-gold)" strokeWidth="0.4" fill="none" opacity="0.7" />

      <line x1="16" y1="60" x2="16" y2="1360" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="358" y1="60" x2="358" y2="1360" stroke="var(--v2-gold-cool)" strokeWidth="0.5" opacity="0.6" />
      <line x1="20" y1="60" x2="20" y2="1360" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />
      <line x1="354" y1="60" x2="354" y2="1360" stroke="var(--v2-gold)" strokeWidth="0.25" opacity="0.3" />

      {[300, 600, 900, 1200].map((y) => (
        <g key={y}>
          <circle cx="16" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
          <circle cx="358" cy={y} r="1.5" fill="var(--v2-gold)" opacity="0.6" />
        </g>
      ))}

      <path d="M 16 1360 Q 187 1380, 358 1360" stroke="var(--v2-gold-cool)" strokeWidth="0.5" fill="none" opacity="0.6" />
      <circle cx="187" cy="1372" r="1.8" fill="var(--v2-gold)" opacity="0.7" />
    </svg>
  );
}
