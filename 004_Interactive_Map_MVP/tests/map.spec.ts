import { test, expect } from './fixtures';
import { readFileSync } from 'node:fs';
import Papa from 'papaparse';
const records = Papa.parse<Record<string,string>>(readFileSync('public/data/places_geocoded.csv','utf8'), { header: true, skipEmptyLines: true }).data;

test('14 records, five overview markers, city aggregation and Guangzhou drill-down', async ({ page }) => {
  const tileLoaded = page.waitForResponse(response => response.url().includes('tiles.openfreemap.org/planet/') && response.url().endsWith('.pbf') && response.status() === 200);
  await page.goto('/');
  const tileResponse = await tileLoaded;
  expect(tileResponse.headers()['content-type']).toMatch(/protobuf|mapbox-vector-tile|octet-stream/);
  expect((await tileResponse.body()).length).toBeGreaterThan(100);
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('OpenFreeMap');
  await expect(page.locator('.maplibregl-ctrl-attrib-inner')).toContainText('OpenStreetMap');
  await expect(page.getByTestId('record-count')).toHaveText('14 条历史记录');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await expect(page.locator('.map-marker.overview')).toHaveCount(5, { timeout: 20000 });
  await page.screenshot({ path: test.info().outputPath('openfreemap-overview.png') });
  await expect(page.getByRole('button', { name: '澳门，2条记录', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '澳门，2条记录', exact: true }).click();
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('historical-record')).toContainText('Macao');
  await page.getByRole('button', { name: '香港，2条记录', exact: true }).click();
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(2);
  await expect(page.getByTestId('historical-record')).toContainText('此点只代表城市');
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
    await expect(article).toContainText(record.coordinate_status);
    await expect(article.locator('a.source-link')).toHaveAttribute('href',record.coordinate_source);
    if (record.date === 'null') {
      await expect(article.locator('time')).toHaveText('1882年12月之后');
      await expect(article).toContainText('原笔记未载确切日期');
      await expect(article.locator('time')).not.toHaveAttribute('datetime',/.+/);
    }
    await expect(article).not.toContainText(/\bnull\b/);
  }
  await expect(page.locator('footer')).toContainText('不绘制未经证实');
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
  await expect(page.getByTestId('record-count')).toHaveText('14 条历史记录');
  await page.getByRole('button',{name:'广州细读 ↗'}).click();
  await expect.poll(async () => Number(await page.getByTestId('map-canvas').getAttribute('data-zoom'))).toBeGreaterThanOrEqual(11.5);
  await expect.poll(async () => page.locator('.map-marker.detail').evaluateAll(elements => elements.reduce((n,e) => n + Number((e as HTMLElement).dataset.recordCount),0))).toBe(7);
  await page.locator('[data-sequence="14"]').click();
  await expect(page.getByTestId('historical-record')).toContainText('两广总督衙门旧址（今广东省民政厅）');
  await expect(page.getByTestId('historical-record').locator('time')).toHaveText('1882年12月之后');
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
