import type { Place } from './data';
/** Introduction pages, not geocoding endpoints. Retrieved and read on 2026-10-27. */
export const placeInformation: Record<number, { place_info_url: string; publisher: string; title: string }> = {
  9: { place_info_url: 'https://zh.wikipedia.org/wiki/华林寺_(广州)', publisher: '维基百科（官方旧链接失效后的备选）', title: '华林寺（广州）' },
  10: { place_info_url: 'https://zh.wikipedia.org/wiki/五仙观', publisher: '维基百科（官方旧链接无法读取后的备选）', title: '五仙观' },
  11: { place_info_url: 'https://zh.wikipedia.org/wiki/海幢寺', publisher: '维基百科（官方旧链接失效后的备选）', title: '海幢寺' },
  12: { place_info_url: 'https://www.guangzhoumuseum.cn/website_cn/Web/Visit/VisitGuide.aspx?id=16', publisher: '广州博物馆', title: '镇海楼展区参观指引' },
  13: { place_info_url: 'https://www.yuexiu.gov.cn/zjyx/yxjd/zjwh/content/post_8665100.html', publisher: '广州市越秀区人民政府', title: '圣心大教堂' },
  14: { place_info_url: 'https://www.yuexiu.gov.cn/zjyx/yxgk/whhs/content/post_3560709.html#:~:text=小东营位于越华路', publisher: '广州市越秀区人民政府', title: '广州市越秀区街巷趣谈·小东营（含清两广总督署及今省民政厅位置介绍）' },
};
export function attachPlaceInformation(records: Place[]): Place[] {
  return records.map(record => ({ ...record, place_info_url: placeInformation[record.sequence]?.place_info_url ?? null }));
}
