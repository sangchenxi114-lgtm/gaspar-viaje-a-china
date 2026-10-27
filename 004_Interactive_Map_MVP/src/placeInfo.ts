import type { Place } from './data';
/** Introduction pages, not geocoding endpoints. Includes user-selected introduction URLs updated on 2026-10-27. */
export const placeInformation: Record<number, { place_info_url: string; publisher: string; title: string }> = {
  9: { place_info_url: 'https://zh.wikipedia.org/wiki/华林寺_(广州)', publisher: '维基百科（官方旧链接失效后的备选）', title: '华林寺（广州）' },
  10: { place_info_url: 'https://www.yuexiu.gov.cn/zjyx/yxjd/ycty/content/post_3560955.html', publisher: '广州市越秀区人民政府', title: '五仙观' },
  11: { place_info_url: 'https://cn.tripadvisor.com/Attraction_Review-g298555-d1797602-Reviews-Hoi_Tong_Monastery-Guangzhou_Guangdong.html', publisher: 'Tripadvisor', title: '海幢寺' },
  12: { place_info_url: 'https://www.guangzhoumuseum.cn/website_cn/Web/Visit/VisitGuide.aspx?id=16', publisher: '广州博物馆', title: '镇海楼展区参观指引' },
  13: { place_info_url: 'https://cn.tripadvisor.com/Attraction_Review-g298555-d553965-Reviews-Sacred_Heart_Cathedral-Guangzhou_Guangdong.html', publisher: 'Tripadvisor', title: '石室圣心大教堂' },
  14: { place_info_url: 'https://www.zhongguodiqing.cn/dqwh/dqwh_dqyj/201907/t20190725_4938968.shtml', publisher: '中国地情网', title: '两广总督衙门' },
};
export function attachPlaceInformation(records: Place[]): Place[] {
  return records.map(record => ({ ...record, place_info_url: placeInformation[record.sequence]?.place_info_url ?? null }));
}
