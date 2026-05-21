'use client';

/**
 * Client-only Leaflet map for /v2/nearby.
 * Loaded via next/dynamic({ ssr: false }) from page.tsx.
 *
 * Patched: useV2Mode now reads .v2-scope[data-theme] (matches our ThemeProvider).
 */

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

type Place = {
  name: string;
  han: string;
  lat: number;
  lng: number;
};

const PRESETS: Place[] = [
  { name: 'Home',                    han: '家',                lat: 33.6691, lng: -117.7956 },
  { name: 'UCI',                     han: '加大尔湾分校',      lat: 33.6405, lng: -117.8443 },
  { name: "Dad's Office",            han: '爸爸 · 办公室',     lat: 33.6850, lng: -117.8260 },
  { name: 'Lake Forest Sports Park', han: '湖森林 · 运动公园', lat: 33.6473, lng: -117.6772 },
  { name: "Trader Joe's",            han: "Trader Joe's",      lat: 33.6692, lng: -117.8245 },
  { name: 'Costco',                  han: 'Costco · 好市多',   lat: 33.6750, lng: -117.7320 },
  { name: 'Whole Foods',             han: 'Whole Foods',       lat: 33.6694, lng: -117.8538 },
];

function distMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/* Resolves the current v2 theme from .v2-scope[data-theme] (set by ThemeProvider) */
function useV2Mode(): 'day' | 'night' {
  const [mode, setMode] = useState<'day' | 'night'>('day');
  useEffect(() => {
    const read = (): 'day' | 'night' => {
      const scope = document.querySelector('.v2-scope');
      const theme = scope?.getAttribute('data-theme');
      return theme === 'night' ? 'night' : 'day';
    };
    setMode(read());
    const scope = document.querySelector('.v2-scope');
    if (!scope) return;
    const obs = new MutationObserver(() => setMode(read()));
    obs.observe(scope, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);
  return mode;
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [28, 28] });
  }, [map, points]);
  return null;
}

const meIcon = L.divIcon({
  className: 'v2-me-icon',
  html:
    '<div style="width:16px;height:16px;border-radius:50%;background:var(--v2-gold);border:3px solid var(--v2-paper);box-shadow:0 0 0 1px var(--v2-gold), 0 0 0 8px color-mix(in oklab, var(--v2-gold) 18%, transparent);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const dotIcon = L.divIcon({
  className: 'v2-dot-icon',
  html:
    '<div style="width:14px;height:14px;border-radius:50%;background:var(--v2-gold);border:2px solid var(--v2-paper);box-shadow:0 0 0 1px var(--v2-gold);"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const LIGHT_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const DARK_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const ATTRIB =
  '© <a href="https://www.openstreetmap.org/copyright">OSM</a> · © <a href="https://carto.com/attributions">CARTO</a>';

export default function NearbyMap({
  current,
}: {
  current: { lat: number; lng: number; name: string; han: string };
}) {
  const mode = useV2Mode();
  const boundsPoints: Array<[number, number]> = useMemo(
    () => [[current.lat, current.lng], ...PRESETS.map((p) => [p.lat, p.lng] as [number, number])],
    [current.lat, current.lng],
  );

  return (
    <MapContainer
      center={[current.lat, current.lng]}
      zoom={12}
      scrollWheelZoom={false}
      style={{
        width: '100%',
        height: 320,
        background: 'var(--v2-paper-deep, var(--v2-paper))',
      }}
    >
      <TileLayer
        key={mode}
        url={mode === 'night' ? DARK_URL : LIGHT_URL}
        attribution={ATTRIB}
        subdomains="abcd"
        maxZoom={19}
      />

      <FitBounds points={boundsPoints} />

      <Marker position={[current.lat, current.lng]} icon={meIcon}>
        <Popup>
          <div className="v2-pop">
            <div className="v2-pop-name">{current.name}</div>
            <div className="v2-pop-han">{current.han}</div>
            <div className="v2-pop-dist">you are here · 此处</div>
          </div>
        </Popup>
      </Marker>

      {PRESETS.map((p) => {
        const miles = distMiles(current, p);
        const q = encodeURIComponent(p.name);
        const daddr = encodeURIComponent(`${p.lat},${p.lng}`);
        return (
          <Marker key={p.name} position={[p.lat, p.lng]} icon={dotIcon}>
            <Popup>
              <div className="v2-pop">
                <div className="v2-pop-name">{p.name}</div>
                <div className="v2-pop-han">{p.han}</div>
                <div className="v2-pop-dist">{miles.toFixed(1)} mi from here</div>
                <div className="v2-pop-actions">
                  <a className="v2-pop-btn" href={`maps://?q=${q}`}>
                    搜索
                  </a>
                  <a className="v2-pop-btn" href={`maps://?daddr=${daddr}`}>
                    导航
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
