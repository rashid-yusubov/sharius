import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend URL for the dev-server proxy.
// When running outside Docker: http://127.0.0.1:8000 (default)
// When running inside Docker Compose: set BACKEND_URL=http://backend:8000
// in the frontend service environment block.
const backendUrl = process.env.BACKEND_URL ?? 'http://127.0.0.1:8000';

const proxyTarget = { target: backendUrl, changeOrigin: true };

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/auth':     proxyTarget,
      '/profile':  proxyTarget,
      '/users':    proxyTarget,
      '/contacts': proxyTarget,
      '/sessions': proxyTarget,
      '/health':   proxyTarget,
    },
  },
});
