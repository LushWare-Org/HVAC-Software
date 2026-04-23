import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import terminal from 'vite-plugin-terminal'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), terminal()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
      '/revenue-agent-api': {
        target: 'http://127.0.0.1:8765',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/revenue-agent-api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:80',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', () => { /* suppress EPIPE / ECONNREFUSED */ })
          proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
            socket.on('error', () => { /* suppress write EPIPE on closed WS */ })
          })
        },
      },
    },
  },
})
