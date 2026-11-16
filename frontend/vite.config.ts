import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@/lib/api` instead of `../../lib/api`
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5174,
    // The browser calls /api/... on :5173 and Vite forwards it to FastAPI on :8001.
    // Same relative URLs work in production behind a reverse proxy, and no CORS issues.
    proxy: { '/api': 'http://localhost:8001' },
  },
})
