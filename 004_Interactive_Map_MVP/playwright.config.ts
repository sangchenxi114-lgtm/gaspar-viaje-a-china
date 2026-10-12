import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
const browserPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
export default defineConfig({
  testDir: './tests', timeout: 45000, workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1000 },
    launchOptions: { ...(browserPath ? { executablePath: browserPath } : {}),
      args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
      ...(proxyUrl ? { proxy: { server: proxyUrl, bypass: '127.0.0.1,localhost' } } : {}) },
  },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI },
});
