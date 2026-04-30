import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import terminal from 'vite-plugin-terminal'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), terminal()],
  build: {
    // Manual chunking keeps shared vendor deps in long-lived caches. The same
    // hash persists across app deploys as long as the dep versions don't move,
    // so returning users download only the (small) app code on updates.
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — changes almost never
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          // TanStack Query + axios — data-layer, mid-churn
          'vendor-query':    ['@tanstack/react-query', 'axios'],
          // Charts — huge (recharts ~150KB); only loaded by Analytics/Dashboard
          'vendor-charts':   ['recharts'],
          // Calendar — only used on scheduling/dispatch screens
          'vendor-calendar': ['@fullcalendar/core', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          // Maps — only used on dispatch
          'vendor-maps':     ['leaflet', 'react-leaflet'],
          // Icons — lucide-react gets tree-shaken but the tree-shake boundary
          // benefits from a dedicated chunk
          'vendor-icons':    ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
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
