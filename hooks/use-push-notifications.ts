'use client'

import { useEffect, useRef, useState } from 'react'
import { getToken, onMessage } from 'firebase/messaging'
import { getFirebaseMessaging } from '@/lib/firebase'
import { useAuthStore } from '@/store/auth-store'
import { saveFcmToken } from '@/services/notification.service'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ?? ''

/**
 * Wait for the NEWEST SW in the registration to activate.
 * When update() is called, reg.active = old SW and reg.installing = new SW.
 * We must wait for the new one — not return early on the old active SW.
 */
function waitForActive(reg: ServiceWorkerRegistration): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve) => {
    const newSw = reg.installing ?? reg.waiting
    if (!newSw) {
      // Nothing pending — current active SW is the one to use
      resolve(reg)
      return
    }
    const onStateChange = () => {
      if (newSw.state === 'activated') {
        newSw.removeEventListener('statechange', onStateChange)
        resolve(reg)
      }
    }
    newSw.addEventListener('statechange', onStateChange)
    setTimeout(() => resolve(reg), 10_000)
  })
}

async function registerPush(accessToken: string): Promise<boolean> {
  if (!VAPID_KEY) { console.warn('[FCM] VAPID key not set'); return false }
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false
  if (!('Notification' in window)) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') { console.log('[FCM] Permission not granted:', permission); return false }

  // Unregister ALL service workers and re-register fresh — clears stale push subscriptions
  const allRegs = await navigator.serviceWorker.getRegistrations()
  await Promise.all(allRegs.map((r) => r.unregister()))
  console.log('[FCM] Unregistered', allRegs.length, 'existing SW(s)')

  // Clear Firebase FCM IndexedDB to avoid stale token state
  try {
    await new Promise<void>((res, rej) => {
      const req = indexedDB.deleteDatabase('firebase-messaging-database')
      req.onsuccess = () => res()
      req.onerror = () => rej(req.error)
      req.onblocked = () => res() // proceed even if blocked
    })
    console.log('[FCM] Cleared firebase-messaging-database')
  } catch {
    // best effort
  }

  // Register sw.js fresh
  let reg = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })

  // Wait for the new SW to fully activate
  reg = await waitForActive(reg)
  console.log('[FCM] SW active:', reg.active?.scriptURL)

  const messaging = getFirebaseMessaging()
  if (!messaging) { console.warn('[FCM] Firebase messaging not available'); return false }

  let token: string
  try {
    token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: reg,
    })
  } catch (err) {
    console.error('[FCM] getToken() failed:', err)
    return false
  }

  if (!token) { console.warn('[FCM] getToken() returned empty token'); return false }

  console.log('[FCM] Token obtained, saving…', token.slice(-12))
  await saveFcmToken(token, accessToken)
  console.log('[FCM] Token saved to backend ✓')

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

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushState('unsupported'); return
    }
    if (Notification.permission === 'granted') setPushState('granted')
    else if (Notification.permission === 'denied') setPushState('denied')
    else setPushState('idle')
  }, [])

  useEffect(() => {
    if (!user || !accessToken || registeredRef.current) return
    if (typeof window === 'undefined' || !('Notification' in window)) return

    if (Notification.permission === 'granted') {
      registerPush(accessToken)
        .then((ok) => { if (ok) registeredRef.current = true })
        .catch((e) => console.error('[FCM] Auto re-register failed:', e))
      return
    }

    if (Notification.permission === 'default') {
      const timer = setTimeout(() => {
        registerPush(accessToken)
          .then((ok) => {
            if (ok) { registeredRef.current = true; setPushState('granted') }
            else setPushState(Notification.permission === 'denied' ? 'denied' : 'idle')
          })
          .catch((e) => { console.error('[FCM] Auto-prompt failed:', e); setPushState('idle') })
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [user, accessToken])

  const requestPush = async () => {
    if (!accessToken || registeredRef.current) return
    setPushState('loading')
    try {
      const ok = await registerPush(accessToken)
      if (ok) { registeredRef.current = true; setPushState('granted') }
      else setPushState(Notification.permission === 'denied' ? 'denied' : 'idle')
    } catch (e) {
      console.error('[FCM] Manual request failed:', e)
      setPushState('idle')
    }
  }

  return { pushState, requestPush }
}
