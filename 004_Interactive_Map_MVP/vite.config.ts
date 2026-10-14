import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Permit only this Codespace's forwarded hostname, not arbitrary external hosts.
const forwardedHost = process.env.CODESPACE_NAME
  ? `${process.env.CODESPACE_NAME}-5173.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev'}`
  : null;
export default defineConfig({
  plugins: [react()], base: './',
  server: { host: '0.0.0.0', port: 5173, strictPort: true, allowedHosts: forwardedHost ? [forwardedHost] : [] },
});
