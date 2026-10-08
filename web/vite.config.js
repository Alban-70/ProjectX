import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // En dev, tout appel à /api/... est redirigé vers l'API Node (pas de souci de CORS)
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
