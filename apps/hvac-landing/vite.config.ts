import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// UI-only marketing site — no backend proxy needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
  },
})
