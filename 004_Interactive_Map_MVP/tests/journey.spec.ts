import { test, expect } from './fixtures';
import Papa from 'papaparse';
import { readFileSync } from 'node:fs';
import { parsePlaces } from '../src/data';
import { buildJourneyStops, journeyCoordinates, journeyLineLayers, CURVE_SAMPLES, positionAt } from '../src/journey';
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
  expect(stops.map((_, index) => journeyCoordinates(stops, 11)[index * CURVE_SAMPLES])).toEqual(stops.map(stop => [stop.record.longitude, stop.record.latitude]));
  expect(positionAt(stops, 1.5)).not.toEqual([(stops[1].coordinates[0]+stops[2].coordinates[0])/2,(stops[1].coordinates[1]+stops[2].coordinates[1])/2]);
  expect(journeyCoordinates(stops, 0)).toEqual([]);
  const prefix = journeyCoordinates(stops, 2.4);
  expect(prefix).toEqual([...journeyCoordinates(stops, 11).slice(0, Math.floor(2.4 * CURVE_SAMPLES) + 1), positionAt(stops, 2.4)]);
  expect(prefix[prefix.length-1]).toEqual(positionAt(stops, 2.4));
  expect(journeyLineLayers().map(layer => layer.paint?.['line-width'])).toEqual([14,8,3]);
  expect(journeyLineLayers().every(layer => layer.source === 'journey-route' && layer.paint?.['line-color'] === '#8D2017')).toBe(true);
  expect(researchNotes[10]).toContain('尚需史料印证');
  expect(Object.keys(placeInformation)).toEqual(['9','10','11','12','13','14']);
  expect(Papa.parse(csv, {header:true,skipEmptyLines:true}).data).toHaveLength(14);
});

test('journey plays, pauses, resumes, retains completed route and restarts', async ({page}) => {
  test.setTimeout(100000);
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
  await expect(canvas).toHaveAttribute('data-complete','true',{timeout:60000});
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

test('mobile journey has all stops, 3px glowing route and usable playback controls',async({page})=>{
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
  const caption = page.locator('.journey-marker.active .journey-stop-label');
  await expect(caption).toBeVisible(); await expect(caption).toHaveText('圣心大教堂');
  const captionBox = await caption.boundingBox();
  expect(captionBox!.y).toBeGreaterThan(controls!.y + controls!.height);
  const activeMarker = await page.locator('.journey-marker.active').boundingBox();
  expect(activeMarker!.y).toBeGreaterThan(controls!.y + controls!.height);
  expect(activeMarker!.y + activeMarker!.height).toBeLessThan(panel!.y);
  await page.screenshot({path:'journey-mobile.png'});
});

test('six introduction links open their assigned URLs in a new tab; other records have none',async({page})=>{
  test.setTimeout(90000);
  await page.goto('/'); await expect(page.getByTestId('record-list').locator('li')).toHaveCount(14);
  for(let sequence=1;sequence<=14;sequence++){
    await page.locator(`[data-sequence="${sequence}"]`).click();
    const link=page.getByRole('link',{name:'了解此地'});
    if(sequence<9) {await expect(link).toHaveCount(0);continue;}
    await expect(link).toHaveAttribute('href',placeInformation[sequence].place_info_url);
    // Verify new-tab navigation independently of third-party anti-bot or TLS policies.
    const url = placeInformation[sequence].place_info_url;
    await page.context().route(candidate => decodeURI(candidate.href) === decodeURI(url), route => route.abort());
    const requested = page.context().waitForEvent('request', request => decodeURI(request.url()) === decodeURI(url));
    const popupPromise=page.waitForEvent('popup'); await link.click(); const popup=await popupPromise;
    expect(decodeURI((await requested).url())).toBe(decodeURI(url)); await popup.close();
  }
  await expect(page.getByText('考证札记',{exact:true})).toHaveCount(0);
  await expect(page.getByText('查看地点来源',{exact:true})).toHaveCount(0);
});

test('compact desktop controls leave reached Humen marker and floating caption clear during playback', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'行踪漫游',exact:true}).click();
  await page.getByLabel('选择漫游地点').selectOption('2');
  await expect(page.getByTestId('journey-canvas')).toHaveAttribute('data-map-idle','true');
  await page.getByLabel('播放速度').selectOption('0.5');
  await page.getByRole('button',{name:'继续',exact:true}).click();
  await expect.poll(async()=>Number(await page.getByTestId('journey-canvas').getAttribute('data-progress'))).toBeGreaterThan(2.1);
  const controls = (await page.locator('.journey-controls').boundingBox())!;
  expect(controls.width).toBeLessThanOrEqual(365);
  const marker = (await page.locator('.journey-marker.active').boundingBox())!;
  const caption = page.locator('.journey-marker.active .journey-stop-label');
  await expect(caption).toHaveText('虎门');
  const label = (await caption.boundingBox())!;
  expect(label.y + label.height).toBeLessThan(marker.y);
  expect(marker.y + marker.height).toBeLessThan(controls.y);
  await expect(page.locator('.journey-disclaimer')).toHaveCount(0);
  const cameraBefore = Number(await page.getByTestId('journey-canvas').getAttribute('data-actual-camera-lng'));
  const progressBefore = Number(await page.getByTestId('journey-canvas').getAttribute('data-progress'));
  await expect.poll(async()=>Number(await page.getByTestId('journey-canvas').getAttribute('data-progress'))).toBeGreaterThan(progressBefore + .05);
  const cameraAfter = Number(await page.getByTestId('journey-canvas').getAttribute('data-actual-camera-lng'));
  expect(Math.abs(cameraAfter-cameraBefore)).toBeGreaterThan(.00001);
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  await page.screenshot({path:'journey-humen.png'});
  await page.getByLabel('选择漫游地点').selectOption('8');
  await expect(page.getByTestId('journey-canvas')).toHaveAttribute('data-map-idle','true');
  const circles = await page.locator('.journey-marker:visible').evaluateAll(elements => elements.map(element => {const r=element.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2};}));
  for(let a=0;a<circles.length;a++)for(let b=a+1;b<circles.length;b++)expect(Math.hypot(circles[a].x-circles[b].x,circles[a].y-circles[b].y)).toBeGreaterThanOrEqual(39.9);
  await page.screenshot({path:'journey-guangzhou.png'});
});

test('only the progressive route renders and marker DOM stays subpixel-anchored at regional and city scales', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button',{name:'行踪漫游',exact:true}).click();
  const canvas = page.getByTestId('journey-canvas');
  await expect(page.getByRole('button',{name:'播放',exact:true})).toBeEnabled();
  await expect(canvas).toHaveAttribute('data-route-points','0');
  await expect(page.locator('.journey-leaders, .journey-map svg line')).toHaveCount(0);
  const firstMarker = await page.locator('.journey-marker').first().elementHandle();
  for (const stop of ['0','7']) {
    await page.getByLabel('选择漫游地点').selectOption(stop);
    await expect(canvas).toHaveAttribute('data-map-idle','true',{timeout:20000});
    await page.getByLabel('播放速度').selectOption('0.5');
    await page.getByRole('button',{name:stop==='0'?'播放':'继续',exact:true}).click();
    const started = Number(await canvas.getAttribute('data-progress'));
    await expect.poll(async()=>Number(await canvas.getAttribute('data-progress'))).toBeGreaterThan(started+.05);
    for(let sample=0;sample<4;sample++) {
      const error = await page.locator('.journey-marker').evaluateAll(elements => {
        const map = document.querySelector('[data-testid="journey-canvas"]')!.getBoundingClientRect();
        return Math.max(...elements.map(element=>{const r=element.getBoundingClientRect(),e=element as HTMLElement;return Math.hypot(r.x+r.width/2-map.x-Number(e.dataset.anchorX),r.y+r.height/2-map.y-Number(e.dataset.anchorY));}));
      });
      expect(error).toBeLessThan(1);
      await page.waitForTimeout(70);
    }
    expect(await firstMarker!.evaluate(element=>element===document.querySelector('.journey-marker'))).toBe(true);
    await page.getByRole('button',{name:'暂停',exact:true}).click();
    expect(Number(await canvas.getAttribute('data-route-points'))).toBeLessThanOrEqual(Number(stop)+2);
    await page.screenshot({path:stop==='0'?'journey-regional-glow.png':'journey-city-glow.png'});
  }
});
