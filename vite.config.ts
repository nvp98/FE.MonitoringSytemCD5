import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['tslib', 'react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['echarts', 'echarts-for-react'],
  },
  server: {
    port: 5173,
    host: true,
  },
})
