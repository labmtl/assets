import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    proxy: {
      '/processed_media': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
