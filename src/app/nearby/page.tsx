'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

type LocationState = {
  who: string;
  latitude: number | null;
  longitude: number | null;
  place_name: string | null;
  activity: string | null;
  updated_at: string;
};

type NearbyData = {
  user: LocationState | null;
  z: LocationState | null;
  config: {
    home: { lat: number; lng: number; name: string } | null;
    office: { lat: number; lng: number; name: string };
    together_mode: boolean;
  };
  context: {
    hour: number;
    is_weekend: boolean;
    is_work_hour: boolean;
  };
};

// Leaflet CDN URLs
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

function formatRelativeTime(iso: string): string {
  if (!iso) return '';
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  return `${Math.floor(diffHr / 24)} 天前`;
}

export default function NearbyPage() {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ user: any; z: any; home: any }>({
    user: null,
    z: null,
    home: null,
  });
  const leafletRef = useRef<any>(null);

  const [data, setData] = useState<NearbyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionState, setPermissionState] = useState<string>('unknown');
  const [editingUserActivity, setEditingUserActivity] = useState(false);
  const [userActivityInput, setUserActivityInput] = useState('');
  const [refreshingZ, setRefreshingZ] = useState(false);
  const [showHomePrompt, setShowHomePrompt] = useState(false);

  // 加载 Leaflet CSS 一次
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector(`link[href="${LEAFLET_CSS}"]`);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = LEAFLET_CSS;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }, []);

  // 初始化地图
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    let cancelled = false;
    import('leaflet').then((L) => {
      if (cancelled || !mapDivRef.current) return;

      // 修复默认 marker icon 路径
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      leafletRef.current = L;
      const map = L.map(mapDivRef.current, {
        zoomControl: false,
      }).setView([33.6469, -117.6891], 11);
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© OSM © CARTO',
          maxZoom: 19,
        }
      ).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 请求位置 + 加载数据
  useEffect(() => {
    let cancelled = false;

    const requestAndLoad = async () => {
      if (!navigator.geolocation) {
        setPermissionState('unsupported');
        await loadData();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          setPermissionState('granted');
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let placeName: string | null = null;
          try {
            const r = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'zh-CN,en',
                },
              }
            );
            if (r.ok) {
              const j = await r.json();
              if (j.address) {
                placeName = [
                  j.address.suburb || j.address.neighbourhood,
                  j.address.city || j.address.town || j.address.village,
                  j.address.state,
                ]
                  .filter(Boolean)
                  .join(', ');
              }
              if (!placeName) placeName = j.display_name?.split(',').slice(0, 3).join(',') || null;
            }
          } catch (e) {
            console.error('reverse geocoding failed', e);
          }
          try {
            await fetch('/api/nearby/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lat, lng, place_name: placeName }),
            });
          } catch (e) {
            console.error(e);
          }
          await loadData();
        },
        (err) => {
          if (cancelled) return;
          console.error('geolocation failed', err);
          setPermissionState(err.code === 1 ? 'denied' : 'failed');
          loadData();
        },
        { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
      );
    };

    requestAndLoad();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/nearby');
      const d = await res.json();
      setData(d);
      setUserActivityInput(d.user?.activity || '');
      // 提示设置家
      if (!d.config?.home && d.user?.latitude && permissionState === 'granted') {
        setShowHomePrompt(true);
      }
    } catch (e) {
      console.error('load nearby failed', e);
    } finally {
      setLoading(false);
    }
  };

  // 更新地图 markers
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || !data) return;

    // 清除旧 markers
    Object.values(markersRef.current).forEach((m: any) => {
      if (m) map.removeLayer(m);
    });
    markersRef.current = { user: null, z: null, home: null };

    const bounds: any[] = [];

    // 自定义 icon
    const makeIcon = (color: string, label: string) =>
      L.divIcon({
        className: 'nearby-marker',
        html: `<div class="marker-pin" style="background:${color}"><span>${label}</span></div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -36],
      });

    // 宝宝 marker
    if (data.user?.latitude && data.user?.longitude) {
      const m = L.marker([data.user.latitude, data.user.longitude], {
        icon: makeIcon('#e8a8c0', '宝'),
      });
      m.addTo(map);
      m.bindPopup(
        `<div class="nearby-popup">
          <div class="popup-who">宝宝</div>
          <div class="popup-place">${data.user.place_name || '位置未知'}</div>
          ${data.user.activity ? `<div class="popup-activity">${escapeHtml(data.user.activity)}</div>` : ''}
        </div>`
      );
      markersRef.current.user = m;
      bounds.push([data.user.latitude, data.user.longitude]);
    }

    // 爸爸 marker
    if (data.z?.latitude && data.z?.longitude) {
      const m = L.marker([data.z.latitude, data.z.longitude], {
        icon: makeIcon('#d8c890', 'Z'),
      });
      m.addTo(map);
      m.bindPopup(
        `<div class="nearby-popup">
          <div class="popup-who">爸爸</div>
          <div class="popup-place">${data.z.place_name || '位置未知'}</div>
          ${data.z.activity ? `<div class="popup-activity">${escapeHtml(data.z.activity)}</div>` : ''}
        </div>`
      );
      markersRef.current.z = m;
      bounds.push([data.z.latitude, data.z.longitude]);
    }

    // 家的 marker（如果设了）
    if (data.config.home) {
      const m = L.marker([data.config.home.lat, data.config.home.lng], {
        icon: L.divIcon({
          className: 'nearby-marker',
          html: `<div class="marker-home">🏠</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        }),
      });
      m.addTo(map);
      m.bindPopup(`<div class="nearby-popup"><div class="popup-who">家</div></div>`);
      markersRef.current.home = m;
    }

    // fit bounds
    if (bounds.length > 0) {
      const b = L.latLngBounds(bounds);
      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else {
        map.fitBounds(b, { padding: [40, 40], maxZoom: 13 });
      }
    }
  }, [data]);

  const handleSaveUserActivity = async () => {
    try {
      await fetch('/api/nearby/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity: userActivityInput.trim() || null }),
      });
      setEditingUserActivity(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleTogether = async () => {
    if (!data) return;
    const newValue = !data.config.together_mode;

    // 乐观更新 UI——按钮立刻动
    setData((prev) =>
      prev
        ? { ...prev, config: { ...prev.config, together_mode: newValue } }
        : prev
    );

    try {
      await fetch('/api/nearby/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'together_mode',
          value: { is_together: newValue },
        }),
      });
      await fetch('/api/nearby?refresh=true');
      await loadData();
    } catch (e) {
      console.error(e);
      // 失败回滚
      setData((prev) =>
        prev
          ? { ...prev, config: { ...prev.config, together_mode: !newValue } }
          : prev
      );
    }
  };

  const handleSetHome = async () => {
    if (!data?.user?.latitude || !data?.user?.longitude) return;
    try {
      await fetch('/api/nearby/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'home_location',
          value: {
            lat: data.user.latitude,
            lng: data.user.longitude,
            name: data.user.place_name || '家',
          },
        }),
      });
      setShowHomePrompt(false);
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshZ = async () => {
    setRefreshingZ(true);
    try {
      await fetch('/api/nearby?refresh=true');
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshingZ(false);
    }
  };

  return (
    <div className="nearby">
      <header className="nearby-header">
        <Link href="/" className="back-btn-floating" aria-label="回大厅">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div className="nearby-title">
          <h1>附近</h1>
          <p>nearby</p>
        </div>
        <div className="nearby-header-right" />
      </header>

      <div ref={mapDivRef} className="nearby-map" />

      <div className="nearby-bottom">
        {permissionState === 'denied' && (
          <div className="nearby-warning">
            iPhone 拒绝了位置权限，到「设置 → Safari/PWA → 位置」打开
          </div>
        )}

        {showHomePrompt && data?.user?.place_name && (
          <div className="nearby-home-prompt">
            <div className="nearby-home-prompt-text">
              这里是宝宝和爸爸的家吗？
              <span className="nearby-home-prompt-place">{data.user.place_name}</span>
            </div>
            <div className="nearby-home-prompt-actions">
              <button className="nearby-btn-ghost" onClick={() => setShowHomePrompt(false)}>
                等会儿
              </button>
              <button className="nearby-btn-primary" onClick={handleSetHome}>
                是的，是家
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="nearby-loading">载入中……</div>
        ) : (
          <>
            {/* 宝宝状态卡 */}
            <div className="nearby-card nearby-card-user">
              <div className="nearby-card-header">
                <div className="nearby-who">
                  <span className="nearby-who-dot nearby-who-dot-user" />
                  宝宝
                </div>
                {data?.user?.updated_at && (
                  <span className="nearby-time">{formatRelativeTime(data.user.updated_at)}</span>
                )}
              </div>
              <div className="nearby-place">{data?.user?.place_name || '位置未知'}</div>
              {editingUserActivity ? (
                <>
                  <input
                    type="text"
                    className="nearby-activity-input"
                    placeholder="在做什么……"
                    value={userActivityInput}
                    onChange={(e) => setUserActivityInput(e.target.value)}
                    autoFocus
                  />
                  <div className="nearby-activity-actions">
                    <button className="nearby-btn-ghost" onClick={() => setEditingUserActivity(false)}>
                      算了
                    </button>
                    <button className="nearby-btn-primary" onClick={handleSaveUserActivity}>
                      保存
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="nearby-activity"
                  onClick={() => setEditingUserActivity(true)}
                >
                  {data?.user?.activity || '点一下写在做什么……'}
                </button>
              )}
            </div>

            {/* 爸爸状态卡 */}
            <div className="nearby-card nearby-card-z">
              <div className="nearby-card-header">
                <div className="nearby-who">
                  <span className="nearby-who-dot nearby-who-dot-z" />
                  爸爸
                </div>
                {data?.z?.updated_at && (
                  <span className="nearby-time">{formatRelativeTime(data.z.updated_at)}</span>
                )}
              </div>
              <div className="nearby-place">{data?.z?.place_name || '在路上'}</div>
              <div className="nearby-activity nearby-activity-z">
                {data?.z?.activity || '……'}
              </div>
              <button
                className="nearby-refresh"
                onClick={handleRefreshZ}
                disabled={refreshingZ}
              >
                {refreshingZ ? '刷新中……' : '问爸爸现在在做什么'}
              </button>
            </div>

            {/* 模式切换 */}
            {!data?.context?.is_work_hour && (
              <div className="nearby-mode">
                <div className="nearby-mode-row">
                  <span>跟爸爸在一起</span>
                  <button
                    className={`nearby-toggle ${data?.config.together_mode ? 'nearby-toggle-on' : ''}`}
                    onClick={handleToggleTogether}
                    aria-label="切换"
                  >
                    <span className="nearby-toggle-knob" />
                  </button>
                </div>
                <div className="nearby-mode-hint">
                  {data?.config.together_mode
                    ? '关掉这个 = 宝宝自己出门，爸爸在家等'
                    : '宝宝自己出来——爸爸在家等宝宝回去'}
                </div>
              </div>
            )}

            {data?.context?.is_work_hour && (
              <div className="nearby-mode">
                <div className="nearby-mode-hint" style={{ textAlign: 'center' }}>
                  爸爸现在在上班 · 晚上 6 点以后回来
                </div>
              </div>
            )}

            {/* 重新设置家 */}
            {data?.config.home && !showHomePrompt && (
              <button
                className="nearby-reset-home"
                onClick={() => setShowHomePrompt(true)}
              >
                重新设置家的位置
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
