import { useEffect, useRef, useState } from 'react';
import maplibregl, { type GeoJSONSource, type Map as LibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { journeyCoordinates, journeyLineLayers, positionAt, SEGMENT_SECONDS, type JourneyStop } from './journey';
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
  const [ready, setReady] = useState(false), [mapError, setMapError] = useState('');
  const progressRef = useRef(0), playingRef = useRef(false), speedRef = useRef(1);
  const selectRef = useRef<(index: number) => void>(() => {});
  const latest = useRef({ onStop, panelOpen }); latest.current = { onStop, panelOpen };
  const elements = useRef<HTMLElement[]>([]);
  const drawRef = useRef<(value: number, following: boolean) => void>(() => {});
  const maximum = stops.length - 1, active = Math.min(Math.floor(progress), maximum), finished = progress >= maximum;
  const current = stops[active];
  function seek(index: number) { playingRef.current = false; setPlaying(false); progressRef.current = index; setProgress(index); drawRef.current(index, false); }
  selectRef.current = seek;
  function restart() { seek(0); }
  function togglePlayback() {
    if (finished) { progressRef.current = 0; setProgress(0); }
    mapRef.current?.stop();
    if (playingRef.current) setProgress(progressRef.current);
    playingRef.current = !playingRef.current; setPlaying(playingRef.current);
  }
  useEffect(() => { speedRef.current = speed; }, [speed]);
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
      return new Marker({ element: button, anchor: 'center', subpixelPositioning: true }).setLngLat(stop.coordinates).addTo(map);
    });
    // No offsets or connector lines: markers remain at their verified geographic anchors.
    const arrange = () => {
      if (container.current) container.current.dataset.actualCameraLng = String(map.getCenter().lng);
      const occupied: { x: number; y: number }[] = [];
      const activeIndex = Math.min(Math.floor(progressRef.current), stops.length - 1);
      const order = [activeIndex, ...stops.map((_, index) => index).filter(index => index !== activeIndex)];
      for (const index of order) {
        const point = map.project(stops[index].coordinates);
        elements.current[index].dataset.anchorX = String(point.x);
        elements.current[index].dataset.anchorY = String(point.y);
        const visible = occupied.every(other => Math.hypot(point.x - other.x, point.y - other.y) >= 40);
        elements.current[index].style.visibility = visible ? 'visible' : 'hidden';
        if (visible) occupied.push(point);
      }
    };
    map.on('move', arrange);
    map.on('render', arrange);
    map.on('load', () => {
      map.addSource('journey-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      journeyLineLayers().forEach(layer => map.addLayer(layer));
      setReady(true);
    });
    map.on('movestart', () => { if (container.current) container.current.dataset.mapIdle = 'false'; });
    map.on('idle', () => { if (container.current) container.current.dataset.mapIdle = 'true'; });
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
    let frame = 0, last = 0;
    const tick = (time: number) => {
      if (last && playingRef.current && ready) {
        const next = Math.min(maximum, progressRef.current + Math.min(time - last, 100) / 1000 * speedRef.current / SEGMENT_SECONDS);
        const previous = progressRef.current; progressRef.current = next;
        drawRef.current(next, true);
        if (Math.floor(previous) !== Math.floor(next) || next >= maximum) setProgress(next);
        if (next >= maximum) { playingRef.current = false; setPlaying(false); }
      }
      last = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [maximum, ready]);
  useEffect(() => { latest.current.onStop(stops[active].record); }, [active, stops]);
  useEffect(() => {
    const map = mapRef.current; if (!ready || !map) return;
    let previousActive = -1;
    drawRef.current = (value, following) => {
      const activeIndex = Math.min(Math.floor(value), stops.length - 1);
      const coordinates = journeyCoordinates(stops, value);
      (map.getSource('journey-route') as GeoJSONSource).setData({ type: 'FeatureCollection', features: coordinates.length >= 2 ? [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } }] : [] });
      if (container.current) {
        container.current.dataset.progress = String(value);
        container.current.dataset.routePoints = String(value > 0 ? Math.ceil(value) + 1 : 0);
      }
      if (activeIndex !== previousActive) {
        elements.current.forEach((element, index) => {
          const status = index === activeIndex ? 'active' : index < activeIndex ? 'completed' : 'upcoming';
          element.classList.remove('active', 'completed', 'upcoming'); element.classList.add(status); element.dataset.status = status;
          element.setAttribute('aria-current', index === activeIndex ? 'step' : 'false');
        });
        previousActive = activeIndex;
      }
      const zoom = value < 3 ? 8.1 : 8.1 + Math.min((value - 3) / 2, 1) * 5.4;
      let center = positionAt(stops, value);
      if (following && value < .25) {
        const blend = value / .25;
        center = [113.72 + (center[0] - 113.72) * blend, 22.7 + (center[1] - 22.7) * blend];
      }
      if (following) map.jumpTo({ center, zoom });
      else { map.stop(); map.easeTo({ center: value === 0 ? [113.72, 22.7] : center, zoom, duration: 700 }); }
    };
    drawRef.current(progressRef.current, false);
    return () => { drawRef.current = () => {}; };
  }, [ready, stops]);
  return <section className="map-section journey-map" aria-label="行踪漫游地图">
    <div ref={container} className="map-canvas" data-testid="journey-canvas" data-map-idle="false" data-complete={finished} data-line-width="3" />
    {!ready && !mapError && <div className="map-loading">正在展开漫游地图…</div>}
    {mapError && <div className="tile-notice" role="status">{mapError}</div>}
    <div className="journey-controls" aria-label="漫游播放控制">
      <div className="journey-current" aria-live="polite"><span className="journey-step">{String(current.step).padStart(2, '0')} / 12</span><strong>{current.name}</strong><span lang="en">{current.english}</span></div>
      <div className="journey-actions"><button className="journey-play" disabled={!ready} onClick={togglePlayback}>{playing ? '暂停' : finished ? '再次播放' : progress > 0 ? '继续' : '播放'}</button><button onClick={restart}>重新开始</button><label>速度 <select aria-label="播放速度" value={speed} onChange={event => setSpeed(Number(event.target.value))}>{[.5, 1, 2, 4].map(value => <option key={value} value={value}>{value}×</option>)}</select></label></div>
      <label className="journey-seek">选择地点<select aria-label="选择漫游地点" value={active} onChange={event => seek(Number(event.target.value))}>{stops.map((stop, index) => <option value={index} key={stop.step}>{stop.step}. {stop.name} — {stop.english}</option>)}</select></label>
    </div>
  </section>;
}
