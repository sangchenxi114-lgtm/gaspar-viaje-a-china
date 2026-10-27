import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as LibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { journeyCoordinates, journeyLineLayer, SEGMENT_SECONDS, type JourneyStop } from './journey';
import type { Place } from './data';

function readingPadding(map: LibreMap, panelOpen: boolean) {
  const height = map.getContainer().clientHeight;
  if (window.innerWidth <= 650) {
    const controls = map.getContainer().parentElement?.querySelector<HTMLElement>('.journey-controls');
    const bottom = panelOpen ? Math.round(height * .53) : 35;
    const top = Math.min(controls ? controls.offsetTop + controls.offsetHeight + 12 : 220, Math.max(0, height - bottom - 40));
    return { top, bottom, left: 0, right: 0 };
  }
  const controls = map.getContainer().parentElement?.querySelector<HTMLElement>('.journey-controls');
  return { top: 82, left: 24, right: panelOpen && map.getContainer().clientWidth >= 900 ? 488 : 24, bottom: controls ? controls.offsetHeight + 65 : 230 };
}

export default function JourneyMap({ stops, panelOpen, onStop }: { stops: JourneyStop[]; panelOpen: boolean; onStop: (record: Place) => void }) {
  const container = useRef<HTMLDivElement>(null), mapRef = useRef<LibreMap | null>(null);
  const [progress, setProgress] = useState(0), [playing, setPlaying] = useState(false), [speed, setSpeed] = useState(1);
  const [ready, setReady] = useState(false), [mapIdle, setMapIdle] = useState(false), [mapError, setMapError] = useState('');
  const progressRef = useRef(0), playingRef = useRef(false), speedRef = useRef(1);
  const selectRef = useRef<(index: number) => void>(() => {});
  const latest = useRef({ onStop, panelOpen }); latest.current = { onStop, panelOpen };
  const elements = useRef<HTMLElement[]>([]), [mobile, setMobile] = useState(() => window.innerWidth <= 650);
  const maximum = stops.length - 1, active = Math.min(Math.floor(progress), maximum), finished = progress >= maximum;
  const current = stops[active];
  function seek(index: number) { playingRef.current = false; setPlaying(false); progressRef.current = index; setProgress(index); }
  selectRef.current = seek;
  function restart() { seek(0); }
  function togglePlayback() {
    if (finished) { progressRef.current = 0; setProgress(0); }
    playingRef.current = !playingRef.current; setPlaying(playingRef.current);
  }
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 650px)'); const change = () => setMobile(query.matches);
    query.addEventListener('change', change); return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!container.current || !stops.length) return;
    let map: LibreMap;
    try {
      map = new maplibregl.Map({ container: container.current, style: 'https://tiles.openfreemap.org/styles/positron', center: [113.72, 22.7], zoom: 8.1,
        minZoom: 5, maxZoom: 19, attributionControl: { compact: true },
        locale: { 'NavigationControl.ZoomIn': '放大', 'NavigationControl.ZoomOut': '缩小', 'AttributionControl.ToggleAttribution': '切换地图署名', 'Map.Title': '行踪漫游地图' } });
    } catch { setMapError('地图无法初始化，请使用支持WebGL的浏览器。'); return; }
    mapRef.current = map;
    const pad = () => map.setPadding(readingPadding(map, latest.current.panelOpen));
    pad();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    const markers = stops.map((stop, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'journey-marker upcoming';
      const number = document.createElement('span'); number.textContent = String(stop.step);
      const label = document.createElement('span'); label.className = 'journey-stop-label'; label.textContent = stop.name; label.setAttribute('aria-hidden', 'true');
      button.append(number, label); button.setAttribute('aria-label', `漫游第${stop.step}站 ${stop.name}`);
      button.title = `${stop.name} · ${stop.english}`; button.addEventListener('click', () => selectRef.current(index));
      elements.current[index] = button;
      return new Marker({ element: button, anchor: 'center' }).setLngLat(stop.coordinates).addTo(map);
    });
    map.on('load', () => {
      map.addSource('journey-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer(journeyLineLayer(window.innerWidth <= 650));
      setReady(true);
    });
    map.on('movestart', () => setMapIdle(false));
    map.on('idle', () => setMapIdle(true));
    map.on('error', () => setMapError('部分底图暂时无法加载，漫游控制与史料仍可使用。'));
    const resize = new ResizeObserver(() => { map.resize(); pad(); }); resize.observe(container.current);
    const controls = container.current.parentElement?.querySelector('.journey-controls'); if (controls) resize.observe(controls);
    return () => { resize.disconnect(); markers.forEach(marker => marker.remove()); elements.current = []; map.remove(); mapRef.current = null; };
  }, [stops]);
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    map.setPadding(readingPadding(map, panelOpen));
  }, [panelOpen]);
  useEffect(() => {
    const map = mapRef.current;
    if (ready && map?.getLayer('journey-route')) map.setPaintProperty('journey-route', 'line-width', mobile ? 3 : 4);
  }, [mobile, ready]);
  useEffect(() => {
    let frame = 0, last = 0;
    const tick = (time: number) => {
      if (last && playingRef.current && ready) {
        const next = Math.min(maximum, progressRef.current + Math.min(time - last, 100) / 1000 * speedRef.current / SEGMENT_SECONDS);
        progressRef.current = next; setProgress(next);
        if (next >= maximum) { playingRef.current = false; setPlaying(false); }
      }
      last = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [maximum, ready]);
  useEffect(() => { latest.current.onStop(stops[active].record); }, [active, stops]);
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    setMapIdle(false);
    const coordinates = journeyCoordinates(stops, progress);
    (map.getSource('journey-route') as GeoJSONSource).setData({ type: 'FeatureCollection', features: coordinates.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }] : [] });
    elements.current.forEach((element, index) => {
      const status = index === active ? 'active' : index < active ? 'completed' : 'upcoming';
      element.classList.remove('active', 'completed', 'upcoming'); element.classList.add(status); element.dataset.status = status;
      element.setAttribute('aria-current', index === active ? 'step' : 'false');
    });
    if (progress === 0 && !playing) {
      map.easeTo({ center: [113.72, 22.7], zoom: 8.1, duration: 700 });
    } else {
      const zoom = progress < 3 ? 8.1 : 8.1 + Math.min((progress - 3) / 2, 1) * 5.4;
      let center = stops[active].coordinates;
      if (progress < .25) {
        const blend = progress / .25;
        center = [113.72 + (center[0] - 113.72) * blend, 22.7 + (center[1] - 22.7) * blend];
      }
      if (playingRef.current) {
        const previous = map.getCenter();
        // Follow the reached gold marker within the unobstructed viewport.
        map.jumpTo({ center: [previous.lng + (center[0] - previous.lng) * .12, previous.lat + (center[1] - previous.lat) * .12], zoom });
      }
      else map.easeTo({ center, zoom, duration: 700 });
    }
  }, [progress, ready, stops]);
  return <section className="map-section journey-map" aria-label="行踪漫游地图">
    <div ref={container} className="map-canvas" data-testid="journey-canvas" data-progress={progress} data-map-idle={mapIdle} data-complete={finished} data-route-points={journeyCoordinates(stops, progress).length} data-line-width={mobile ? 3 : 4} />
    {!ready && !mapError && <div className="map-loading">正在展开漫游地图…</div>}
    {mapError && <div className="tile-notice" role="status">{mapError}</div>}
    <div className="journey-controls" aria-label="漫游播放控制">
      <div className="journey-current" aria-live="polite"><span className="journey-step">{String(current.step).padStart(2, '0')} / 12</span><strong>{current.name}</strong><span lang="en">{current.english}</span></div>
      <div className="journey-actions"><button className="journey-play" disabled={!ready} onClick={togglePlayback}>{playing ? '暂停' : finished ? '再次播放' : progress > 0 ? '继续' : '播放'}</button><button onClick={restart}>重新开始</button><label>速度 <select aria-label="播放速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}>{[.5, 1, 2, 4].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
      <label className="journey-seek">选择地点<select aria-label="选择漫游地点" value={active} onChange={event => seek(Number(event.target.value))}>{stops.map((stop, index) => <option value={index} key={stop.step}>{stop.step}. {stop.name} — {stop.english}</option>)}</select></label>
    </div>
  </section>;
}
