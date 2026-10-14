import { useEffect, useState } from 'react';
import MapView, { type CameraRequest, type Mode } from './MapView';
import { parsePlaces, formatPageReference, type Group, type Place } from './data';

const displayDate = (date: string) => date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1年$2月$3日');
// Brief editorial renderings of the existing Phase 03 review, not new identifications.
const researchNotes: Record<number, string> = {
  2: '长洲太平清醮是笔记整理者的现代对应，尚待核实；地图标示香港，并非节庆的具体现场。',
  3: '1881年文字所指的总督府建筑尚未确定，此处仅标示澳门。',
  5: '原文写到守卫河口的堡垒。现今虎门镇与历史海口、炮台的范围并不相同。',
  6: '现今黄埔区不等同于历史上的Wampoa港口或锚地，实际停靠地点仍待考证。',
  8: '这里标示沙面岛；具体过桥与登陆的位置尚未确定。',
  9: '此处采用华林寺的对应。五百罗汉堂的历史建筑位置仍需核实。',
  10: '“钟寺”与五仙观、岭南第一楼的对应尚需史料印证，地图标示的是寺观范围。',
  11: '海幢寺的院落历经修复；文字中的猪圈与十九世纪寺院布局尚未定位。',
  12: '地图指向现存镇海楼，仍需结合重建沿革核对原文所见建筑。',
  13: '教堂的落成年份晚于旅行年代。文字是否记述在建阶段，以及所称“鞑靼区”的范围，仍需考证。',
  14: '旧址对应今越华路118号广东省民政厅。此点表示现今位置，并非历史衙门的建筑边界。',
};
function PageReference({ value }: { value?: string | null }) {
  const label = formatPageReference(value);
  return label ? <p className="page-reference" aria-label="原书页码">{label}</p> : null;
}
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
      <a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('overview'); }} aria-label="返回地图概览"><span className="brand-lettering"><img src={`${import.meta.env.BASE_URL}gaspar-lettering.png`} alt="E. GASPAR · 封面字样的辅助抠图" width="2149" height="732" /></span><span><span className="eyebrow">VIAJE A CHINA · 1880–1882</span><h1>加斯帕尔南中国行记</h1></span></a>
    </header>
    <nav className="view-navigation" aria-label="地图范围">
      <div className="view-tabs"><button className={mode === 'overview' ? 'active' : ''} aria-pressed={mode === 'overview'} onClick={() => navigate('overview')}>区域概览</button><button className={mode === 'detail' ? 'active' : ''} aria-pressed={mode === 'detail'} onClick={() => navigate('detail')}>广州细读 <span>↗</span></button></div>
      <button className="panel-toggle" aria-expanded={!collapsed} onClick={() => setCollapsed(value => !value)}>{collapsed ? '展开史料面板' : '收起史料面板'} <span>{collapsed ? '←' : '→'}</span></button>
    </nav>
    {error ? <div className="data-error" role="alert">{error}<button onClick={() => window.location.reload()}>重新读取</button></div> : <main className={`workspace ${collapsed ? 'panel-collapsed' : ''}`}>
      <MapView records={records} mode={mode} camera={camera} panelOpen={!collapsed} onMode={setMode} onGroup={openGroup} />
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
          <section className="research-section" aria-label="历史考证与来源">
            {(selected.historical_notes || researchNotes[selected.sequence]) && <><h3>考证札记</h3><p className="historical-note">{selected.historical_notes || researchNotes[selected.sequence]}</p></>}
            {selected.coordinate_source && <a className="source-link" href={selected.coordinate_source} target="_blank" rel="noopener noreferrer">查看地点来源 <span aria-hidden="true">↗</span></a>}
          </section>
        </article> : <div className="reading-placeholder"><span>❧</span><p>点击地图标记或上方记录，<br />打开一段历史文字。</p><small>可缩放地图进入广州细读</small></div>}
      </aside>}
    </main>}

  </div>;
}
