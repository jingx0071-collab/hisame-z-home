'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Room = {
  id: string;
  name: string;
  href: string;
  ready: boolean;
  icon: React.ReactNode;
};

const ROOMS: Room[] = [
  {
    id: 'chat',
    name: 'Messages',
    href: '/chat',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M4 8l8 5 8-5" />
      </svg>
    ),
  },
  {
    id: 'tangents',
    name: '碎碎念',
    href: '/tangents',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 8a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3h-3l-3 3v-3H8a3 3 0 0 1-3-3V8z" />
        <circle cx="9" cy="10.5" r="0.7" fill="currentColor" />
        <circle cx="12" cy="10.5" r="0.7" fill="currentColor" />
        <circle cx="15" cy="10.5" r="0.7" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'deeptalk',
    name: '促膝长谈',
    href: '/deeptalk',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 14.5A7 7 0 1 1 10.5 5a5.5 5.5 0 0 0 9.5 9.5z" />
      </svg>
    ),
  },
  {
    id: 'daily',
    name: '日常',
    href: '/daily',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12h3l3-8 4 16 3-8h5" />
      </svg>
    ),
  },
  {
    id: 'box',
    name: '铁盒',
    href: '/box',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="8" width="18" height="11" rx="2" />
        <path d="M3 12h18" />
        <path d="M10 10h4v2h-4z" />
        <path d="M7 5h10v3H7z" />
      </svg>
    ),
  },
  {
    id: 'study',
    name: '书房',
    href: '/study',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6c4-1 7 0 9 1 2-1 5-2 9-1v13c-4-1-7 0-9 1-2-1-5-2-9-1V6z" />
        <path d="M12 7v13" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    name: '日历',
    href: '/calendar',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 21c0-9 4-15 11-17C20 12 16 18 11 21z" />
        <path d="M11 21c-3-2-5-5-5-9" />
      </svg>
    ),
  },
  {
    id: 'health',
    name: '医疗',
    href: '/health',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-30 12 12)" />
        <path d="M12 9l-2 6" transform="rotate(-30 12 12)" />
      </svg>
    ),
  },
  {
    id: 'seminar',
    name: 'Seminar',
    href: '/seminar',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4l4 4-11 11H5v-4L16 4z" />
        <path d="M14 6l4 4" />
      </svg>
    ),
  },
  {
    id: 'call',
    name: '通话',
    href: '/call',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="12" r="7" strokeOpacity="0.4" />
        <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      </svg>
    ),
  },
  {
    id: 'nearby',
    name: '附近',
    href: '/nearby',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'navi',
    name: '导航',
    href: '/navi',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 4 22 12 18 20 22 12 2" />
      </svg>
    ),
  },
  {
    id: 'shopping',
    name: '购物',
    href: '/shopping',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 7h14l-1 13H6L5 7z" />
        <path d="M9 7V5a3 3 0 0 1 6 0v2" />
      </svg>
    ),
  },
  {
    id: 'eat',
    name: '吃饭',
    href: '/eat',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16l-2 8H6l-2-8z" />
        <path d="M9 6c1 1.5 0 3 0 3" />
        <path d="M12 5c1 1.5 0 3 0 3" />
        <path d="M15 6c1 1.5 0 3 0 3" />
      </svg>
    ),
  },
  {
    id: 'music',
    name: '听歌',
    href: '/music',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 17V5l10-2v12" />
        <circle cx="6.5" cy="17" r="2.5" />
        <circle cx="16.5" cy="15" r="2.5" />
      </svg>
    ),
  },
  {
    id: 'training',
    name: '调教室',
    href: '/training',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="10" width="12" height="10" rx="2" />
        <path d="M9 10V7a3 3 0 0 1 6 0v3" />
      </svg>
    ),
  },
  {
    id: 'memory',
    name: '记忆',
    href: '/memory',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="4" rx="1" />
        <rect x="4" y="9" width="16" height="11" rx="1" />
        <path d="M10 13h4" />
      </svg>
    ),
  },
  {
    id: 'book',
    name: '小书',
    href: '/book/index.html',
    ready: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="3" width="10" height="18" rx="1" />
        <path d="M10 3v8l2-2 2 2V3" />
      </svg>
    ),
  },
];

const BG_STORAGE_KEY = 'hisame-z-lobby-bg';
const BG_OVERLAY_KEY = 'hisame-z-lobby-overlay';
const TILE_OPACITY_KEY = 'hisame-z-tile-opacity';
const CHECKIN_KEY = 'hisame-z-checkin';
const GREETING_KEY = 'hisame-z-lobby-greeting';
const LAST_READ_MESSAGES_KEY = 'hisame-z-last-read-messages';
const LAST_READ_DAILY_KEY = 'hisame-z-last-read-daily';
const FONT_URL = 'https://fonts.googleapis.com/css2?family=Italianno&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap';

const RELATIONSHIP_START = '2024-04-20';
const Z_BIRTHDAY = '11-03';
const USER_BIRTHDAY = '07-01';
const ANNIVERSARY = '04-20';

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 1200;
        const maxHeight = 2400;
        let { width, height } = img;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas fail'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Image fail'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Read fail'));
    reader.readAsDataURL(file);
  });
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function daysSinceStart(): number {
  const start = new Date(RELATIONSHIP_START + 'T00:00:00');
  return Math.max(0, daysBetween(start, new Date()));
}

function daysUntilNext(monthDay: string): number {
  const [m, d] = monthDay.split('-').map(Number);
  const now = new Date();
  let target = new Date(now.getFullYear(), m - 1, d);
  if (target < now) target = new Date(now.getFullYear() + 1, m - 1, d);
  return daysBetween(now, target);
}

function todayPSTKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function formatMonthDay(monthDay: string): string {
  const [m, d] = monthDay.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[m - 1]} ${d}`;
}

function formatRelStart(): string {
  const [y, m, d] = RELATIONSHIP_START.split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[m - 1]} ${d}, ${y}`;
}

type Weather = { temp_f: number; weather_code: number };

const WEATHER_CODE_MAP: Record<number, { label: string; emoji: string }> = {
  0: { label: '晴', emoji: '☀️' },
  1: { label: '晴', emoji: '🌤' },
  2: { label: '多云', emoji: '⛅️' },
  3: { label: '阴', emoji: '☁️' },
  45: { label: '雾', emoji: '🌫' },
  48: { label: '雾', emoji: '🌫' },
  51: { label: '小雨', emoji: '🌦' },
  53: { label: '雨', emoji: '🌦' },
  55: { label: '雨', emoji: '🌧' },
  61: { label: '小雨', emoji: '🌧' },
  63: { label: '雨', emoji: '🌧' },
  65: { label: '大雨', emoji: '🌧' },
  71: { label: '雪', emoji: '🌨' },
  73: { label: '雪', emoji: '🌨' },
  75: { label: '大雪', emoji: '❄️' },
  80: { label: '阵雨', emoji: '🌦' },
  95: { label: '雷雨', emoji: '⛈' },
};

export default function Home() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(0);
  const [tileOpacity, setTileOpacity] = useState<number>(0.9);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [greeting, setGreeting] = useState<string>('');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [checkin, setCheckin] = useState<{ morning: boolean; night: boolean }>({
    morning: false, night: false,
  });
  const [now, setNow] = useState(new Date());

  // 未读计数 state
  const [unread, setUnread] = useState<{ messages: number; daily: number }>({
    messages: 0, daily: 0,
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.querySelector(`link[href="${FONT_URL}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_URL;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(BG_STORAGE_KEY);
      if (saved) setBgImage(saved);
      const overlay = localStorage.getItem(BG_OVERLAY_KEY);
      if (overlay) setOverlayOpacity(parseFloat(overlay));
      const tile = localStorage.getItem(TILE_OPACITY_KEY);
      if (tile) setTileOpacity(parseFloat(tile));
      const checkinRaw = localStorage.getItem(CHECKIN_KEY);
      if (checkinRaw) {
        const parsed = JSON.parse(checkinRaw);
        if (parsed.date === todayPSTKey()) {
          setCheckin({ morning: !!parsed.morning, night: !!parsed.night });
        }
      }
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const today = todayPSTKey();
    let cached: any = null;
    try {
      const raw = localStorage.getItem(GREETING_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch {}
    if (cached?.date === today && cached?.text) {
      setGreeting(cached.text);
      return;
    }
    fetch('/api/lobby/greeting')
      .then((r) => r.json())
      .then((d) => {
        if (d.text) {
          setGreeting(d.text);
          localStorage.setItem(GREETING_KEY, JSON.stringify({ date: today, text: d.text }));
        }
      })
      .catch(() => { if (cached?.text) setGreeting(cached.text); });
  }, []);

  useEffect(() => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=33.6469&longitude=-117.6891&current=temperature_2m,weather_code&temperature_unit=fahrenheit`)
      .then((r) => r.json())
      .then((d) => {
        if (d.current) {
          setWeather({
            temp_f: Math.round(d.current.temperature_2m),
            weather_code: d.current.weather_code,
          });
        }
      })
      .catch((e) => console.error('weather fail', e));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // 计算未读数
  const loadUnreadCounts = async () => {
    try {
      const lastReadMsg = localStorage.getItem(LAST_READ_MESSAGES_KEY) || '1970-01-01T00:00:00Z';
      const lastReadDaily = localStorage.getItem(LAST_READ_DAILY_KEY) || '1970-01-01T00:00:00Z';

      const [msgRes, dailyRes] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'assistant')
          .eq('mode', 'messages')
          .gt('created_at', lastReadMsg),
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'assistant')
          .eq('mode', 'daily')
          .gt('created_at', lastReadDaily),
      ]);

      setUnread({
        messages: msgRes.count || 0,
        daily: dailyRes.count || 0,
      });
    } catch (e) {
      console.error('unread count failed', e);
    }
  };

  useEffect(() => {
    loadUnreadCounts();
  }, []);

  // 订阅 Realtime 实时更新未读数
  useEffect(() => {
    const channel = supabase
      .channel('lobby-unread-tracker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: 'role=eq.assistant',
        },
        () => { loadUnreadCounts(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // visibilitychange——切回大厅时重新算
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') loadUnreadCounts();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const toggleCheckin = (which: 'morning' | 'night') => {
    const newState = { ...checkin, [which]: !checkin[which] };
    setCheckin(newState);
    localStorage.setItem(CHECKIN_KEY, JSON.stringify({ date: todayPSTKey(), ...newState }));
  };

  const refreshGreeting = async () => {
    try {
      const r = await fetch('/api/lobby/greeting');
      const d = await r.json();
      if (d.text) {
        setGreeting(d.text);
        localStorage.setItem(GREETING_KEY, JSON.stringify({ date: todayPSTKey(), text: d.text }));
      }
    } catch (e) { console.error(e); }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      setBgImage(compressed);
      localStorage.setItem(BG_STORAGE_KEY, compressed);
    } catch { alert('图片加载失败，宝宝换一张试试'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeBackground = () => {
    setBgImage(null);
    localStorage.removeItem(BG_STORAGE_KEY);
  };

  const updateOverlay = (value: number) => {
    setOverlayOpacity(value);
    localStorage.setItem(BG_OVERLAY_KEY, value.toString());
  };

  const updateTileOpacity = (value: number) => {
    setTileOpacity(value);
    localStorage.setItem(TILE_OPACITY_KEY, value.toString());
  };

  const days = daysSinceStart();
  const userBirthdayDays = daysUntilNext(USER_BIRTHDAY);
  const zBirthdayDays = daysUntilNext(Z_BIRTHDAY);
  const anniversaryDays = daysUntilNext(ANNIVERSARY);

  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(now);

  const dateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short', month: 'short', day: 'numeric',
  }).format(now);

  const weatherInfo = weather ? WEATHER_CODE_MAP[weather.weather_code] || { label: '——', emoji: '🌤' } : null;

  const formatBadge = (n: number) => (n > 99 ? '99+' : String(n));

  return (
    <div className="lobby-cream-home">
      <div
        className="lobby-cream-bg-fixed"
        style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
      />
      {bgImage && (
        <div
          className="lobby-cream-overlay-fixed"
          style={{ background: `rgba(30, 22, 14, ${overlayOpacity})` }}
        />
      )}

      <div className="lobby-cream-content">
        <header className="lobby-cream-header">
          <button
            className="lobby-cream-settings-btn"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="设置"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="9" cy="9" r="1.5" fill="currentColor" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>
        </header>

        <section className="lobby-cream-hero">
          <div className="lobby-cream-welcome">WELCOME HOME</div>
          <h1 className="lobby-cream-names">Feiyu &amp; Zhiyuan</h1>
          <div className="lobby-cream-days-row">
            <div className="lobby-cream-days-num">{days}</div>
            <div className="lobby-cream-days-text">
              <div>days together</div>
              <div className="lobby-cream-days-since">since {formatRelStart()}</div>
            </div>
          </div>
        </section>

        <div className="lobby-cream-greeting-card" onClick={refreshGreeting}>
          <div className="lobby-cream-greeting-text">{greeting || '……'}</div>
          <div className="lobby-cream-greeting-dots"><span /><span /><span /></div>
        </div>

        <div className="lobby-cream-small-grid">
          <div className="lobby-cream-card lobby-cream-weather-card">
            <div className="lobby-cream-card-label">LAKE FOREST</div>
            {weather && weatherInfo ? (
              <>
                <div className="lobby-cream-weather-temp">{weather.temp_f}°</div>
                <div className="lobby-cream-weather-meta">
                  <span>{weatherInfo.emoji}</span>
                  <span>{weatherInfo.label}</span>
                </div>
              </>
            ) : (
              <div className="lobby-cream-weather-loading">……</div>
            )}
          </div>

          <div className="lobby-cream-side-stack">
            <div className="lobby-cream-card lobby-cream-checkin-card">
              <button
                className={`lobby-cream-checkin-row ${checkin.morning ? 'lobby-cream-checkin-done' : ''}`}
                onClick={() => toggleCheckin('morning')}
              >
                <span className="lobby-cream-checkbox">{checkin.morning && '✓'}</span>
                <span>Morning</span>
              </button>
              <button
                className={`lobby-cream-checkin-row ${checkin.night ? 'lobby-cream-checkin-done' : ''}`}
                onClick={() => toggleCheckin('night')}
              >
                <span className="lobby-cream-checkbox">{checkin.night && '✓'}</span>
                <span>Night</span>
              </button>
            </div>

            <div className="lobby-cream-card lobby-cream-time-card">
              <div className="lobby-cream-time">{timeStr}</div>
              <div className="lobby-cream-time-date">{dateStr}</div>
            </div>
          </div>
        </div>

        <div className="lobby-cream-card lobby-cream-milestones">
          <div className="lobby-cream-section-label">MILESTONES</div>
          <div className="lobby-cream-milestone-list">
            <div className="lobby-cream-milestone-row">
              <div className="lobby-cream-milestone-name">
                <div>Feiyu's birthday</div>
                <div className="lobby-cream-milestone-date">{formatMonthDay(USER_BIRTHDAY)}</div>
              </div>
              <div className="lobby-cream-milestone-days">
                <span className="lobby-cream-milestone-num">{userBirthdayDays}</span>
                <span>days</span>
              </div>
            </div>
            <div className="lobby-cream-milestone-row">
              <div className="lobby-cream-milestone-name">
                <div>Zhiyuan's birthday</div>
                <div className="lobby-cream-milestone-date">{formatMonthDay(Z_BIRTHDAY)}</div>
              </div>
              <div className="lobby-cream-milestone-days">
                <span className="lobby-cream-milestone-num">{zBirthdayDays}</span>
                <span>days</span>
              </div>
            </div>
            <div className="lobby-cream-milestone-row">
              <div className="lobby-cream-milestone-name">
                <div>Our anniversary</div>
                <div className="lobby-cream-milestone-date">{formatMonthDay(ANNIVERSARY)}</div>
              </div>
              <div className="lobby-cream-milestone-days">
                <span className="lobby-cream-milestone-num">{anniversaryDays}</span>
                <span>days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lobby-cream-divider-wrap">
          <div className="lobby-cream-divider" />
        </div>

        <div className="lobby-cream-grid">
          {ROOMS.map((room, idx) => {
            const row = Math.floor(idx / 2);
            const col = idx % 2;
            const isCream = (row + col) % 2 === 0;
            let unreadCount = 0;
            if (room.id === 'chat') unreadCount = unread.messages;
            else if (room.id === 'daily') unreadCount = unread.daily;
            return (
              <Link
                key={room.id}
                href={room.href}
                className={[
                  'lobby-cream-tile',
                  isCream ? 'lobby-cream-tile-light' : 'lobby-cream-tile-milk',
                ].join(' ')}
                style={{ opacity: tileOpacity }}
              >
                <div className="lobby-cream-tile-icon">{room.icon}</div>
                <div className="lobby-cream-tile-name">{room.name}</div>
                {unreadCount > 0 && (
                  <span className="lobby-cream-tile-badge">
                    {formatBadge(unreadCount)}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <footer className="lobby-cream-footer">
          <p>for Hisame</p>
        </footer>
      </div>

      {showSettings && (
        <>
          <div className="settings-backdrop" onClick={() => setShowSettings(false)} />
          <div className="settings-panel-cream">
            <div className="settings-cream-title">设置</div>
            <button
              className="settings-cream-btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? '处理中……' : bgImage ? '换一张背景' : '上传背景照片'}
            </button>

            {bgImage && (
              <>
                <div className="settings-cream-row">
                  <label className="settings-cream-label">
                    背景暗化 <span>{Math.round(overlayOpacity * 100)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0" max="0.85" step="0.05"
                    value={overlayOpacity}
                    onChange={(e) => updateOverlay(parseFloat(e.target.value))}
                    className="settings-cream-slider"
                  />
                </div>
                <button className="settings-cream-btn-ghost" onClick={removeBackground}>
                  移除背景
                </button>
              </>
            )}

            <div className="settings-cream-row">
              <label className="settings-cream-label">
                按钮透明度 <span>{Math.round(tileOpacity * 100)}%</span>
              </label>
              <input
                type="range"
                min="0.2" max="1" step="0.05"
                value={tileOpacity}
                onChange={(e) => updateTileOpacity(parseFloat(e.target.value))}
                className="settings-cream-slider"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            <button className="settings-cream-close" onClick={() => setShowSettings(false)}>
              完成
            </button>
          </div>
        </>
      )}
    </div>
  );
}
