import { test as base, expect } from '@playwright/test';
import https from 'node:https';
import { readFileSync } from 'node:fs';
import { HttpsProxyAgent } from 'https-proxy-agent';
// Cloud Chromium may lack the session proxy CA in its persistent NSS store.
// Only tests relay actual OpenFreeMap basemap responses through Node with the supplied CA;
// TLS validation stays enabled. No browser/global trust settings are changed.
const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const caFile = process.env.CODEX_PROXY_CERT;
const cache = new Map<string, Promise<{ body: Buffer; status: number; contentType: string }>>();
function tile(url: string, requestHeaders: Record<string, string>) {
  let pending = cache.get(url);
  if (!pending) {
    pending = new Promise<{ body: Buffer; status: number; contentType: string }>((resolve, reject) => {
      const request = https.get(url, {
        agent: proxy ? new HttpsProxyAgent(proxy) : undefined,
        ...(caFile ? { ca: [readFileSync(caFile)] } : {}),
        headers: { 'User-Agent': requestHeaders['user-agent'], ...(requestHeaders['referer'] ? { Referer: requestHeaders['referer'] } : {}) },
      }, response => {
        const chunks: Buffer[] = []; response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve({ body: Buffer.concat(chunks), status: response.statusCode ?? 502, contentType: String(response.headers['content-type'] ?? 'application/octet-stream') }));
        response.on('error',reject);
      });
      request.setTimeout(20000, () => request.destroy(new Error('OpenFreeMap basemap timed out'))); request.on('error', reject);
    });
    cache.set(url, pending);
  }
  return pending;
}
export const test = base.extend({
  page: async ({ page }, use) => {
    if (proxy && caFile) await page.context().route(url => ['tiles.openfreemap.org', 'zh.wikipedia.org', 'www.yuexiu.gov.cn', 'www.guangzhoumuseum.cn'].includes(url.hostname), async route => {
      try { const result = await tile(route.request().url(), route.request().headers()); await route.fulfill({ status: result.status, body: result.body, contentType: result.contentType }); }
      catch { await route.abort('failed'); }
    });
    await use(page);
  },
});
export { expect };
