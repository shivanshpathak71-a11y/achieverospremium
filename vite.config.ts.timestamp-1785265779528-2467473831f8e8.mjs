// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///home/project/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "favicon-32.png", "favicon-16.png", "offline.html", "logos/shivansh-apple-touch-icon.png", "logos/shivansh-monochrome-512.png", "logos/shivansh-monochrome-192.png"],
      manifest: {
        id: "/",
        name: "Shivansh \u2014 Income Tax Officer",
        short_name: "Shivansh",
        description: "Personal brand app for Shivansh \u2014 Income Tax Officer. Premium learning platform.",
        lang: "en",
        dir: "ltr",
        theme_color: "#0B0B0B",
        background_color: "#0B0B0B",
        display: "standalone",
        display_override: ["fullscreen", "standalone", "minimal-ui"],
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["education", "productivity"],
        prefer_related_applications: false,
        related_applications: [
          {
            platform: "play",
            url: "https://play.google.com/store/apps/details?id=com.shivansh.app",
            id: "com.shivansh.app"
          }
        ],
        icons: [
          {
            src: "/logos/shivansh-app-icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logos/shivansh-app-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/logos/shivansh-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/logos/shivansh-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/logos/shivansh-monochrome-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "monochrome"
          },
          {
            src: "/logos/shivansh-monochrome-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "monochrome"
          }
        ],
        share_target: {
          action: "/share",
          method: "POST",
          enctype: "multipart/form-data",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        },
        file_handlers: [
          {
            action: "/open-pdf",
            accept: { "application/pdf": [".pdf"] }
          }
        ],
        protocol_handlers: [
          { protocol: "web+shivansh", url: "/?protocol=%s" }
        ],
        edge_side_panel: { preferred_width: 400 },
        screenshots: [
          {
            src: "/screenshots/home-1080x1920.png",
            sizes: "1080x1920",
            type: "image/png",
            form_factor: "narrow",
            label: "Home screen"
          },
          {
            src: "/screenshots/home-wide-1920x1080.png",
            sizes: "1920x1080",
            type: "image/png",
            form_factor: "wide",
            label: "Home screen (desktop)"
          }
        ],
        shortcuts: [
          {
            name: "Courses",
            short_name: "Courses",
            description: "Browse all courses",
            url: "/?source=shortcut",
            icons: [{ src: "/logos/shivansh-app-icon-192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Search",
            short_name: "Search",
            description: "Search lectures and chapters",
            url: "/?source=shortcut",
            icons: [{ src: "/logos/shivansh-app-icon-192.png", sizes: "192x192", type: "image/png" }]
          },
          {
            name: "Profile",
            short_name: "Profile",
            description: "View your study progress",
            url: "/?source=shortcut",
            icons: [{ src: "/logos/shivansh-app-icon-192.png", sizes: "192x192", type: "image/png" }]
          }
        ],
        launch_handler: {
          client_mode: ["navigate-existing", "auto"]
        }
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-storage",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/.*$/,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-functions",
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  build: { chunkSizeWarningLimit: 1500 }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgVml0ZVBXQSh7XG4gICAgICBzdHJhdGVnaWVzOiAnaW5qZWN0TWFuaWZlc3QnLFxuICAgICAgc3JjRGlyOiAnc3JjJyxcbiAgICAgIGZpbGVuYW1lOiAnc3cudHMnLFxuICAgICAgcmVnaXN0ZXJUeXBlOiAnYXV0b1VwZGF0ZScsXG4gICAgICBpbmplY3RSZWdpc3RlcjogZmFsc2UsXG4gICAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uc3ZnJywgJ2Zhdmljb24tMzIucG5nJywgJ2Zhdmljb24tMTYucG5nJywgJ29mZmxpbmUuaHRtbCcsICdsb2dvcy9zaGl2YW5zaC1hcHBsZS10b3VjaC1pY29uLnBuZycsICdsb2dvcy9zaGl2YW5zaC1tb25vY2hyb21lLTUxMi5wbmcnLCAnbG9nb3Mvc2hpdmFuc2gtbW9ub2Nocm9tZS0xOTIucG5nJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBpZDogJy8nLFxuICAgICAgICBuYW1lOiAnU2hpdmFuc2ggXHUyMDE0IEluY29tZSBUYXggT2ZmaWNlcicsXG4gICAgICAgIHNob3J0X25hbWU6ICdTaGl2YW5zaCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnUGVyc29uYWwgYnJhbmQgYXBwIGZvciBTaGl2YW5zaCBcdTIwMTQgSW5jb21lIFRheCBPZmZpY2VyLiBQcmVtaXVtIGxlYXJuaW5nIHBsYXRmb3JtLicsXG4gICAgICAgIGxhbmc6ICdlbicsXG4gICAgICAgIGRpcjogJ2x0cicsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzBCMEIwQicsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMEIwQjBCJyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBkaXNwbGF5X292ZXJyaWRlOiBbJ2Z1bGxzY3JlZW4nLCAnc3RhbmRhbG9uZScsICdtaW5pbWFsLXVpJ10sXG4gICAgICAgIG9yaWVudGF0aW9uOiAncG9ydHJhaXQtcHJpbWFyeScsXG4gICAgICAgIHNjb3BlOiAnLycsXG4gICAgICAgIHN0YXJ0X3VybDogJy8nLFxuICAgICAgICBjYXRlZ29yaWVzOiBbJ2VkdWNhdGlvbicsICdwcm9kdWN0aXZpdHknXSxcbiAgICAgICAgcHJlZmVyX3JlbGF0ZWRfYXBwbGljYXRpb25zOiBmYWxzZSxcbiAgICAgICAgcmVsYXRlZF9hcHBsaWNhdGlvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwbGF0Zm9ybTogJ3BsYXknLFxuICAgICAgICAgICAgdXJsOiAnaHR0cHM6Ly9wbGF5Lmdvb2dsZS5jb20vc3RvcmUvYXBwcy9kZXRhaWxzP2lkPWNvbS5zaGl2YW5zaC5hcHAnLFxuICAgICAgICAgICAgaWQ6ICdjb20uc2hpdmFuc2guYXBwJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBpY29uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9sb2dvcy9zaGl2YW5zaC1hcHAtaWNvbi0xOTIucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2xvZ29zL3NoaXZhbnNoLWFwcC1pY29uLTUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvbG9nb3Mvc2hpdmFuc2gtbWFza2FibGUtMTkyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2xvZ29zL3NoaXZhbnNoLW1hc2thYmxlLTUxMi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ21hc2thYmxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9sb2dvcy9zaGl2YW5zaC1tb25vY2hyb21lLTE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ21vbm9jaHJvbWUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2xvZ29zL3NoaXZhbnNoLW1vbm9jaHJvbWUtNTEyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnbW9ub2Nocm9tZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgc2hhcmVfdGFyZ2V0OiB7XG4gICAgICAgICAgYWN0aW9uOiAnL3NoYXJlJyxcbiAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICBlbmN0eXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YScsXG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICB0aXRsZTogJ3RpdGxlJyxcbiAgICAgICAgICAgIHRleHQ6ICd0ZXh0JyxcbiAgICAgICAgICAgIHVybDogJ3VybCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgZmlsZV9oYW5kbGVyczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFjdGlvbjogJy9vcGVuLXBkZicsXG4gICAgICAgICAgICBhY2NlcHQ6IHsgJ2FwcGxpY2F0aW9uL3BkZic6IFsnLnBkZiddIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgcHJvdG9jb2xfaGFuZGxlcnM6IFtcbiAgICAgICAgICB7IHByb3RvY29sOiAnd2ViK3NoaXZhbnNoJywgdXJsOiAnLz9wcm90b2NvbD0lcycgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZWRnZV9zaWRlX3BhbmVsOiB7IHByZWZlcnJlZF93aWR0aDogNDAwIH0sXG4gICAgICAgIHNjcmVlbnNob3RzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL3NjcmVlbnNob3RzL2hvbWUtMTA4MHgxOTIwLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzEwODB4MTkyMCcsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIGZvcm1fZmFjdG9yOiAnbmFycm93JyxcbiAgICAgICAgICAgIGxhYmVsOiAnSG9tZSBzY3JlZW4nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL3NjcmVlbnNob3RzL2hvbWUtd2lkZS0xOTIweDEwODAucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTkyMHgxMDgwJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgZm9ybV9mYWN0b3I6ICd3aWRlJyxcbiAgICAgICAgICAgIGxhYmVsOiAnSG9tZSBzY3JlZW4gKGRlc2t0b3ApJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBzaG9ydGN1dHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnQ291cnNlcycsXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnQ291cnNlcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Jyb3dzZSBhbGwgY291cnNlcycsXG4gICAgICAgICAgICB1cmw6ICcvP3NvdXJjZT1zaG9ydGN1dCcsXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL2xvZ29zL3NoaXZhbnNoLWFwcC1pY29uLTE5Mi5wbmcnLCBzaXplczogJzE5MngxOTInLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdTZWFyY2gnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ1NlYXJjaCcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlYXJjaCBsZWN0dXJlcyBhbmQgY2hhcHRlcnMnLFxuICAgICAgICAgICAgdXJsOiAnLz9zb3VyY2U9c2hvcnRjdXQnLFxuICAgICAgICAgICAgaWNvbnM6IFt7IHNyYzogJy9sb2dvcy9zaGl2YW5zaC1hcHAtaWNvbi0xOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJywgdHlwZTogJ2ltYWdlL3BuZycgfV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnUHJvZmlsZScsXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnUHJvZmlsZScsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1ZpZXcgeW91ciBzdHVkeSBwcm9ncmVzcycsXG4gICAgICAgICAgICB1cmw6ICcvP3NvdXJjZT1zaG9ydGN1dCcsXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL2xvZ29zL3NoaXZhbnNoLWFwcC1pY29uLTE5Mi5wbmcnLCBzaXplczogJzE5MngxOTInLCB0eXBlOiAnaW1hZ2UvcG5nJyB9XSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBsYXVuY2hfaGFuZGxlcjoge1xuICAgICAgICAgIGNsaWVudF9tb2RlOiBbJ25hdmlnYXRlLWV4aXN0aW5nJywgJ2F1dG8nXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxzdmcscG5nLGljbyx3b2ZmMn0nXSxcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAoeyB1cmwgfSkgPT4gdXJsLm9yaWdpbiA9PT0gJ2h0dHBzOi8vZm9udHMuZ29vZ2xlYXBpcy5jb20nLFxuICAgICAgICAgICAgaGFuZGxlcjogJ0NhY2hlRmlyc3QnLFxuICAgICAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgICAgICBjYWNoZU5hbWU6ICdnb29nbGUtZm9udHMtc3R5bGVzaGVldHMnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7IG1heEVudHJpZXM6IDEwLCBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUgfSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHsgc3RhdHVzZXM6IFswLCAyMDBdIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogKHsgdXJsIH0pID0+IHVybC5vcmlnaW4gPT09ICdodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tJyxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnZ29vZ2xlLWZvbnRzLXdlYmZvbnRzJyxcbiAgICAgICAgICAgICAgZXhwaXJhdGlvbjogeyBtYXhFbnRyaWVzOiAzMCwgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzY1IH0sXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7IHN0YXR1c2VzOiBbMCwgMjAwXSB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvLipcXC5zdXBhYmFzZVxcLmNvXFwvc3RvcmFnZVxcLy4qJC8sXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N1cGFiYXNlLXN0b3JhZ2UnLFxuICAgICAgICAgICAgICBleHBpcmF0aW9uOiB7IG1heEVudHJpZXM6IDEwMCwgbWF4QWdlU2Vjb25kczogNjAgKiA2MCAqIDI0ICogMzAgfSxcbiAgICAgICAgICAgICAgY2FjaGVhYmxlUmVzcG9uc2U6IHsgc3RhdHVzZXM6IFswLCAyMDBdIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdXJsUGF0dGVybjogL15odHRwczpcXC9cXC8uKlxcLnN1cGFiYXNlXFwuY29cXC9mdW5jdGlvbnNcXC8uKiQvLFxuICAgICAgICAgICAgaGFuZGxlcjogJ05ldHdvcmtGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ3N1cGFiYXNlLWZ1bmN0aW9ucycsXG4gICAgICAgICAgICAgIG5ldHdvcmtUaW1lb3V0U2Vjb25kczogMTAsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHsgbWF4RW50cmllczogNTAsIG1heEFnZVNlY29uZHM6IDYwICogNjAgKiAyNCB9LFxuICAgICAgICAgICAgICBjYWNoZWFibGVSZXNwb25zZTogeyBzdGF0dXNlczogWzAsIDIwMF0gfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIGJ1aWxkOiB7IGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTUwMCB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sUUFBUTtBQUFBLE1BQ04sWUFBWTtBQUFBLE1BQ1osUUFBUTtBQUFBLE1BQ1IsVUFBVTtBQUFBLE1BQ1YsY0FBYztBQUFBLE1BQ2QsZ0JBQWdCO0FBQUEsTUFDaEIsZUFBZSxDQUFDLGVBQWUsa0JBQWtCLGtCQUFrQixnQkFBZ0IsdUNBQXVDLHFDQUFxQyxtQ0FBbUM7QUFBQSxNQUNsTSxVQUFVO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixZQUFZO0FBQUEsUUFDWixhQUFhO0FBQUEsUUFDYixNQUFNO0FBQUEsUUFDTixLQUFLO0FBQUEsUUFDTCxhQUFhO0FBQUEsUUFDYixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCxrQkFBa0IsQ0FBQyxjQUFjLGNBQWMsWUFBWTtBQUFBLFFBQzNELGFBQWE7QUFBQSxRQUNiLE9BQU87QUFBQSxRQUNQLFdBQVc7QUFBQSxRQUNYLFlBQVksQ0FBQyxhQUFhLGNBQWM7QUFBQSxRQUN4Qyw2QkFBNkI7QUFBQSxRQUM3QixzQkFBc0I7QUFBQSxVQUNwQjtBQUFBLFlBQ0UsVUFBVTtBQUFBLFlBQ1Ys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
