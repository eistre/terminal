import { fileURLToPath, URL } from 'url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
require('dotenv').config();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  //Because on WSL2. Otherwise the hmr doens't work.
  server: {
    host: process.env.VITE_HOST,
    port: 80,
    watch: {
      usePolling: true,
    }
  },
})
