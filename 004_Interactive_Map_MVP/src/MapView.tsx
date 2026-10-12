import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as LibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { makeGroups, type Group, type Place } from './data';
export type Mode = 'overview' | 'detail';
export interface CameraRequest { serial: number; mode?: Mode; coordinates?: [number, number] }
// Public, key-free vector basemap; source metadata supplies required attribution.
const style = 'https://tiles.openfreemap.org/styles/positron';
// Screen-space grouping leaves coordinates intact and gives close markers one selectable record list.
function visibleGroups(map: LibreMap, groups: Group[]): Group[] {
  const result: Group[] = [], used = new Set<number>();
  for (let i = 0; i < groups.length; i++) {
    if (used.has(i)) continue;
    used.add(i); const members = [i];
    for (let m = 0; m < members.length; m++) {
      const p = map.project(groups[members[m]].coordinates);
      for (let j = 0; j < groups.length; j++) {
        if (used.has(j)) continue;
        const q = map.project(groups[j].coordinates);
        const width = (group: Group) => 48 + Math.min(group.label.length, 9) * 11;
        if (Math.abs(p.x - q.x) < (width(groups[members[m]]) + width(groups[j])) / 2 + 6 && Math.abs(p.y - q.y) < 46) { members.push(j); used.add(j); }
      }
    }
    const first = groups[i];
    result.push(members.length === 1 ? first : { ...first, key: members.map(n => groups[n].key).join('+'),
      label: '邻近地点', records: members.flatMap(n => groups[n].records).sort((a, b) => a.sequence - b.sequence) });
  }
  return result;
}
export default function MapView({ records, mode, camera, onMode, onGroup }: {
  records: Place[]; mode: Mode; camera: CameraRequest;
  onMode: (mode: Mode) => void; onGroup: (group: Group) => void;
}) {
  const container = useRef<HTMLDivElement>(null), mapRef = useRef<LibreMap | null>(null), markers = useRef<Marker[]>([]);
  const latest = useRef({ records, mode, onMode, onGroup }); latest.current = { records, mode, onMode, onGroup };
  const [zoom, setZoom] = useState(8.1), [moving, setMoving] = useState(false);
  const [ready, setReady] = useState(false), [tileError, setTileError] = useState(false), [fatal, setFatal] = useState(false);
  const redraw = useRef<() => void>(() => {});
  useEffect(() => {
    if (!container.current) return;
    let map: LibreMap;
    try {
      map = new maplibregl.Map({ container: container.current, style, center: [113.72, 22.7], zoom: 8.1,
        locale: { 'NavigationControl.ZoomIn': '放大', 'NavigationControl.ZoomOut': '缩小', 'AttributionControl.ToggleAttribution': '切换地图署名', 'Map.Title': '历史地点地图' },
        minZoom: 5, maxZoom: 19, attributionControl: { compact: true }, cooperativeGestures: false });
    } catch { setFatal(true); return; }
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    redraw.current = () => {
      markers.current.forEach(marker => marker.remove());
      markers.current = visibleGroups(map, makeGroups(latest.current.records, latest.current.mode)).map(group => {
        const button = document.createElement('button'); button.type = 'button';
        button.className = `map-marker ${latest.current.mode}`;
        button.dataset.recordCount = String(group.records.length);
        button.setAttribute('aria-label', `${group.label}，${group.records.length}条记录`);
        button.title = group.records.map(r => `${r.sequence}. ${r.modern_name}`).join('\n');
        const number = document.createElement('span'); number.className = 'marker-number';
        number.textContent = latest.current.mode === 'overview' ? String(group.records.length) : group.records.length === 1 ? String(group.records[0].sequence) : `${group.records.length}`;
        const label = document.createElement('span'); label.className = 'marker-label';
        label.textContent = group.label.length > 9 ? `${group.label.slice(0, 8)}…` : group.label;
        button.append(number, label);
        button.addEventListener('click', () => latest.current.onGroup(group));
        return new maplibregl.Marker({ element: button, anchor: 'center' }).setLngLat(group.coordinates).addTo(map);
      });
    };
    map.on('load', () => { setReady(true); redraw.current(); });
    map.on('error', event => { if (event.error) setTileError(true); });
    map.on('movestart', () => setMoving(true));
    map.on('moveend', () => {
      setMoving(false); setZoom(map.getZoom());
      const center = map.getCenter();
      const inGuangzhou = center.lng >= 113.1 && center.lng <= 113.6 && center.lat >= 23.02 && center.lat <= 23.3;
      const nextMode: Mode = map.getZoom() >= 11.5 && inGuangzhou ? 'detail' : 'overview';
      latest.current.onMode(nextMode); redraw.current();
    });
    const observer = new ResizeObserver(() => { map.resize(); redraw.current(); }); observer.observe(container.current);
    return () => { observer.disconnect(); markers.current.forEach(marker => marker.remove()); markers.current = []; map.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => { if (ready) redraw.current(); }, [mode, records, ready]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !camera.serial) return;
    if (camera.coordinates) map.flyTo({ center: camera.coordinates, zoom: camera.mode === 'detail' ? Math.max(14, map.getZoom()) : 9.5, duration: 1100 });
    else if (camera.mode === 'detail') {
      const points = latest.current.records.filter(r => r.display_level === 'detail' && r.longitude !== null && r.latitude !== null);
      if (map.getContainer().clientWidth < 650 && points.length) {
        const bounds = new maplibregl.LngLatBounds(); points.forEach(r => bounds.extend([r.longitude!, r.latitude!]));
        map.fitBounds(bounds, { padding: { top: 140, bottom: 55, left: 35, right: 35 }, maxZoom: 13.5, duration: 1300 });
      } else map.flyTo({ center: [113.248, 23.123], zoom: 13.5, duration: 1300 });
    }
    else map.fitBounds([[113.08, 22.10], [114.32, 23.3]], { padding: 65, duration: 1100 });
  }, [camera]);
  return <section className="map-section" aria-label="历史地点地图">
    <div ref={container} className="map-canvas" data-testid="map-canvas" data-zoom={zoom} aria-busy={!ready || moving} />
    <div className="map-heading"><span className="eyebrow">{mode === 'overview' ? 'PEARL RIVER DELTA' : 'CANTÓN · GUANGZHOU'}</span><h2>{mode === 'overview' ? '珠江三角洲' : '广州 · 城市细读'}</h2><p>{mode === 'overview' ? '从城市概览，走入历史现场' : '7条地点记录 · 当代地理中的历史线索'}</p></div>
    <div className="map-key"><span className="legend-dot" />{mode === 'overview' ? '城市／区域记录' : '详细地点记录'}<span className="key-divider" />相邻点可合并选择</div>
    {fatal ? <div role="alert" className="map-notice">地图无法初始化。请使用支持WebGL的浏览器；右侧记录仍可阅读。</div> : !ready ? <div className="map-loading">正在展开地图…</div> : null}
    {tileError && !fatal && <div className="tile-notice" role="status">部分底图未能加载，地点与文献仍可阅读。请检查网络后刷新。</div>}
  </section>;
}
