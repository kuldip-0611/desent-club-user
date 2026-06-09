import { STORAGE_KEYS } from '@/constants/storage'
import type { AuthTokensResponse, AuthUser, OtpContext } from '@/types/auth'

const cookieMaxAgeSeconds = 60 * 60 * 24 * 7

export const mapAuthUser = (user: AuthTokensResponse['user']): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  role: user.role,
  isVerified: user.isVerified,
  provider: user.provider,
})

export const applyAuthSession = (response: AuthTokensResponse): void => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEYS.authToken, response.accessToken)
  window.localStorage.setItem(STORAGE_KEYS.refreshToken, response.refreshToken)
  document.cookie = `${STORAGE_KEYS.authToken}=${response.accessToken}; path=/; max-age=${cookieMaxAgeSeconds}; SameSite=Lax`
}

export const clearAuthSession = (): void => {
  if (typeof window === 'undefined') return

  window.localStorage.removeItem(STORAGE_KEYS.authToken)
  window.localStorage.removeItem(STORAGE_KEYS.refreshToken)
  window.localStorage.removeItem(STORAGE_KEYS.authUser)
  document.cookie = `${STORAGE_KEYS.authToken}=; path=/; max-age=0; SameSite=Lax`
}

export const getStoredAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEYS.authToken)
}

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(STORAGE_KEYS.refreshToken)
}

export const getStoredAuthUser = (): AuthUser | null => {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEYS.authUser)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as { state?: { user?: AuthUser } } | AuthUser
    if (parsed && typeof parsed === 'object' && 'state' in parsed && parsed.state?.user) {
      return parsed.state.user
    }
    return parsed as AuthUser
  } catch {
    return null
  }
}

export const setOtpContext = (context: OtpContext): void => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEYS.otpContext, JSON.stringify(context))
}

export const getOtpContext = (): OtpContext | null => {
  if (typeof window === 'undefined') return null

  const raw = window.localStorage.getItem(STORAGE_KEYS.otpContext)
  if (!raw) return null

  try {
    return JSON.parse(raw) as OtpContext
  } catch {
    return null
  }
}

export const clearOtpContext = (): void => {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(STORAGE_KEYS.otpContext)
}
