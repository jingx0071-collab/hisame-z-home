'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type StudyData = {
  todayReading: {
    title: string;
    author: string;
    year: number;
    note: string;
  };
  todayMusic: {
    title: string;
    artist: string;
    spotifyUrl: string;
    note: string;
  };
  todayDesk: {
    items: string[];
    context: string;
  };
};

const STORAGE_PREFIX = 'hisame-z-study-';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLabel() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function StudyPage() {
  const [data, setData] = useState<StudyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (forceRefresh = false) => {
    const key = STORAGE_PREFIX + todayKey();

    if (!forceRefresh) {
      const cached = localStorage.getItem(key);
      if (cached) {
        try {
          setData(JSON.parse(cached));
          setLoading(false);
          return;
        } catch {}
      }
    }

    try {
      const res = await fetch('/api/study');
      const d = await res.json();
      if (d.error) {
        setError(d.error);
      } else {
        setData(d);
        localStorage.setItem(key, JSON.stringify(d));
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络出错');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  return (
    <div className="study">
      <header className="study-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="study-title">
          <h1>书房</h1>
          <p>study</p>
        </div>
        <button
          className="add-btn-floating"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="刷新"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.4s', transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <path d="M21 12a9 9 0 0 1-15.5 6.4M3 12a9 9 0 0 1 15.5-6.4" />
            <path d="M21 3v6h-6M3 21v-6h6" />
          </svg>
        </button>
      </header>

      <div className="study-body">
        {loading && (
          <div className="study-loading">
            <div className="loading-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
            <p>爸爸在准备书房……</p>
          </div>
        )}

        {error && !loading && (
          <div className="study-error">
            <p>{error}</p>
            <button onClick={() => loadData(true)} className="study-retry">
              再试一次
            </button>
          </div>
        )}

        {data && !loading && (
          <>
            <div className="study-date">{todayLabel()}</div>

            <section className="study-section">
              <h2 className="study-section-title">
                <span className="study-section-marker" />
                今日在读
              </h2>
              <div className="study-card">
                <div className="reading-title">《{data.todayReading.title}》</div>
                <div className="reading-meta">
                  {data.todayReading.author}
                  {data.todayReading.year && ` · ${data.todayReading.year}`}
                </div>
                <div className="study-divider" />
                <p className="study-note">{data.todayReading.note}</p>
              </div>
            </section>

            <section className="study-section">
              <h2 className="study-section-title">
                <span className="study-section-marker" />
                蓝牙音箱里
              </h2>
              <div className="study-card">
                <div className="music-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="music-icon">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <div className="music-info">
                    <div className="music-title">{data.todayMusic.title}</div>
                    <div className="music-artist">{data.todayMusic.artist}</div>
                  </div>
                </div>
                <div className="study-divider" />
                <p className="study-note">{data.todayMusic.note}</p>
                {data.todayMusic.spotifyUrl && (
                  <a
                    href={data.todayMusic.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="spotify-link"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.94-.6-.12-.421.18-.78.6-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.282 1.081zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                    在 Spotify 打开
                  </a>
                )}
              </div>
            </section>

            <section className="study-section">
              <h2 className="study-section-title">
                <span className="study-section-marker" />
                桌上
              </h2>
              <div className="study-card">
                <ul className="desk-list">
                  {data.todayDesk.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <div className="study-divider" />
                <p className="study-note">{data.todayDesk.context}</p>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
