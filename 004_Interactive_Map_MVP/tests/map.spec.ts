import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import Papa from 'papaparse';
import { placeInformation } from '../src/placeInfo';
const records = Papa.parse<Record<string,string>>(readFileSync('public/data/places_geocoded.csv','utf8'), { header: true, skipEmptyLines: true }).data;

test('14 records, five overview markers, city aggregation and Guangzhou drill-down', async ({ page }) => {
  const tileLoaded = page.waitForResponse(response => response.url().includes('tiles.openfreemap.org/planet/') && response.url().endsWith('.pbf') && response.status() === 200);
  await page.goto('/');
  const tileResponse = await tileLoaded;
  expect(tileResponse.headers()['content-type']).toMatch(/protobuf|mapbox-vector-tile|octet-stream/);
  expect((await tileResponse.body()).length).toBeGreaterThan(100);
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('OpenFreeMap');
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('OpenStreetMap');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await expect(page.locator('.map-marker.overview')).toHaveCount(5, { timeout: 20000 });
  await page.screenshot({ path: test.info().outputPath('openfreemap-overview.png') });
  await expect(page.getByRole('button', { name: '澳门，2条记录', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '澳门，2条记录', exact: true }).click();
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('historical-record')).toContainText('Macao');
  await page.getByRole('button', { name: '香港，2条记录', exact: true }).click();
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('historical-record').locator('.historical-note')).toHaveCount(0);
  await page.getByRole('button', { name: '广州，1条记录', exact: true }).click();
  await page.getByRole('button', { name: '探索广州 ↗' }).click();
  await expect(page.getByRole('button', { name: '广州细读 ↗' })).toHaveAttribute('aria-pressed','true');
  await expect.poll(async () => page.locator('.map-marker.detail').evaluateAll(elements => elements.reduce((n,e) => n + Number((e as HTMLElement).dataset.recordCount), 0))).toBe(7);
  await expect(page.locator('.map-marker.overview')).toHaveCount(0);
  await expect.poll(async () => Number(await page.getByTestId('map-canvas').getAttribute('data-zoom'))).toBeGreaterThan(13);
  // At a lower detail zoom, neighboring records are grouped without losing access.
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', {name:'缩小',exact:true}).click();
    await expect(page.getByTestId('map-canvas')).toHaveAttribute('aria-busy','false');
  }
  const nearby = page.locator('.map-marker.detail').filter({hasText:'邻近地点'}).first();
  await expect(nearby).toBeVisible();
  const count = Number(await nearby.getAttribute('data-record-count'));
  await nearby.click();
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(count);
  await page.getByRole('button', { name: '区域概览', exact:true }).click();
  await expect(page.locator('.map-marker.overview')).toHaveCount(5, { timeout: 20000 });
});

test('all Spanish quotations, missing-date labels, precision and valid source links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  for (const record of records) {
    await page.locator(`[data-sequence="${record.sequence}"]`).click();
    const article = page.getByTestId('historical-record');
    await expect(article.getByTestId('spanish-quote')).toHaveText(record.original_spanish);
    await expect(article.locator('.precision-badge')).toHaveCount(0);
    await expect(article).not.toContainText(/approximate|city-level|DOCUMENT/);
    const info = placeInformation[Number(record.sequence)];
    if (info) {
      await expect(article.locator('a.source-link')).toHaveAttribute('href', info.place_info_url);
      await expect(article.locator('a.source-link')).toHaveAttribute('target', '_blank');
      expect(info.place_info_url).not.toBe(record.coordinate_source);
    } else await expect(article.locator('a.source-link')).toHaveCount(0);
    await expect(article.locator('.historical-note')).toHaveCount(0);
    if (record.date === 'null') {
      await expect(article.locator('time')).toHaveCount(0);
      await expect(article).toContainText('原笔记未载确切日期');
      await expect(article.locator('.page-reference')).toHaveCount(0);
    }
    await expect(article).not.toContainText(/\bnull\b/);
  }
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('OpenStreetMap');
});

test('manual zoom into Guangzhou reveals detail records without Explore action', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.map-marker.overview')).toHaveCount(5, { timeout: 20000 });
  await page.locator('[data-sequence="7"]').click();
  await page.waitForTimeout(1300);
  for (let i=0;i<3;i++) { await page.getByRole('button',{ name:'放大',exact:true }).click(); await page.waitForTimeout(400); }
  await expect(page.getByRole('button',{name:'广州细读 ↗'})).toHaveAttribute('aria-pressed','true');
  await expect.poll(async () => page.locator('.map-marker.detail').evaluateAll(elements => elements.reduce((n,e) => n + Number((e as HTMLElement).dataset.recordCount),0))).toBe(7);
});

test('mobile reading and collapsible panel remain usable', async ({ page }) => {
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await page.getByRole('button',{name:'广州细读 ↗'}).click();
  await expect.poll(async () => Number(await page.getByTestId('map-canvas').getAttribute('data-zoom'))).toBeGreaterThanOrEqual(11.5);
  await expect.poll(async () => page.locator('.map-marker.detail').evaluateAll(elements => elements.reduce((n,e) => n + Number((e as HTMLElement).dataset.recordCount),0))).toBe(7);
  await page.locator('[data-sequence="14"]').click();
  await expect(page.getByTestId('historical-record')).toContainText('两广总督衙门旧址（今广东省民政厅）');
  await expect(page.getByTestId('historical-record').locator('time')).toHaveCount(0);
  await page.getByRole('button',{name:/收起史料面板/}).click();
  await expect(page.getByRole('complementary')).toHaveCount(0);
  await page.getByRole('button',{name:/展开史料面板/}).click();
  await expect(page.getByRole('complementary')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('data loading failure is explained instead of silently showing an empty map',async({page}) => {
  await page.route('**/data/places_geocoded.csv',route=>route.fulfill({status:404,body:'missing'}));
  await page.goto('/');await expect(page.getByRole('alert')).toContainText('数据文件加载失败');
});


test('archival redesign removes technical chrome, supports page references without editing data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await page.locator('[data-sequence="10"]').click();
  await expect(page.locator('.page-reference')).toHaveCount(0);
  await expect(page.locator('.historical-note')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '考证札记' })).toHaveCount(0);
  await expect(page.locator('header')).not.toContainText('数字人文');
  await expect(page.locator('body')).not.toContainText('READ THE JOURNEY');
  await expect(page.locator('body')).not.toContainText('PEARL RIVER DELTA');
  await expect(page.locator('.brand-lettering img')).toBeVisible();
  // Without the removed notes, short records may fit; constrain height to exercise actual overflow.
  await page.setViewportSize({width:1440,height:700});
  const panel = page.getByRole('complementary');
  const overflow = await panel.evaluate(element => {
    element.scrollTop = element.scrollHeight;
    return { position: getComputedStyle(element).position, scrollable: element.scrollTop > 0 };
  });
  expect(overflow.position).toBe('absolute'); expect(overflow.scrollable).toBe(true);
  // Verified page values are synthetic test inputs; authoritative CSV stays untouched.
  const pages = records.map((r, i) => ({...r, page_number: i === 0 ? '45' : i === 1 ? '45-46' : 'null'}));
  await page.route('**/data/places_geocoded.csv', route => route.fulfill({ status:200, contentType:'text/csv; charset=utf-8', body:Papa.unparse(pages) }));
  await page.reload();
  await page.locator('[data-sequence="1"]').click();
  await expect(page.locator('.page-reference')).toHaveCount(2);
  await expect(page.locator('.page-reference').first()).toHaveText('p. 45');
  await page.locator('[data-sequence="2"]').click();
  await expect(page.locator('.page-reference')).toHaveCount(2);
  await expect(page.locator('.page-reference').last()).toHaveText('pp. 45–46');
  await page.locator('[data-sequence="3"]').click();
  await expect(page.locator('.page-reference')).toHaveCount(0);
});

test('capture desktop and mobile archival reading panels for review', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  const loaded = page.waitForResponse(r => r.url().includes('tiles.openfreemap.org/planet/') && r.url().endsWith('.pbf') && r.status() === 200);
  await page.goto('/'); await loaded;
  await page.locator('[data-sequence="9"]').click();
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('complementary').evaluate(element => { element.scrollTop = 170; });
  await page.screenshot({ path: 'review-desktop.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-sequence="6"]').click();
  await expect(page.getByTestId('map-canvas')).toHaveAttribute('aria-busy', 'false');
  await expect.poll(async () => Number(await page.getByTestId('map-canvas').getAttribute('data-zoom'))).toBeCloseTo(9.5, 1);
  await page.getByRole('complementary').evaluate(element => { element.scrollTop = 200; });
  await page.screenshot({ path: 'review-mobile.png' });
});
