importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

// These values are injected at runtime via the service worker registration.
// We read them from the URL query-string that the registration passes.
const urlParams = new URLSearchParams(location.search)

firebase.initializeApp({
  apiKey: urlParams.get('apiKey'),
  authDomain: urlParams.get('authDomain'),
  projectId: urlParams.get('projectId'),
  storageBucket: urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId: urlParams.get('appId'),
})

const messaging = firebase.messaging()

// Handle background messages (app is not in focus)
messaging.onBackgroundMessage((payload) => {
  const { title = 'Disent Club', body = '' } = payload.notification ?? {}
  self.registration.showNotification(title, {
    body,
    icon: '/icon.png',
    badge: '/icon.png',
    data: payload.data ?? {},
  })
})

// Open the app when user clicks the notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus()
          }
        }
        return clients.openWindow('/')
      }),
  )
})
