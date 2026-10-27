import { test, expect } from './fixtures';
import Papa from 'papaparse';
import { readFileSync } from 'node:fs';
import { parsePlaces } from '../src/data';
import { buildJourneyStops, journeyCoordinates, journeyLineLayer } from '../src/journey';
import { researchNotes } from '../src/researchNotes';
import { placeInformation } from '../src/placeInfo';
const csv = readFileSync('public/data/places_geocoded.csv', 'utf8');
const original = parsePlaces(csv);
const names = ['澳门', '香港', '虎门', '黄埔', '广州', '沙面', '华林寺', '五仙观', '海幢寺', '镇海楼', '圣心大教堂', '两广总督衙门'];

test('curated stops preserve 14 source records, verified coordinates and exact solid-line specification', () => {
  const before = JSON.stringify(original), stops = buildJourneyStops(original);
  expect(stops.map(s => s.name)).toEqual(names);
  expect(stops.map(s => s.record.sequence)).toEqual([1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  expect(stops).toHaveLength(12); expect(original).toHaveLength(14);
  expect(JSON.stringify(original)).toBe(before);
  expect(journeyCoordinates(stops, 11)).toEqual(stops.map(stop => [stop.record.longitude, stop.record.latitude]));
  expect(journeyCoordinates(stops, 0)).toEqual([]);
  expect(journeyLineLayer(false).paint).toEqual({ 'line-color': '#8D2017', 'line-width': 4 });
  expect(journeyLineLayer(true).paint).toEqual({ 'line-color': '#8D2017', 'line-width': 3 });
  expect(journeyLineLayer(false).layout).toEqual({ 'line-cap': 'round', 'line-join': 'round' });
  expect(researchNotes[10]).toContain('尚需史料印证');
  expect(Object.keys(placeInformation)).toEqual(['9','10','11','12','13','14']);
  expect(Papa.parse(csv, {header:true,skipEmptyLines:true}).data).toHaveLength(14);
});

test('journey plays, pauses, resumes, retains completed route and restarts', async ({page}) => {
  test.setTimeout(65000);
  await page.goto('/');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await page.getByRole('button', {name:'行踪漫游',exact:true}).click();
  const canvas = page.getByTestId('journey-canvas');
  await expect(page.locator('.journey-marker')).toHaveCount(12);
  await expect(page.locator('.journey-current')).toContainText('01 / 12');
  await expect(page.locator('.journey-current')).toContainText('澳门');
  await page.getByRole('button',{name:'播放',exact:true}).click();
  await expect.poll(async()=>Number(await canvas.getAttribute('data-progress'))).toBeGreaterThan(.08);
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  const paused = Number(await canvas.getAttribute('data-progress'));
  await page.waitForTimeout(450);
  expect(Number(await canvas.getAttribute('data-progress'))).toBeCloseTo(paused, 3);
  await page.getByLabel('播放速度').selectOption('4');
  await page.getByRole('button',{name:'继续',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-complete','true',{timeout:20000});
  await expect(canvas).toHaveAttribute('data-route-points','12');
  await expect(page.locator('.journey-current')).toContainText('12 / 12');
  await expect(page.locator('.journey-current')).toContainText('两广总督衙门');
  await expect(page.locator('.journey-marker.completed')).toHaveCount(11);
  await expect(page.locator('.journey-marker.active')).toHaveCount(1);
  await page.waitForTimeout(350);
  await expect(canvas).toHaveAttribute('data-route-points','12');
  await expect(canvas).toHaveAttribute('data-map-idle','true',{timeout:20000});
  expect(await page.locator('.journey-marker').evaluateAll(elements => elements.every(element => getComputedStyle(element).position === 'absolute'))).toBe(true);
  await page.screenshot({path:'journey-desktop.png'});
  await page.getByRole('button',{name:'重新开始',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-progress','0');
  await expect(page.getByRole('button',{name:'播放',exact:true})).toBeVisible();
  await page.getByLabel('选择漫游地点').selectOption('6');
  await expect(page.locator('.journey-current')).toContainText('07 / 12');
  await expect(page.locator('.journey-current')).toContainText('华林寺');
  await expect(page.getByTestId('historical-record')).toContainText('La de los Quinientos ídolos');
  await expect(canvas).toHaveAttribute('data-route-points','7');
  await page.getByRole('button',{name:'区域概览',exact:true}).click();
  await expect(page.locator('.map-marker.overview')).toHaveCount(5,{timeout:20000});
});

test('mobile journey has all stops, 3px route and usable playback controls',async({page})=>{
  await page.setViewportSize({width:390,height:844}); await page.goto('/');
  await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  await page.getByRole('button',{name:'行踪漫游',exact:true}).click();
  await expect(page.getByTestId('journey-canvas')).toHaveAttribute('data-line-width','3');
  await expect(page.getByLabel('选择漫游地点').locator('option')).toHaveCount(12);
  await page.getByLabel('选择漫游地点').selectOption('10');
  await expect(page.locator('.journey-current')).toContainText('圣心大教堂');
  await page.getByRole('button',{name:'继续',exact:true}).click();
  await expect.poll(async()=>Number(await page.getByTestId('journey-canvas').getAttribute('data-progress'))).toBeGreaterThan(10.02);
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  const controls=await page.locator('.journey-controls').boundingBox(),panel=await page.getByRole('complementary').boundingBox();
  expect(controls!.y+controls!.height).toBeLessThanOrEqual(panel!.y);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // Pin the manually selected stop after pausing: during travel the camera follows the moving line endpoint.
  await page.getByLabel('选择漫游地点').selectOption('10');
  await expect(page.getByTestId('journey-canvas')).toHaveAttribute('data-map-idle','true',{timeout:20000});
  expect(await page.locator('.journey-marker').evaluateAll(elements => elements.every(element => getComputedStyle(element).position === 'absolute'))).toBe(true);
  const activeMarker = await page.locator('.journey-marker.active').boundingBox();
  expect(activeMarker!.y).toBeGreaterThan(controls!.y + controls!.height);
  expect(activeMarker!.y + activeMarker!.height).toBeLessThan(panel!.y);
  await page.screenshot({path:'journey-mobile.png'});
});

test('six introduction links use real relevant pages in a new tab; other records have none',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/'); await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  for(let sequence=1;sequence<=14;sequence++){
    await page.locator(`[data-sequence="${sequence}"]`).click();
    const link=page.getByRole('link',{name:'了解此地'});
    if(sequence<9) {await expect(link).toHaveCount(0);continue;}
    await expect(link).toHaveAttribute('href',placeInformation[sequence].place_info_url);
    const popupPromise=page.waitForEvent('popup'); await link.click(); const popup=await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    expect(new URL(popup.url()).hostname).toBe(new URL(placeInformation[sequence].place_info_url).hostname);
    await expect(popup.locator('body')).not.toBeEmpty();await popup.close();
  }
  await expect(page.getByText('考证札记',{exact:true})).toHaveCount(0);
  await expect(page.getByText('查看地点来源',{exact:true})).toHaveCount(0);
});
