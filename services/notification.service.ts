import { apiClient } from './api/client'

/**
 * Saves (or updates) the FCM registration token for the currently logged-in user.
 */
export async function saveFcmToken(token: string, accessToken: string): Promise<void> {
  await apiClient.post(
    '/users/me/fcm-token',
    { token },
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
}
