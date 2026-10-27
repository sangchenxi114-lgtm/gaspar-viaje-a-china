import { useEffect, useMemo, useState } from 'react';
import JourneyMap from './JourneyMap';
import { buildJourneyStops } from './journey';
import { attachPlaceInformation } from './placeInfo';
import MapView, { type CameraRequest, type Mode } from './MapView';
import { parsePlaces, formatPageReference, type Group, type Place } from './data';

const displayDate = (date: string) => date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日');
function PageReference({ value }: { value?: string | null }) {
  const label = formatPageReference(value);
  return label ? <p className="page-reference" aria-label="原书页码">{label}</p> : null;
}
export default function App() {
  const [records, setRecords] = useState<Place[]>([]), [error, setError] = useState('');
  const [view, setView] = useState<'map' | 'journey'>('map');
  const [mode, setMode] = useState<Mode>('overview'), [camera, setCamera] = useState<CameraRequest>({ serial: 0 });
  const [selected, setSelected] = useState<Place | null>(null), [group, setGroup] = useState<Group | null>(null);
  const [collapsed, setCollapsed] = useState(false), [tab, setTab] = useState<'all' | 'group'>('all');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/places_geocoded.csv`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('数据文件加载失败。'); return response.text(); })
      .then(text => { setRecords(attachPlaceInformation(parsePlaces(text))); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, []);
  function navigate(next: Mode) { setView('map'); setMode(next); setCamera(c => ({ serial: c.serial + 1, mode: next })); }
  function openGroup(next: Group) { setGroup(next); setTab('group'); setSelected(next.records[0]); setCollapsed(false); }
  function openRecord(record: Place) {
    setView('map'); setSelected(record); setCollapsed(false);
    if (record.latitude !== null && record.longitude !== null) {
      const next = record.display_level; setMode(next);
      setCamera(c => ({ serial: c.serial + 1, mode: next, coordinates: [record.longitude!, record.latitude!] }));
    }
  }
  const stops = useMemo(() => records.length === 14 ? buildJourneyStops(records) : [], [records]);
  const list = tab === 'group' && group ? group.records : records;
  const guangzhou = mode === 'overview' && group?.records.some(r => r.city === '广州' && r.location_precision === 'city');
  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview'); }} aria-label="返回地图概览"><span className="brand-lettering"><img src={`${import.meta.env.BASE_URL}gaspar-lettering.png`} alt="E. GASPAR · 封面字样的辅助抠图" width="2149" height="732" /></span><span><span className="eyebrow">VIAJE A CHINA · 1880–1882</span><h1>加斯帕尔南中国行记</h1></span></a>
    </header>
    <nav className="view-navigation" aria-label="地图范围">
      <div className="view-tabs"><button className={view === 'map' && mode === 'overview' ? 'active' : ''} aria-pressed={view === 'map' && mode === 'overview'} onClick={() => navigate('overview')}>区域概览</button><button className={view === 'map' && mode === 'detail' ? 'active' : ''} aria-pressed={view === 'map' && mode === 'detail'} onClick={() => navigate('detail')}>广州细读 <span>↗</span></button><button className={view === 'journey' ? 'active' : ''} aria-pressed={view === 'journey'} onClick={() => { setView('journey'); setCollapsed(false); setTab('all'); setGroup(null); }}>行踪漫游</button></div>
      <button className="panel-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? '展开史料面板' : '收起史料面板'} <span>{collapsed ? '←' : '→'}</span></button>
    </nav>
    {error ? <div className="data-error" role="alert">{error}<button onClick={() => window.location.reload()}>重新读取</button></div> : <main className={`workspace ${collapsed ? 'panel-collapsed' : ''}`}>
      {view === 'journey' && stops.length ? <JourneyMap stops={stops} panelOpen={!collapsed} onStop={setSelected} /> : <MapView records={records} mode={mode} camera={camera} panelOpen={!collapsed} onMode={setMode} onGroup={openGroup} />}
      {!collapsed && <aside className="source-panel" aria-label="历史信息面板">
        <div className="record-tabs"><button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>全部记录 <span>{records.length}</span></button><button disabled={!group} className={tab === 'group' ? 'active' : ''} onClick={() => setTab('group')}>当前地点 {group && <span>{group.records.length}</span>}</button></div>
        {tab === 'group' && group && <div className="group-heading"><span>{group.label} · {group.records.length}条独立记录</span>{guangzhou && <button onClick={() => navigate('detail')}>探索广州 ↗</button>}</div>}
        <ol className="record-list" aria-label="按顺序排列的历史记录" data-testid="record-list">
          {list.map(record => <li key={record.sequence}><button className={selected?.sequence === record.sequence ? 'selected' : ''} onClick={() => openRecord(record)} data-sequence={record.sequence}>
            <span className="record-number">{String(record.sequence).padStart(2, '0')}</span><span className="record-summary"><strong>{record.modern_name}</strong>{record.gaspar_name && <span lang="es">{record.gaspar_name}</span>}</span><span className="record-arrow">↗</span>
          </button></li>)}
        </ol>
        {selected ? <article className="historical-record" key={selected.sequence} data-testid="historical-record">
          <h2>{selected.modern_name}</h2>
          {selected.gaspar_name && <p className="historical-name" lang="es">{selected.gaspar_name}</p>}
          {selected.date ? <div className="date-label"><span>笔记日期</span><time dateTime={selected.date}>{displayDate(selected.date)}</time></div> : <p className="date-note">原笔记未载确切日期。</p>}
          {(selected.original_spanish || selected.chinese_translation) && <section className="source-section" aria-label="历史原文与译文">
            {selected.original_spanish && <><blockquote lang="es" data-testid="spanish-quote">{selected.original_spanish}</blockquote><PageReference value={selected.page_number} /></>}
            {selected.chinese_translation && <><p className="translation" lang="zh-CN">{selected.chinese_translation}</p><PageReference value={selected.page_number} /></>}
          </section>}
          {selected.place_info_url && <div className="place-information"><a className="source-link" href={selected.place_info_url} target="_blank" rel="noopener noreferrer">了解此地 <span aria-hidden="true">↗</span></a></div>}
        </article> : <div className="reading-placeholder"><span>❧</span><p>点击地图标记或上方记录，<br />打开一段历史文字。</p><small>可缩放地图进入广州细读</small></div>}
      </aside>}
    </main>}

  </div>;
}
