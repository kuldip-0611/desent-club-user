import { initializeApp, getApps, getApp } from 'firebase/app'
import { getMessaging, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Prevent duplicate app initialisation in Next.js hot-reload
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig)

let messagingInstance: Messaging | null = null

/** Returns the Messaging instance only in browser environments that support it. */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null
  if (!('Notification' in window)) return null
  if (!messagingInstance) {
    messagingInstance = getMessaging(firebaseApp)
  }
  return messagingInstance
}
