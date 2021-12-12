import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import analyze from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      plugins: [analyze()]
    }
  }
})
