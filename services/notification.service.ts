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

// ─── Notification Inbox ───────────────────────────────────────────────────────

export type AppNotification = {
  id: string
  title: string
  body: string
  type: string
  isRead: boolean
  createdAt: string
  data?: Record<string, unknown> | null
}

export const getNotifications = async (): Promise<AppNotification[]> => {
  const { data } = await apiClient.get<AppNotification[]>('/notifications')
  return data
}

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count')
  return data.count
}

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiClient.patch(`/notifications/${id}/read`)
}

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.patch('/notifications/read-all')
}

export const deleteNotification = async (id: string): Promise<void> => {
  await apiClient.delete(`/notifications/${id}`)
}
