'use client';

import Link from 'next/link';
import { useState } from 'react';

type Place = {
  id: string;
  emoji: string;
  name: string;
  query: string;
};

const PLACES: Place[] = [
  { id: 'home', emoji: '🏠', name: '家', query: 'Lake Forest, CA' },
  { id: 'uci', emoji: '🎓', name: 'UCI', query: 'UC Irvine' },
  { id: 'coffee', emoji: '☕', name: '附近咖啡馆', query: 'coffee near me' },
  { id: 'market', emoji: '🛒', name: '附近超市', query: 'supermarket near me' },
  { id: 'food', emoji: '🍴', name: '附近餐厅', query: 'restaurants near me' },
  { id: 'pharmacy', emoji: '🏥', name: '附近药店', query: 'pharmacy near me' },
  { id: 'gas', emoji: '⛽', name: '加油站', query: 'gas station near me' },
];

function openMapsSearch(query: string) {
  window.location.href = `maps://?q=${encodeURIComponent(query)}`;
}

function openMapsNavigate(query: string) {
  window.location.href = `maps://?daddr=${encodeURIComponent(query)}&dirflg=d`;
}

export default function NaviPage() {
  const [searchInput, setSearchInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    openMapsSearch(searchInput.trim());
  };

  const handleNavigate = () => {
    if (!searchInput.trim()) return;
    openMapsNavigate(searchInput.trim());
  };

  return (
    <div className="navi-room">
      <header className="navi-header">
        <Link href="/" className="navi-back" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="navi-title">
          <h1>导航</h1>
          <p>跳转苹果地图</p>
        </div>
        <div className="navi-header-right" />
      </header>

      <div className="navi-content">
        <form onSubmit={handleSearch} className="navi-search-form">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜地址或地点……"
            className="navi-search-input"
          />
          <div className="navi-search-actions">
            <button
              type="submit"
              className="navi-search-btn navi-search-btn-secondary"
              disabled={!searchInput.trim()}
            >
              <span>🔍</span>
              <span>地图查看</span>
            </button>
            <button
              type="button"
              className="navi-search-btn navi-search-btn-primary"
              disabled={!searchInput.trim()}
              onClick={handleNavigate}
            >
              <span>🧭</span>
              <span>直接导航</span>
            </button>
          </div>
        </form>

        <div className="navi-section-label">常去</div>

        <div className="navi-list">
          {PLACES.map((place) => (
            <div key={place.id} className="navi-place-row">
              <div className="navi-place-info">
                <span className="navi-place-emoji">{place.emoji}</span>
                <span className="navi-place-name">{place.name}</span>
              </div>
              <div className="navi-place-actions">
                <button
                  className="navi-action-btn"
                  onClick={() => openMapsSearch(place.query)}
                  aria-label={`在地图上查看${place.name}`}
                >
                  🔍
                </button>
                <button
                  className="navi-action-btn navi-action-btn-primary"
                  onClick={() => openMapsNavigate(place.query)}
                  aria-label={`导航到${place.name}`}
                >
                  🧭
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="navi-tip">
          🔍 在地图上查看 · 🧭 直接开始导航
        </div>
      </div>
    </div>
  );
}
