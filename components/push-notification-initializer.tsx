'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'

/**
 * Invisible component — mounts in the root layout to initialise
 * Firebase web push notifications once the user is logged in.
 */
export function PushNotificationInitializer() {
  usePushNotifications()
  return null
}
