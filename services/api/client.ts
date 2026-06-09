import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { STORAGE_KEYS } from '@/constants/storage'
import { applyAuthSession } from '@/lib/auth-session'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let refreshPromise: Promise<string | null> | null = null

const refreshAccessToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') return null

  const refreshToken = window.localStorage.getItem(STORAGE_KEYS.refreshToken)
  if (!refreshToken) return null

  const { data } = await axios.post<{
    accessToken: string
    refreshToken: string
    user: unknown
  }>(`${API_BASE_URL}/auth/refresh`, { refreshToken })

  applyAuthSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user as never,
  })

  const { useAuthStore } = await import('@/store/auth-store')
  useAuthStore.getState().setAuthResponse({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user as never,
  })

  return data.accessToken
}

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem(STORAGE_KEYS.authToken)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ message?: string }>) => {
    const originalRequest = error.config as RetryConfig | undefined
    const status = error.response?.status
    const isAuthRefreshCall = originalRequest?.url?.includes('/auth/refresh')

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefreshCall &&
      typeof window !== 'undefined'
    ) {
      originalRequest._retry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        const newToken = await refreshPromise
        if (!newToken) {
          throw new Error('Session expired')
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return apiClient(originalRequest)
      } catch {
        window.localStorage.removeItem(STORAGE_KEYS.authToken)
        window.localStorage.removeItem(STORAGE_KEYS.refreshToken)
      }
    }

    const message = error.response?.data?.message || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  },
)
