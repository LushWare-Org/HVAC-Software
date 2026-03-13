import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import terminal from 'vite-plugin-terminal'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), terminal()],
  server: {
    port: 5173,
    proxy: {
      // Proxy all /api/* calls to the Nginx gateway (localhost:80)
      // This avoids CORS issues in dev and mirrors the prod setup (Kong)
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
        // No rewrite needed — nginx expects /api/<service>/ prefix
      },
      // Proxy WebSocket to the Nginx gateway → scheduling service
      '/ws': {
        target: 'ws://localhost:80',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress EPIPE / ECONNREFUSED */ });
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', () => { /* suppress write EPIPE on closed WS */ });
          });
        },
      },
    },
  },
})
