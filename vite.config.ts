import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE_PATH || '/',
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
  }
})
