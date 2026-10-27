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
export function positionAt(stops: JourneyStop[], progress: number): [number, number] {
  const index = Math.min(Math.floor(progress), stops.length - 1);
  const first = stops[index].coordinates, second = stops[Math.min(index + 1, stops.length - 1)].coordinates;
  const fraction = progress - index;
  return [first[0] + (second[0] - first[0]) * fraction, first[1] + (second[1] - first[1]) * fraction];
}
export function journeyCoordinates(stops: JourneyStop[], progress: number): [number, number][] {
  if (progress <= 0) return [];
  const value = Math.min(progress, stops.length - 1), index = Math.floor(value);
  const complete = stops.slice(0, index + 1).map(stop => stop.coordinates);
  // Only a temporary drawing endpoint is interpolated; no geographic waypoints are invented or saved.
  return value > index ? [...complete, positionAt(stops, value)] : complete;
}

export function journeyLineLayer(mobile: boolean): LineLayerSpecification {
  return { id: 'journey-route', type: 'line', source: 'journey-route',
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#8D2017', 'line-width': mobile ? 3 : 4 } };
}
