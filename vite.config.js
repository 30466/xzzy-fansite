import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    proxy: {
      '/pocketapi': {
        target: 'https://pocketapi.48.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pocketapi/, '/live/api/v1/live'),
        headers: {
          'Origin': 'https://h5.48.cn',
          'Referer': 'https://h5.48.cn/'
        }
      },
      '/api': {
        target: 'https://abm48.com',
        changeOrigin: true
      },
      '/cdn': {
        target: 'https://idol-vod.48.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cdn/, ''),
        headers: {
          'Origin': 'https://h5.48.cn',
          'Referer': 'https://h5.48.cn/'
        }
      },
      '/source48': {
        target: 'https://source.48.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/source48/, ''),
        headers: {
          'Referer': 'https://live.48.cn/'
        }
      }
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless'
    }
  }
})
