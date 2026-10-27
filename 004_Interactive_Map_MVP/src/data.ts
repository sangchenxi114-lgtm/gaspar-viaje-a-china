import Papa from 'papaparse';
export type Precision = 'exact' | 'approximate' | 'city-level' | 'unknown';
export interface Place {
  sequence: number; date: string | null; gaspar_name: string | null;
  modern_name: string; city: string | null; display_level: 'overview' | 'detail';
  location_precision: string; latitude: number | null; longitude: number | null;
  coordinate_status: Precision; place_type: string | null; original_spanish: string | null;
  chinese_translation: string | null; coordinate_source: string | null;
  page_number?: string | null; historical_notes?: string | null; place_info_url?: string | null;
}
export interface Group { key: string; label: string; coordinates: [number, number]; records: Place[] }
export const isPresent = (value: string | undefined | null) => Boolean(value?.trim() && value.trim().toLowerCase() !== 'null');
const nullable = (value: string | undefined): string | null => isPresent(value) ? value! : null;
const coordinate = (value: string | undefined, limit: number): number | null => {
  if (!isPresent(value)) return null;
  const n = Number(value); if (!Number.isFinite(n) || Math.abs(n) > limit) throw new Error('数据包含非法坐标。');
  return n;
};
export function parsePlaces(text: string): Place[] {
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.replace(/^\uFEFF/, '') });
  if (parsed.errors.length) throw new Error('CSV格式无法读取，请检查数据文件。');
  const required = ['sequence', 'modern_name', 'display_level', 'location_precision', 'latitude', 'longitude', 'coordinate_status', 'original_spanish', 'coordinate_source'];
  if (required.some(key => !parsed.meta.fields?.includes(key))) throw new Error('CSV缺少必要字段。');
  const records = parsed.data.map(row => {
    if (!isPresent(row.modern_name) || !['overview', 'detail'].includes(row.display_level) || !['exact', 'approximate', 'city-level', 'unknown'].includes(row.coordinate_status)) throw new Error('地点或精度字段不完整。');
    const lat = coordinate(row.latitude, 90), lon = coordinate(row.longitude, 180);
    if ((lat === null) !== (lon === null)) throw new Error('经纬度必须成对提供。');
    if (isPresent(row.coordinate_source) && !/^https:\/\//.test(row.coordinate_source)) throw new Error('坐标来源必须为HTTPS链接。');
    return { ...row, sequence: Number(row.sequence), date: nullable(row.date), gaspar_name: nullable(row.gaspar_name),
      city: nullable(row.city), latitude: lat, longitude: lon, place_type: nullable(row.place_type),
      original_spanish: nullable(row.original_spanish), chinese_translation: nullable(row.chinese_translation), coordinate_source: nullable(row.coordinate_source),
      page_number: nullable(row.page_number), historical_notes: nullable(row.historical_notes), place_info_url: nullable(row.place_info_url) } as Place;
  }).sort((a, b) => a.sequence - b.sequence);
  if (records.length !== 14 || records.some((r, i) => r.sequence !== i + 1)) throw new Error('数据应包含按1–14排列的14条记录。');
  return records;
}
export function makeGroups(records: Place[], level: 'overview' | 'detail'): Group[] {
  const result = new Map<string, Group>();
  for (const r of records.filter(r => r.display_level === level)) {
    if (r.longitude === null || r.latitude === null) continue;
    const key = level === 'overview' && r.location_precision === 'city' ? `city:${r.city}` : `record:${r.sequence}`;
    const existing = result.get(key);
    if (existing) existing.records.push(r);
    else result.set(key, { key, label: key.startsWith('city:') ? (r.city ?? r.modern_name) : r.modern_name,
      coordinates: [r.longitude, r.latitude], records: [r] });
  }
  return [...result.values()];
}
export const precisionLabels: Record<Precision, string> = { exact: '现代建筑定位点', approximate: '近似定位点', 'city-level': '城市代表点', unknown: '坐标未确定' };

// Formatting verified source values only: no page inference from sequence or dates.
export function formatPageReference(value: string | null | undefined): string | null {
  if (!isPresent(value)) return null;
  const page = value!.trim().replace(/^pp?\.\s*/i, '');
  if (/^[1-9]\d*$/.test(page)) return `p. ${page}`;
  const range = page.match(/^([1-9]\d*)\s*[-–—]\s*([1-9]\d*)$/);
  if (range && Number(range[2]) >= Number(range[1])) return `pp. ${range[1]}–${range[2]}`;
  return null;
}
