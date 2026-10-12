import { useEffect, useState } from 'react';
import MapView, { type CameraRequest, type Mode } from './MapView';
import { parsePlaces, precisionLabels, type Group, type Place } from './data';

const displayDate = (date: string | null) => date ? date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日') : '1882年12月之后';
export default function App() {
  const [records, setRecords] = useState<Place[]>([]), [error, setError] = useState('');
  const [mode, setMode] = useState<Mode>('overview'), [camera, setCamera] = useState<CameraRequest>({ serial: 0 });
  const [selected, setSelected] = useState<Place | null>(null), [group, setGroup] = useState<Group | null>(null);
  const [collapsed, setCollapsed] = useState(false), [tab, setTab] = useState<'all' | 'group'>('all');
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}data/places_geocoded.csv`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('数据文件加载失败。'); return response.text(); })
      .then(text => { setRecords(parsePlaces(text)); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, []);
  function navigate(next: Mode) { setMode(next); setCamera(c => ({ serial: c.serial + 1, mode: next })); }
  function openGroup(next: Group) { setGroup(next); setTab('group'); setSelected(next.records[0]); setCollapsed(false); }
  function openRecord(record: Place) {
    setSelected(record); setCollapsed(false);
    if (record.latitude !== null && record.longitude !== null) {
      const next = record.display_level; setMode(next);
      setCamera(c => ({ serial: c.serial + 1, mode: next, coordinates: [record.longitude!, record.latitude!] }));
    }
  }
  const list = tab === 'group' && group ? group.records : records;
  const guangzhou = mode === 'overview' && group?.records.some(r => r.city === '广州' && r.location_precision === 'city');
  return <div className="app-shell">
    <header className="site-header">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview'); }} aria-label="返回地图概览"><span className="brand-mark">G</span><span><span className="eyebrow">ENRIQUE GASPAR · 1880–1882</span><h1>加斯帕尔南中国行记</h1></span></a>
      <div className="header-meta"><span>数字人文 · 历史地理</span><span className="edition">地图初稿 / 04</span></div>
    </header>
    <nav className="view-navigation" aria-label="地图范围">
      <div className="view-tabs"><button className={mode === 'overview' ? 'active' : ''} aria-pressed={mode === 'overview'} onClick={() => navigate('overview')}>区域概览</button><button className={mode === 'detail' ? 'active' : ''} aria-pressed={mode === 'detail'} onClick={() => navigate('detail')}>广州细读 <span>↗</span></button></div>
      <span className="record-count" data-testid="record-count">{records.length ? `${records.length} 条历史记录` : '正在读取史料…'}</span>
      <button className="panel-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? '展开史料面板' : '收起史料面板'} <span>{collapsed ? '←' : '→'}</span></button>
    </nav>
    {error ? <div className="data-error" role="alert">{error}<button onClick={() => window.location.reload()}>重新读取</button></div> : <main className={`workspace ${collapsed ? 'panel-collapsed' : ''}`}>
      <MapView records={records} mode={mode} camera={camera} onMode={setMode} onGroup={openGroup} />
      {!collapsed && <aside className="source-panel" aria-label="历史信息面板">
        <div className="panel-intro"><span className="eyebrow">READ THE JOURNEY</span><h2>沿着文字，重读地点</h2><p>一条记录，一层历史。地图上的点位，<br className="desktop-break" />是阅读线索，而非已证实的旅行轨迹。</p></div>
        <div className="record-tabs"><button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>全部记录 <span>{records.length}</span></button><button disabled={!group} className={tab === 'group' ? 'active' : ''} onClick={() => setTab('group')}>当前地点 {group && <span>{group.records.length}</span>}</button></div>
        {tab === 'group' && group && <div className="group-heading"><span>{group.label} · {group.records.length}条独立记录</span>{guangzhou && <button onClick={() => navigate('detail')}>探索广州 ↗</button>}</div>}
        <ol className="record-list" aria-label="按顺序排列的历史记录" data-testid="record-list">
          {list.map(record => <li key={record.sequence}><button className={selected?.sequence === record.sequence ? 'selected' : ''} onClick={() => openRecord(record)} data-sequence={record.sequence}>
            <span className="record-number">{String(record.sequence).padStart(2, '0')}</span><span className="record-summary"><strong>{record.modern_name}</strong>{record.gaspar_name && <span lang="es">{record.gaspar_name}</span>}</span><span className="record-arrow">↗</span>
          </button></li>)}
        </ol>
        {selected ? <article className="historical-record" key={selected.sequence} data-testid="historical-record">
          <div className="record-topline"><span className="eyebrow">DOCUMENT / {String(selected.sequence).padStart(2, '0')}</span><span className={`precision-badge ${selected.coordinate_status}`}>{precisionLabels[selected.coordinate_status]}</span></div>
          <h2>{selected.modern_name}</h2>
          {selected.gaspar_name && <p className="historical-name" lang="es">{selected.gaspar_name}</p>}
          <div className="date-label"><span>笔记日期</span><time dateTime={selected.date ?? undefined}>{displayDate(selected.date)}</time></div>
          {!selected.date && <p className="date-note">原笔记未载确切日期；此标签仅用于展示分组。</p>}
          {(selected.original_spanish || selected.chinese_translation) && <section className="source-section"><h3>01 / 加斯帕尔的文字</h3>{selected.original_spanish && <blockquote lang="es" data-testid="spanish-quote">{selected.original_spanish}</blockquote>}{selected.chinese_translation && <p className="translation">{selected.chinese_translation}</p>}</section>}
          <section className="research-section"><h3>02 / 现代地理对应</h3><dl><div><dt>现代识别</dt><dd>{selected.modern_name}</dd></div>{selected.city && <div><dt>所属城市</dt><dd>{selected.city}</dd></div>}<div><dt>原始精度标签</dt><dd>{selected.coordinate_status} · {selected.location_precision}</dd></div>{selected.latitude !== null && selected.longitude !== null && <div><dt>现今坐标</dt><dd>{selected.latitude}, {selected.longitude}</dd></div>}</dl>
            <p className="research-note">{selected.coordinate_status === 'city-level' ? '此点只代表城市，不表示节庆现场或历史建筑的精确位置。' : selected.coordinate_status === 'approximate' ? '此点为区域或现今旧址的近似定位，历史建筑范围与对应关系仍需审慎核验。' : selected.coordinate_status === 'exact' ? '此点定位现存建筑。建筑级定位并不证明加斯帕尔到访了这座现存建筑，也不表示测量误差为零。' : '尚无可靠坐标，暂不在地图上定位。'}</p>
            {selected.coordinate_source && <a className="source-link" href={selected.coordinate_source} target="_blank" rel="noopener noreferrer">核查坐标来源 <span>↗</span></a>}
          </section>
        </article> : <div className="reading-placeholder"><span>❧</span><p>点击地图标记或上方记录，<br />打开一段历史文字。</p><small>可缩放地图进入广州细读</small></div>}
      </aside>}
    </main>}
    <footer className="methodology"><span className="footnote-index">注</span><p>点位依现今地理定位；精度不等于历史识别置信度。笔记日期不自动等同于到访日期，本图不绘制未经证实的连续旅行路线。</p><span className="footer-signature">文献 · 地点 · 不确定性</span></footer>
  </div>;
}
