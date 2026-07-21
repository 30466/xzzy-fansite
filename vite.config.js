import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'GNZ48 徐郑子滢 应援存档站',
        short_name: '徐郑子滢应援站',
        description: 'GNZ48 徐郑子滢个人应援存档站 - 唱歌记录、口袋48录播、B站安利',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        lang: 'zh-CN',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2}'],
        globIgnores: ['**/bg*.jpg', '**/images/election-business/*.jpg'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/i\d\.hdslb\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bili-covers',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 7 }
            }
          }
        ]
      }
    })
  ],
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
      '/upload.php': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
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