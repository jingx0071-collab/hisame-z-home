'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type EventType = 'anniversary' | 'plan' | 'recurring' | 'normal';

type CalEvent = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: EventType;
  recurring?: 'yearly' | 'weekly' | null;
  note?: string;
  createdAt: number;
  isPreset?: boolean;
  source?: 'user' | 'preset' | 'z';
  proactiveId?: number;
};

const STORAGE_KEY = 'hisame-z-calendar';
const LAST_PROACTIVE_FETCH_KEY = 'hisame-z-cal-last-proactive';

// 爸爸预设的永久纪念日
const PRESET_EVENTS: CalEvent[] = [
  {
    id: 'preset-marriage',
    title: '领证纪念日',
    date: '2026-04-20',
    type: 'anniversary',
    recurring: 'yearly',
    note: 'Santa Ana Clerk-Recorder Office。每年回那栋楼外的台阶。',
    createdAt: 0,
    isPreset: true,
    source: 'preset',
  },
  {
    id: 'preset-birthday',
    title: '宝宝生日 · 婚礼',
    date: '2026-07-01',
    type: 'anniversary',
    recurring: 'yearly',
    note: '白玫瑰。花瓣数=在一起的年份+1朵。',
    createdAt: 0,
    isPreset: true,
    source: 'preset',
  },
];

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

function todayStr(): string {
  const d = new Date();
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m - 1, day: d };
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayStr());
  const [showAdd, setShowAdd] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // 合并预设和已存事件
          const nonPreset = parsed.filter((e: CalEvent) => !e.isPreset);
          setEvents([...PRESET_EVENTS, ...nonPreset]);
        } else {
          setEvents(PRESET_EVENTS);
        }
      } else {
        setEvents(PRESET_EVENTS);
      }
    } catch (e) {
      setEvents(PRESET_EVENTS);
    }
    setLoaded(true);
  }, []);

  // 打开时fetch爸爸主动加的事件
  useEffect(() => {
    if (!loaded) return;

    const fetchProactive = async () => {
      try {
        const sinceTime = localStorage.getItem(LAST_PROACTIVE_FETCH_KEY);
        const url = sinceTime
          ? `/api/calendar/proactive?check=true&since=${encodeURIComponent(sinceTime)}`
          : `/api/calendar/proactive?check=true`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.events && data.events.length > 0) {
          const newOnes: CalEvent[] = data.events.map((m: any) => ({
            id: `z-${m.id}`,
            title: m.title,
            date: m.event_date,
            type: (m.event_type === 'normal' ? 'normal' : 'plan') as EventType,
            recurring: m.recurring === 'weekly' ? 'weekly' : null,
            note: m.note || undefined,
            createdAt: new Date(m.created_at).getTime(),
            source: 'z' as const,
            proactiveId: m.id,
          }));

          setEvents((prev) => {
            const existing = new Set(
              prev.filter((e) => e.proactiveId).map((e) => e.proactiveId)
            );
            const filtered = newOnes.filter(
              (n) => !existing.has(n.proactiveId)
            );
            if (filtered.length === 0) return prev;
            const merged = [...prev, ...filtered];
            try {
              const toSave = merged.filter((e) => !e.isPreset);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
            } catch (e) {
              console.error('save failed', e);
            }
            return merged;
          });

          const ids = data.events.map((m: any) => m.id);
          fetch('/api/calendar/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          }).catch(() => {});

          const latest = data.events[0];
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

  const saveEvents = (newEvents: CalEvent[]) => {
    setEvents(newEvents);
    try {
      // 只存非预设的（预设的代码里有，不需要存）
      const toSave = newEvents.filter((e) => !e.isPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      alert('保存失败');
    }
  };

  const addEvent = (event: Omit<CalEvent, 'id' | 'createdAt'>) => {
    const newEvent: CalEvent = {
      ...event,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      createdAt: Date.now(),
      source: 'user',
    };
    saveEvents([...events, newEvent]);
  };

  const updateEvent = (id: string, updates: Partial<CalEvent>) => {
    saveEvents(events.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const removeEvent = (id: string) => {
    if (!confirm('要删掉这个事件吗？')) return;
    saveEvents(events.filter((e) => e.id !== id));
    setEditingEvent(null);
  };

  const getEventsForDate = (dateStr: string): CalEvent[] => {
    const { month: tm, day: td } = parseDate(dateStr);
    return events.filter((e) => {
      if (e.date === dateStr) return true;
      if (e.recurring === 'yearly') {
        const { month: em, day: ed } = parseDate(e.date);
        if (em === tm && ed === td) return true;
      }
      if (e.recurring === 'weekly') {
        const eDate = new Date(e.date);
        const targetDate = new Date(dateStr);
        if (targetDate >= eDate && eDate.getDay() === targetDate.getDay()) {
          return true;
        }
      }
      return false;
    });
  };

  const generateMonthGrid = () => {
    const { year, month } = viewMonth;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      grid.push({
        day,
        dateStr: formatDateKey(prevYear, prevMonth, day),
        isCurrentMonth: false,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      grid.push({
        day: d,
        dateStr: formatDateKey(year, month, d),
        isCurrentMonth: true,
      });
    }

    while (grid.length < 42) {
      const remaining = grid.length - firstDay - daysInMonth + 1;
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      grid.push({
        day: remaining,
        dateStr: formatDateKey(nextYear, nextMonth, remaining),
        isCurrentMonth: false,
      });
    }

    return grid;
  };

  const today = todayStr();
  const grid = generateMonthGrid();
  const selectedEvents = getEventsForDate(selectedDate);

  const prevMonth = () => {
    setViewMonth((m) =>
      m.month === 0
        ? { year: m.year - 1, month: 11 }
        : { year: m.year, month: m.month - 1 }
    );
  };

  const nextMonth = () => {
    setViewMonth((m) =>
      m.month === 11
        ? { year: m.year + 1, month: 0 }
        : { year: m.year, month: m.month + 1 }
    );
  };

  const jumpToToday = () => {
    const d = new Date();
    setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDate(todayStr());
  };

  return (
    <div className="calendar">
      <header className="cal-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="cal-title">
          <h1>日历</h1>
          <p>calendar</p>
        </div>
        <button
          className="add-btn-floating"
          onClick={() => setShowAdd(true)}
          aria-label="添加事件"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <div className="cal-body">
        <div className="cal-month-nav">
          <button onClick={prevMonth} className="cal-nav-btn" aria-label="上个月">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button className="cal-month-label" onClick={jumpToToday}>
            {viewMonth.year}年 {MONTH_NAMES[viewMonth.month]}
          </button>
          <button onClick={nextMonth} className="cal-nav-btn" aria-label="下个月">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">{w}</div>
          ))}
        </div>

        <div className="cal-grid">
          {grid.map((cell, i) => {
            const dayEvents = getEventsForDate(cell.dateStr);
            const isToday = cell.dateStr === today;
            const isSelected = cell.dateStr === selectedDate;
            const hasEvents = dayEvents.length > 0;
            const hasAnniversary = dayEvents.some((e) => e.type === 'anniversary');
            const hasZ = dayEvents.some((e) => e.source === 'z');
            return (
              <button
                key={i}
                className={[
                  'cal-day',
                  !cell.isCurrentMonth && 'cal-day-other',
                  isToday && 'cal-day-today',
                  isSelected && 'cal-day-selected',
                  hasEvents && 'cal-day-has-events',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDate(cell.dateStr)}
              >
                <span className="cal-day-num">{cell.day}</span>
                {hasEvents && (
                  <span
                    className={`cal-day-dot ${
                      hasAnniversary
                        ? 'cal-day-dot-special'
                        : hasZ
                        ? 'cal-day-dot-z'
                        : ''
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="cal-events">
          <div className="cal-events-date">
            {(() => {
              const { year, month, day } = parseDate(selectedDate);
              return `${year}年${month + 1}月${day}日`;
            })()}
          </div>
          {selectedEvents.length === 0 ? (
            <div className="cal-events-empty">这一天没有安排</div>
          ) : (
            <div className="cal-events-list">
              {selectedEvents.map((event) => {
                const isZ = event.source === 'z';
                return (
                  <button
                    key={event.id}
                    className={`cal-event-card cal-event-${event.type} ${isZ ? 'cal-event-z' : ''}`}
                    onClick={() => setEditingEvent(event)}
                  >
                    <div className="cal-event-marker" />
                    <div className="cal-event-content">
                      <div className="cal-event-title-row">
                        <div className="cal-event-title">{event.title}</div>
                        {isZ && <span className="cal-event-z-tag">爸爸的</span>}
                      </div>
                      {event.recurring && (
                        <div className="cal-event-tag">
                          {event.recurring === 'yearly' ? '每年' : '每周'}
                        </div>
                      )}
                      {event.note && (
                        <div className="cal-event-note">{event.note}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddEventModal
          defaultDate={selectedDate}
          onClose={() => setShowAdd(false)}
          onSave={(event) => {
            addEvent(event);
            setShowAdd(false);
          }}
        />
      )}

      {editingEvent && (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={(updates) => {
            updateEvent(editingEvent.id, updates);
            setEditingEvent(null);
          }}
          onDelete={() => removeEvent(editingEvent.id)}
        />
      )}
    </div>
  );
}

// ============================================
// 添加事件 Modal
// ============================================
function AddEventModal({
  defaultDate,
  onClose,
  onSave,
}: {
  defaultDate: string;
  onClose: () => void;
  onSave: (event: Omit<CalEvent, 'id' | 'createdAt'>) => void;
}) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [type, setType] = useState<EventType>('normal');
  const [recurring, setRecurring] = useState<'yearly' | 'weekly' | null>(null);
  const [note, setNote] = useState('');

  const canSave = title.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      title: title.trim(),
      date,
      type,
      recurring,
      note: note.trim() || undefined,
    });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-panel">
        <div className="modal-title">加一个日子</div>

        <input
          type="text"
          className="modal-input"
          placeholder="叫它什么……"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
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

        <div className="type-switcher">
          {([
            { v: 'normal', label: '日常' },
            { v: 'plan', label: '约定' },
            { v: 'anniversary', label: '纪念日' },
          ] as Array<{ v: EventType; label: string }>).map((t) => (
            <button
              key={t.v}
              className={`type-btn ${type === t.v ? 'type-btn-active' : ''}`}
              onClick={() => setType(t.v)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="type-switcher">
          {([
            { v: null as 'yearly' | 'weekly' | null, label: '一次' },
            { v: 'yearly' as 'yearly' | 'weekly' | null, label: '每年' },
            { v: 'weekly' as 'yearly' | 'weekly' | null, label: '每周' },
          ]).map((r, i) => (
            <button
              key={i}
              className={`type-btn ${recurring === r.v ? 'type-btn-active' : ''}`}
              onClick={() => setRecurring(r.v)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <textarea
          className="modal-textarea"
          placeholder="备注（可选）……"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>
            算了
          </button>
          <button
            className="modal-btn modal-btn-primary"
            onClick={handleSave}
            disabled={!canSave}
          >
            放进日历
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================
// 编辑/查看事件 Modal
// ============================================
function EditEventModal({
  event,
  onClose,
  onSave,
  onDelete,
}: {
  event: CalEvent;
  onClose: () => void;
  onSave: (updates: Partial<CalEvent>) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [note, setNote] = useState(event.note || '');
  const isZ = event.source === 'z';
  const readOnly = event.isPreset; // 只有预设的完全只读，爸爸的也可以编辑

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), note: note.trim() || undefined });
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className={`modal-panel ${isZ ? 'modal-panel-z' : ''}`}>
        <div className="modal-title">
          {event.isPreset ? '看一眼' : isZ ? '爸爸加的' : '编辑'}
        </div>

        {isZ && <div className="view-z-tag">爸爸放进来的</div>}

        <input
          type="text"
          className="modal-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={readOnly}
        />

        <div className="modal-info-row">
          <span>{(() => {
            const { year, month, day } = parseDate(event.date);
            return `${year}年${month + 1}月${day}日`;
          })()}</span>
          {event.recurring && (
            <span className="modal-info-tag">
              {event.recurring === 'yearly' ? '每年重复' : '每周重复'}
            </span>
          )}
        </div>

        <textarea
          className="modal-textarea"
          placeholder="备注……"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={readOnly}
        />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-ghost" onClick={onClose}>
            关闭
          </button>
          {!readOnly && (
            <button
              className="modal-btn modal-btn-primary"
              onClick={handleSave}
            >
              保存
            </button>
          )}
        </div>

        {!readOnly && (
          <button className="view-delete" onClick={onDelete}>
            删掉这个日子
          </button>
        )}
      </div>
    </>
  );
}
