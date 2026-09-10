/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals, @typescript-eslint/no-explicit-any */

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST?: unknown };

const STATIC_CACHE = 'shivansh-v2-static';
const RUNTIME_CACHE = 'shivansh-v2-runtime';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS: string[] = ((self.__WB_MANIFEST as Array<{ url: string } | string> | undefined) || []).map((entry) =>
  typeof entry === 'string' ? entry : entry.url
);

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys: string[]) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.origin.startsWith('http')) return;
  // Let cross-origin requests (iframes, CDN assets, etc.) bypass the SW so the
  // browser handles them directly — intercepting them yields opaque responses
  // that the browser refuses to render in iframes.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response: Response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)).then((r) => r || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached: Response | undefined) => {
      if (cached) return cached;
      return fetch(request).then((response: Response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});

// Background Sync
self.addEventListener('sync', ((event: any) => {
  if (event.tag === 'shivansh-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients: readonly Client[]) =>
        clients.forEach((client: Client) => client.postMessage({ type: 'BACKGROUND_SYNC' }))
      )
    );
  }
}) as EventListener);

// Push Notifications
self.addEventListener('push', (event: PushEvent) => {
  let data: { title: string; body: string; url?: string } = { title: 'Shivansh', body: 'You have a new update.' };
  try {
    if (event.data) data = event.data.json();
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options: NotificationOptions = {
    body: data.body,
    icon: '/logos/shivansh-app-icon-192.png',
    badge: '/logos/shivansh-app-icon-192.png',
    data: { url: data.url || '/' } as unknown as NotificationOptions['data'],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl = (event.notification.data && (event.notification.data as { url?: string }).url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients: readonly WindowClient[]) => {
      const existing = clients.find((c: WindowClient) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

// Periodic Background Sync
self.addEventListener('periodicsync', ((event: any) => {
  if (event.tag === 'shivansh-content-sync') {
    event.waitUntil(
      self.clients.matchAll().then((clients: readonly Client[]) =>
        clients.forEach((client: Client) => client.postMessage({ type: 'PERIODIC_SYNC' }))
      )
    );
  }
}) as EventListener);
