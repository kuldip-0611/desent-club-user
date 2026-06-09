'use client'

import { useEffect, useRef } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { saveFcmToken } from '@/services/notification.service'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''

/** Builds the service worker URL with Firebase config as query params so the SW can initialise Firebase. */
function buildSwUrl(): string {
  const params = new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const registeredRef = useRef(false)

  useEffect(() => {
    // Only run in browser, only when logged in, only once per session
    if (!user || !accessToken || registeredRef.current) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    async function register() {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        // Register the service worker (passes config via query-string)
        const registration = await navigator.serviceWorker.register(buildSwUrl(), {
          scope: '/',
        })

        const messaging = getFirebaseMessaging()
        if (!messaging) return

        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: registration,
        })

        if (!token) return

        // Send token to backend
        await saveFcmToken(token, accessToken!)
        registeredRef.current = true

        // Handle foreground messages (app is open)
        onMessage(messaging, (payload) => {
          const title = payload.notification?.title ?? 'Desent Club'
          const body = payload.notification?.body ?? ''
          // Show a native notification even when the app is open
          if (Notification.permission === 'granted') {
            new Notification(title, {
              body,
              icon: '/icon.png',
            })
          }
        })
      } catch (err) {
        console.error('[FCM] Failed to register push notifications:', err)
      }
    }

    register()
  }, [user, accessToken])
}
