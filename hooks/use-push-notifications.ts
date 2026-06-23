'use client'

import { useEffect, useRef, useState } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { saveFcmToken } from '@/services/notification.service'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''

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

async function registerPush(accessToken: string): Promise<boolean> {
  if (!VAPID_KEY) return false
  if (typeof window === 'undefined' || !('Notification' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter((r) => r.active?.scriptURL.includes('/sw.js'))
      .map((r) => r.unregister()),
  )

  const registration =
    (await navigator.serviceWorker.getRegistration('/')) ??
    (await navigator.serviceWorker.register(buildSwUrl(), { scope: '/' }))

  const messaging = getFirebaseMessaging()
  if (!messaging) return false

  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (!token) return false

  await saveFcmToken(token, accessToken)

  onMessage(messaging, (payload) => {
    if (Notification.permission !== 'granted') return
    new Notification(payload.notification?.title ?? 'Disent Club', {
      body: payload.notification?.body ?? '',
      icon: '/icon.png',
    })
  })

  return true
}

export type PushState = 'idle' | 'loading' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const registeredRef = useRef(false)
  const [pushState, setPushState] = useState<PushState>('idle')

  // Detect current browser permission on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushState('unsupported')
      return
    }
    if (Notification.permission === 'granted') setPushState('granted')
    else if (Notification.permission === 'denied') setPushState('denied')
    else setPushState('idle')
  }, [])

  // Auto-prompt: if permission not yet decided, ask after 4s delay once logged in
  // If already granted, silently re-register token
  useEffect(() => {
    if (!user || !accessToken || registeredRef.current) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    const alreadyGranted = Notification.permission === 'granted'

    if (alreadyGranted) {
      registerPush(accessToken)
        .then((ok) => { if (ok) registeredRef.current = true })
        .catch(() => undefined)
      return
    }

    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        registerPush(accessToken)
          .then((ok) => {
            if (ok) {
              registeredRef.current = true
              setPushState('granted')
            } else {
              setPushState(Notification.permission === 'denied' ? 'denied' : 'idle')
            }
          })
          .catch(() => undefined)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [user, accessToken])

  const requestPush = async () => {
    if (!user || !accessToken || registeredRef.current) return
    setPushState('loading')
    try {
      const ok = await registerPush(accessToken)
      if (ok) {
        registeredRef.current = true
        setPushState('granted')
      } else {
        setPushState(Notification.permission === 'denied' ? 'denied' : 'idle')
      }
    } catch {
      setPushState('idle')
    }
  }

  return { pushState, requestPush }
}
