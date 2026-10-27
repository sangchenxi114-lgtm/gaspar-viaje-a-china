import type { LineLayerSpecification } from 'maplibre-gl';
import type { Place } from './data';
export interface JourneyStop { step: number; name: string; english: string; record: Place; sourceSequences: readonly number[]; coordinates: [number, number] }
// Curated presentation only. These references never replace original record.sequence.
const narrative = [
  ['澳门', 'Macau', 1, [1, 3]], ['香港', 'Hong Kong', 4, [2, 4]],
  ['虎门', 'Humen', 5, [5]], ['黄埔', 'Huangpu', 6, [6]],
  ['广州', 'Guangzhou', 7, [7]], ['沙面', 'Shamian', 8, [8]],
  ['华林寺', 'Hualin Temple', 9, [9]], ['五仙观', 'Five Immortals Temple', 10, [10]],
  ['海幢寺', 'Haichuang Temple', 11, [11]], ['镇海楼', 'Zhenhai Tower', 12, [12]],
  ['圣心大教堂', 'Sacred Heart Cathedral', 13, [13]], ['两广总督衙门', "Former Viceroy's Yamen", 14, [14]],
] as const;
export function buildJourneyStops(records: Place[]): JourneyStop[] {
  return narrative.map(([name, english, sequence, sourceSequences], index) => {
    const record = records.find(r => r.sequence === sequence);
    if (!record || record.latitude === null || record.longitude === null) throw new Error(`漫游地点缺少已核实坐标：${name}`);
    return { step: index + 1, name, english, record, sourceSequences, coordinates: [record.longitude, record.latitude] };
  });
}
export const SEGMENT_SECONDS = 3.2;
// Presentation-only cubic interpolation; sampled points are not historical waypoints.
export const CURVE_SAMPLES = 32;
export function positionAt(stops: JourneyStop[], progress: number): [number, number] {
  const value = Math.max(0, Math.min(progress, stops.length - 1)), i = Math.floor(value), t = value - i;
  const a = stops[i].coordinates, b = stops[Math.min(i + 1, stops.length - 1)].coordinates;
  const before = stops[Math.max(0, i - 1)].coordinates, after = stops[Math.min(i + 2, stops.length - 1)].coordinates;
  const distance = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const control = (origin: [number, number], from: [number, number], to: [number, number], sign: number): [number, number] => {
    const dx = to[0] - from[0], dy = to[1] - from[1], length = Math.hypot(dx, dy) || 1;
    return [origin[0] + sign * dx / length * distance * .28, origin[1] + sign * dy / length * distance * .28];
  };
  const c = control(a, before, b, 1), d = control(b, a, after, -1), u = 1 - t;
  return [0, 1].map(axis => u*u*u*a[axis] + 3*u*u*t*c[axis] + 3*u*t*t*d[axis] + t*t*t*b[axis]) as [number, number];
}
export function journeyCoordinates(stops: JourneyStop[], progress: number): [number, number][] {
  const value = Math.max(0, Math.min(progress, stops.length - 1));
  if (!value) return [];
  const points: [number, number][] = [];
  for (let sample = 0; sample <= Math.floor(value * CURVE_SAMPLES); sample++) points.push(positionAt(stops, sample / CURVE_SAMPLES));
  if (value * CURVE_SAMPLES % 1) points.push(positionAt(stops, value));
  return points;
}

export function journeyLineLayer(mobile: boolean): LineLayerSpecification {
  return { id: 'journey-route', type: 'line', source: 'journey-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#8D2017', 'line-width': mobile ? 1.5 : 2 } };
}
