importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// ── Firebase config (public keys — safe to hardcode in SW) ───────────────────
firebase.initializeApp({
  apiKey: 'AIzaSyB_QXLHIhhPg2s4of7OhvptEAoXnXDrsG8',
  authDomain: 'disent-club.firebaseapp.com',
  projectId: 'disent-club',
  storageBucket: 'disent-club.firebasestorage.app',
  messagingSenderId: '456957672879',
  appId: '1:456957672879:web:8100fe7e3c961f785c835a',
})

const messaging = firebase.messaging()

// Handle background messages (app not in foreground)
messaging.onBackgroundMessage((payload) => {
  const { title = 'Disent Club', body = '' } = payload.notification ?? {}
  const link = payload.data?.link ?? '/'

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    data: { link, ...(payload.data ?? {}) },
    requireInteraction: false,
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const link = event.notification.data?.link ?? '/'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow(link)
      })
  )
})

// ── Cache ────────────────────────────────────────────────────────────────────
const CACHE_NAME = 'desent-club-v4'
const STATIC_ASSETS = ['/', '/products', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('localhost:3001') ||
    event.request.url.includes('api-dev.disentclub.com')
  ) return
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
