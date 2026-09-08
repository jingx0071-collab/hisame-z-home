'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import PageArchway from '../_components/PageArchway';
import { useSkin } from '../_components/ThemeProvider';
import { VpFab } from '../_components/vanilla-purple/room-shell';

type CalEvent = { id: string; date: string; title: string; note?: string };

type ApiEvent = {
  id: string;
  date: string;
  title: string;
  note: string;
  created_at?: string;
  updated_at?: string;
};

const STORAGE_KEY = 'v2-calendar-events';
const API_URL = '/api/v2/calendar';

const newTmpId = () => 'tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);

function fromApi(e: ApiEvent): CalEvent {
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    note: e.note || undefined,
  };
}

const monthEn = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const monthCn = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月',
];

function moonPhaseIndex(date: Date): number {
  const ref = new Date(2026, 0, 8).getTime();
  const cycle = ((date.getTime() - ref) / 86400000 % 29.53 + 29.53) % 29.53;
  return Math.floor((cycle / 29.53) * 8) % 8;
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const skin = useSkin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const saveCache = (data: CalEvent[]) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  };

  useEffect(() => {
    // 1. Instant cache
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) setEvents(parsed);
      }
    } catch {}
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (Array.isArray(data.events)) {
        const mapped = data.events.map(fromApi);
        setEvents(mapped);
        saveCache(mapped);
        setSyncError(null);
      } else if (data.error) {
        setSyncError(data.error);
      }
    } catch (e) {
      console.error('fetch calendar failed:', e);
      setSyncError('offline · 用本地 cache');
    } finally {
      setLoading(false);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const monthGrid = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const startOffset = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7;
    const cells: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = startOffset; i > 0; i--) {
      cells.push({ date: new Date(viewYear, viewMonth, 1 - i), isCurrentMonth: false });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ date: new Date(viewYear, viewMonth, day), isCurrentMonth: true });
    }
    let extra = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ date: new Date(viewYear, viewMonth + 1, extra), isCurrentMonth: false });
      extra++;
    }
    return cells;
  }, [viewYear, viewMonth]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return map;
  }, [events]);

  const monthEvents = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    return events
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, viewYear, viewMonth]);

  const handleSave = async (patched: CalEvent) => {
    const isNew = patched.id.startsWith('tmp-');
    try {
      if (isNew) {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: patched.date,
            title: patched.title,
            note: patched.note || '',
          }),
        });
        const data = await res.json();
        if (!data.event) throw new Error(data.error || 'POST failed');
        const serverEvent = fromApi(data.event);
        const updated = events.map((e) => (e.id === patched.id ? serverEvent : e));
        setEvents(updated);
        saveCache(updated);
      } else {
        const res = await fetch(`${API_URL}/${patched.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: patched.date,
            title: patched.title,
            note: patched.note || '',
          }),
        });
        const data = await res.json();
        if (!data.event) throw new Error(data.error || 'PATCH failed');
        const serverEvent = fromApi(data.event);
        const updated = events.map((e) => (e.id === patched.id ? serverEvent : e));
        setEvents(updated);
        saveCache(updated);
      }
      setEditingId(null);
      setSyncError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'save failed';
      setSyncError(msg);
      console.error('save calendar failed:', err);
    }
  };

  const addEvent = () => {
    const d = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const tmpId = newTmpId();
    const e: CalEvent = { id: tmpId, date: d, title: 'untitled', note: '' };
    setEvents((prev) => [...prev, e]);
    setEditingId(tmpId);
  };

  const handleCancelEdit = () => {
    // tmp-prefix means unsaved new entry — remove on cancel
    if (editingId?.startsWith('tmp-')) {
      setEvents((prev) => prev.filter((e) => e.id !== editingId));
    }
    setEditingId(null);
  };

  const deleteEvent = async (id: string) => {
    if (id.startsWith('tmp-')) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) setEditingId(null);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'DELETE failed');
      }
      const updated = events.filter((e) => e.id !== id);
      setEvents(updated);
      saveCache(updated);
      if (editingId === id) setEditingId(null);
      setSyncError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'delete failed';
      setSyncError(msg);
      console.error('delete calendar failed:', err);
    }
  };

  return (
    <main className="v2-phone-frame">
      <div className="v2-status-bar">
        <span>9:41</span>
        <span style={{ letterSpacing: '0.1em' }}>•••• LTE</span>
      </div>

      <PageArchway variant="frame" height={1400} dots={[300, 600, 900, 1200]} />

      <div style={{ position: 'relative', padding: '2.4rem 1.4rem 3rem', zIndex: 2 }}>
        <header style={{ position: 'relative', textAlign: 'center', marginBottom: '1.2rem' }}>
          <div className="v2-display" style={headerTitleStyle}>VII — CALENDAR</div>
          <div style={headerSubStyle}>日 历</div>
        </header>

        {syncError && (
          <div style={{
            padding: '6px 12px', marginBottom: '0.8rem',
            background: 'rgba(170, 80, 80, 0.08)',
            border: '1px solid rgba(170, 80, 80, 0.25)',
            borderRadius: '0',
            fontSize: '0.6rem', fontStyle: 'italic',
            color: '#8a3a3a', letterSpacing: '0.1em',
            textAlign: 'center',
            fontFamily: 'var(--v2-font-display)',
          }}>· sync · {syncError}</div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.2rem', marginBottom: '0.5rem' }}>
          <button onClick={prevMonth} style={navBtnStyle} aria-label="prev">❮</button>
          <div style={{ textAlign: 'center', minWidth: '140px' }}>
            <div style={{
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
              fontSize: '1.55rem', fontWeight: 600,
              color: 'var(--v2-text-strong)', letterSpacing: '0.04em',
              lineHeight: 1.1,
            }}>{monthEn[viewMonth]}</div>
            <div style={{
              fontSize: '0.56rem', letterSpacing: '0.32em',
              color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
              marginTop: '0.2rem',
            }}>{monthCn[viewMonth]} · {viewYear}</div>
          </div>
          <button onClick={nextMonth} style={navBtnStyle} aria-label="next">❯</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', padding: '0.8rem 1rem 0.3rem' }}>
          {[0, 1, 2, 3].map((i) => <MagnoliaIcon key={i} stage={i} />)}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '0.3rem 1rem 0.8rem' }}>
          {[0, 2, 4, 6, 4, 2, 0].map((p, i) => <MoonIcon key={i} phase={p} size={14} />)}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
          marginBottom: '0.4rem',
          borderBottom: '0.5px solid var(--v2-gold-cool)',
          paddingBottom: '0.35rem',
        }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: '0.5rem',
              letterSpacing: '0.18em', color: 'var(--v2-gold)',
              fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '1.2rem' }}>
          {monthGrid.map((cell, i) => {
            const dateStr = fmtDate(cell.date);
            const isToday = dateStr === fmtDate(today);
            const cellEvents = eventsByDate.get(dateStr) || [];
            return (
              <DateCell
                key={i}
                day={cell.date.getDate()}
                isCurrentMonth={cell.isCurrentMonth}
                isToday={isToday}
                moonPhase={moonPhaseIndex(cell.date)}
                eventCount={cellEvents.length}
              />
            );
          })}
        </div>

        <SectionDivider />

        <SectionTitle code="·" label="EVENTS · THIS MONTH" cn="本 月 安 排" />

        {loading && monthEvents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '1.5rem 0',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-faint)',
            letterSpacing: '0.15em',
          }}>· loading ·</div>
        ) : monthEvents.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '1.5rem 0',
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.72rem', color: 'var(--v2-text-faint)',
          }}>nothing scheduled this month yet</div>
        ) : (
          monthEvents.map((e) => (
            <EventRow
              key={e.id}
              event={e}
              editing={editingId === e.id}
              onEnterEdit={() => setEditingId(e.id)}
              onSave={(patch) => handleSave({ ...e, ...patch })}
              onCancel={handleCancelEdit}
              onDelete={() => deleteEvent(e.id)}
            />
          ))
        )}
        {skin !== 'vanilla-purple' && <AddButton onClick={addEvent} />}

        <div style={{ textAlign: 'center', marginTop: '2rem', opacity: 0.7 }}>
          <FooterOrnament />
          <div style={footerInfoStyle}>calendar · HISAME · Z · MMXXVI</div>
        </div>
      </div>
          {skin === 'vanilla-purple' && (
        <VpFab label="Add event" onClick={addEvent} />
      )}
</main>
  );
}

// ─── Styles ───
const backLinkStyle: CSSProperties = {
  position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
  fontSize: '0.8rem', color: 'var(--v2-text-mid)', textDecoration: 'none',
  fontFamily: 'var(--v2-font-display)', fontStyle: 'italic', opacity: 0.75,
};
const headerTitleStyle: CSSProperties = {
  fontSize: '0.92rem', letterSpacing: '0.35em',
  color: 'var(--v2-text-strong)', fontStyle: 'italic', marginBottom: '0.4rem',
};
const headerSubStyle: CSSProperties = {
  fontSize: '0.62rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
};
const footerInfoStyle: CSSProperties = {
  fontSize: '0.55rem', letterSpacing: '0.4em',
  color: 'var(--v2-text-faint)', fontFamily: 'var(--v2-font-display)',
  fontStyle: 'italic', marginTop: '0.6rem',
};
const navBtnStyle: CSSProperties = {
  background: 'transparent', border: 'none', cursor: 'pointer',
  color: 'var(--v2-gold-cool)', fontSize: '0.8rem',
  padding: '0.4rem 0.6rem', opacity: 0.7,
  fontFamily: 'var(--v2-font-display)',
};

// ─── DateCell ───

function DateCell({ day, isCurrentMonth, isToday, moonPhase, eventCount }: {
  day: number; isCurrentMonth: boolean; isToday: boolean;
  moonPhase: number; eventCount: number;
}) {
  return (
    <div style={{
      position: 'relative', aspectRatio: '1', padding: '4px 3px',
      border: isToday ? '1px solid var(--v2-gold)' : '0.5px solid rgba(168, 153, 104, 0.15)',
      background: isToday ? 'rgba(212, 185, 138, 0.1)' : 'transparent',
      opacity: isCurrentMonth ? 1 : 0.25,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        fontSize: '0.62rem',
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        color: isToday ? 'var(--v2-gold)' : 'var(--v2-text-strong)',
        fontWeight: isToday ? 600 : 400, lineHeight: 1,
      }}>{day}</div>
      <div style={{ position: 'absolute', top: '3px', right: '3px' }}>
        <MoonIcon phase={moonPhase} size={7} />
      </div>
      {eventCount > 0 && (
        <div style={{
          position: 'absolute', bottom: '3px', left: '50%',
          transform: 'translateX(-50%)', display: 'flex', gap: '1.5px',
        }}>
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
            <div key={i} style={{
              width: '3px', height: '3px', borderRadius: '50%',
              background: 'var(--v2-gold)',
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MoonIcon ───

function MoonIcon({ phase, size = 14 }: { phase: number; size?: number }) {
  const fill = 'var(--v2-moon)';
  const outline = 'var(--v2-text-faint)';
  const cx = size / 2;
  const r = size / 2 - 0.5;

  let state: 'new' | 'crescent' | 'half' | 'full';
  if (phase === 0) state = 'new';
  else if (phase === 1 || phase === 7) state = 'crescent';
  else if (phase === 2 || phase === 6) state = 'half';
  else state = 'full';

  if (state === 'new') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={outline} strokeWidth="0.4" />
      </svg>
    );
  }
  if (state === 'full') {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill={fill} />
      </svg>
    );
  }
  const isLitRight = phase < 4;
  if (state === 'half') {
    const path = isLitRight
      ? `M ${cx} ${cx - r} A ${r} ${r} 0 0 1 ${cx} ${cx + r} Z`
      : `M ${cx} ${cx - r} A ${r} ${r} 0 0 0 ${cx} ${cx + r} Z`;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={outline} strokeWidth="0.4" />
        <path d={path} fill={fill} />
      </svg>
    );
  }
  const path = isLitRight
    ? `M ${cx} ${cx - r} A ${r} ${r} 0 0 1 ${cx} ${cx + r} A ${r * 0.45} ${r} 0 0 1 ${cx} ${cx - r} Z`
    : `M ${cx} ${cx - r} A ${r} ${r} 0 0 0 ${cx} ${cx + r} A ${r * 0.45} ${r} 0 0 0 ${cx} ${cx - r} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={outline} strokeWidth="0.4" />
      <path d={path} fill={fill} />
    </svg>
  );
}

// ─── MagnoliaIcon ───

function MagnoliaIcon({ stage }: { stage: number }) {
  const main = 'var(--v2-magnolia)';
  const shade = 'var(--v2-magnolia-shade)';
  const stem = 'var(--v2-synapse)';

  if (stage === 0) {
    return (
      <svg width="26" height="32" viewBox="0 0 26 32">
        <ellipse cx="13" cy="12" rx="3.5" ry="7" fill={main} stroke={shade} strokeWidth="0.4" />
        <path d="M 13 18 L 13 30" stroke={stem} strokeWidth="0.6" />
        <path d="M 13 23 Q 17 22, 18 19" stroke={stem} strokeWidth="0.4" fill="none" />
      </svg>
    );
  }
  if (stage === 1) {
    return (
      <svg width="26" height="32" viewBox="0 0 26 32">
        <ellipse cx="10" cy="13" rx="2.5" ry="6.5" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.85" />
        <ellipse cx="16" cy="13" rx="2.5" ry="6.5" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.85" />
        <ellipse cx="13" cy="11" rx="3" ry="6.8" fill={main} stroke={shade} strokeWidth="0.4" />
        <path d="M 13 19 L 13 30" stroke={stem} strokeWidth="0.6" />
        <path d="M 13 25 Q 17 24, 18 21" stroke={stem} strokeWidth="0.4" fill="none" />
      </svg>
    );
  }
  if (stage === 2) {
    return (
      <svg width="28" height="32" viewBox="0 0 28 32">
        <ellipse cx="8" cy="16" rx="2.5" ry="5.5" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.75" transform="rotate(-35 8 16)" />
        <ellipse cx="20" cy="16" rx="2.5" ry="5.5" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.75" transform="rotate(35 20 16)" />
        <ellipse cx="10" cy="13" rx="2.8" ry="6" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.85" transform="rotate(-18 10 13)" />
        <ellipse cx="18" cy="13" rx="2.8" ry="6" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.85" transform="rotate(18 18 13)" />
        <ellipse cx="14" cy="12" rx="3.2" ry="6.5" fill={main} stroke={shade} strokeWidth="0.4" />
        <circle cx="14" cy="11" r="1" fill="var(--v2-gold)" />
        <path d="M 14 20 L 14 30" stroke={stem} strokeWidth="0.5" />
        <path d="M 14 25 Q 18 24, 19 21" stroke={stem} strokeWidth="0.4" fill="none" />
      </svg>
    );
  }
  return (
    <svg width="26" height="32" viewBox="0 0 26 32">
      <ellipse cx="13" cy="14" rx="2.8" ry="5" fill={main} stroke={shade} strokeWidth="0.3" opacity="0.7" />
      <ellipse cx="9" cy="17" rx="2" ry="4" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.55" transform="rotate(-35 9 17)" />
      <ellipse cx="4" cy="23" rx="1.5" ry="3" fill={shade} stroke={shade} strokeWidth="0.3" opacity="0.4" transform="rotate(-65 4 23)" />
      <path d="M 13 19 L 13 30" stroke={stem} strokeWidth="0.5" opacity="0.7" />
    </svg>
  );
}

// ─── SectionTitle / SectionDivider ───

function SectionTitle({ code, label, cn }: { code: string; label: string; cn: string }) {
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginBottom: '0.3rem' }}>
        <span style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.85rem', color: 'var(--v2-gold)', letterSpacing: '0.05em',
        }}>{code}</span>
        <span style={{ flex: 1, height: '1px', background: 'var(--v2-gold-cool)', opacity: 0.4 }} />
        <span style={{
          fontFamily: 'var(--v2-font-display)',
          fontSize: '0.65rem', letterSpacing: '0.22em',
          color: 'var(--v2-text-strong)', fontWeight: 600,
        }}>{label}</span>
      </div>
      <div style={{
        fontSize: '0.55rem', letterSpacing: '0.35em',
        color: 'var(--v2-text-faint)', fontFamily: '"Noto Serif SC", serif',
        textAlign: 'right',
      }}>{cn}</div>
    </div>
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

// ─── EventRow ───

function EventRow({ event, editing, onEnterEdit, onSave, onCancel, onDelete }: {
  event: CalEvent;
  editing: boolean;
  onEnterEdit: () => void;
  onSave: (patch: Partial<CalEvent>) => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  if (editing) return <EventEdit event={event} onSave={onSave} onCancel={onCancel} />;

  const dateLabel = event.date.slice(5).replace('-', '.');

  return (
    <div
      onClick={onEnterEdit}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.5rem 0.3rem',
        borderBottom: '1px dashed rgba(168, 153, 104, 0.25)',
        cursor: 'pointer',
      }}
    >
      <div style={{
        fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
        fontSize: '0.72rem', color: 'var(--v2-gold)',
        letterSpacing: '0.05em', minWidth: '42px',
      }}>{dateLabel}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
          fontSize: '0.85rem', fontWeight: 500,
          color: 'var(--v2-text-strong)', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{event.title}</div>
        {event.note && (
          <div style={{
            fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
            fontSize: '0.6rem', color: 'var(--v2-text-mid)',
            letterSpacing: '0.02em', marginTop: '1px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{event.note}</div>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--v2-text-mid)', fontSize: '0.9rem',
          padding: '4px 6px', opacity: 0.5,
        }}
      >×</button>
    </div>
  );
}

// ─── EventEdit ───

function EventEdit({ event, onSave, onCancel }: {
  event: CalEvent;
  onSave: (patch: Partial<CalEvent>) => void;
  onCancel: () => void;
}) {
  const [local, setLocal] = useState<CalEvent>(event);
  const save = () => onSave(local);
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') onCancel();
  };
  const inp: CSSProperties = {
    background: 'transparent', border: 'none',
    borderBottom: '1px solid var(--v2-gold-cool)',
    color: 'var(--v2-text-strong)',
    fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
    fontSize: '0.78rem', padding: '4px 4px 3px',
    outline: 'none', width: '100%',
  };
  return (
    <div style={{
      padding: '0.7rem 0.4rem 0.6rem',
      borderTop: '0.5px solid var(--v2-gold)',
      borderBottom: '0.5px solid var(--v2-gold)',
      background: 'rgba(212, 185, 138, 0.06)',
      marginBottom: '2px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.5rem 0.7rem', marginBottom: '0.5rem' }}>
        <input
          autoFocus type="date"
          value={local.date}
          onChange={(e) => setLocal({ ...local, date: e.target.value })}
          onKeyDown={handleKey}
          style={{ ...inp, colorScheme: 'dark' }}
        />
        <input
          value={local.title}
          onChange={(e) => setLocal({ ...local, title: e.target.value })}
          onKeyDown={handleKey}
          placeholder="title"
          style={inp}
        />
      </div>
      <input
        value={local.note || ''}
        onChange={(e) => setLocal({ ...local, note: e.target.value })}
        onKeyDown={handleKey}
        placeholder="note (optional)"
        style={{ ...inp, marginBottom: '0.6rem' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        <button onClick={onCancel} style={{
          background: 'transparent', border: '1px solid var(--v2-gold-cool)',
          color: 'var(--v2-text-mid)', fontFamily: 'var(--v2-font-display)',
          fontStyle: 'italic', fontSize: '0.62rem', letterSpacing: '0.12em',
          padding: '4px 12px', cursor: 'pointer', borderRadius: '0',
        }}>cancel</button>
        <button onClick={save} style={{
          background: 'var(--v2-gold)', border: '1px solid var(--v2-gold)',
          color: '#2A1F15', fontFamily: 'var(--v2-font-display)',
          fontStyle: 'italic', fontSize: '0.62rem', fontWeight: 600,
          letterSpacing: '0.12em', padding: '4px 14px',
          cursor: 'pointer', borderRadius: '0',
        }}>save</button>
      </div>
    </div>
  );
}

// ─── AddButton ───

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', background: 'transparent',
      border: '1px dashed var(--v2-gold-cool)',
      color: 'var(--v2-gold-cool)',
      fontFamily: 'var(--v2-font-display)', fontStyle: 'italic',
      fontSize: '0.65rem', letterSpacing: '0.18em',
      padding: '0.5rem 0', marginTop: '0.6rem',
      cursor: 'pointer', borderRadius: '0',
      opacity: 0.6, transition: 'opacity 0.2s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
    >+ add event</button>
  );
}

// ─── FooterOrnament ───

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

// ─── PageArchway ───

