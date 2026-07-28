import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-16.png', 'offline.html', 'logos/shivansh-apple-touch-icon.png', 'logos/shivansh-monochrome-512.png', 'logos/shivansh-monochrome-192.png'],
      manifest: {
        id: '/',
        name: 'Shivansh — Income Tax Officer',
        short_name: 'Shivansh',
        description: 'Personal brand app for Shivansh — Income Tax Officer. Premium learning platform.',
        lang: 'en',
        dir: 'ltr',
        theme_color: '#0B0B0B',
        background_color: '#0B0B0B',
        display: 'standalone',
        display_override: ['fullscreen', 'standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['education', 'productivity'],
        prefer_related_applications: false,
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.shivansh.app',
            id: 'com.shivansh.app',
          },
        ],
        icons: [
          {
            src: '/logos/shivansh-app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logos/shivansh-app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logos/shivansh-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/logos/shivansh-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/logos/shivansh-monochrome-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'monochrome',
          },
          {
            src: '/logos/shivansh-monochrome-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'monochrome',
          },
        ],
        share_target: {
          action: '/share',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
          },
        },
        file_handlers: [
          {
            action: '/open-pdf',
            accept: { 'application/pdf': ['.pdf'] },
          },
        ],
        protocol_handlers: [
          { protocol: 'web+shivansh', url: '/?protocol=%s' },
        ],
        edge_side_panel: { preferred_width: 400 },
        screenshots: [
          {
            src: '/screenshots/home-1080x1920.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Home screen',
          },
          {
            src: '/screenshots/home-wide-1920x1080.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Home screen (desktop)',
          },
        ],
        shortcuts: [
          {
            name: 'Courses',
            short_name: 'Courses',
            description: 'Browse all courses',
            url: '/?source=shortcut',
            icons: [{ src: '/logos/shivansh-app-icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Search',
            short_name: 'Search',
            description: 'Search lectures and chapters',
            url: '/?source=shortcut',
            icons: [{ src: '/logos/shivansh-app-icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Profile',
            short_name: 'Profile',
            description: 'View your study progress',
            url: '/?source=shortcut',
            icons: [{ src: '/logos/shivansh-app-icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        launch_handler: {
          client_mode: ['navigate-existing', 'auto'],
        },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-functions',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 1500 },
});
