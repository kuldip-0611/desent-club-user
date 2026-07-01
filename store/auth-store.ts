'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/storage'
import { applyAuthSession, clearAuthSession, getStoredAuthUser } from '@/lib/auth-session'
import { logoutSession } from '@/services/auth.service'
import type { AuthTokensResponse, AuthUser } from '@/types/auth'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuthResponse: (response: AuthTokensResponse) => void
  logout: () => Promise<void>
  syncFromStorage: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuthResponse: (response) => {
        applyAuthSession(response)
        set({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: response.user,
        })
        // Merge guest cart into server cart, then load server state
        import('@/store/cart-store').then(({ useCartStore }) => {
          const guestLines = [...useCartStore.getState().lines]
          useCartStore.getState().loadFromServer().then(() => {
            if (guestLines.length > 0) {
              const serverVariantIds = new Set(
                useCartStore.getState().lines.map((l) => l.variantId),
              )
              guestLines
                .filter((l) => !serverVariantIds.has(l.variantId))
                .forEach((l) => useCartStore.getState().addLine(l))
            }
            // Remove guest cart from localStorage — server is now the source of truth
            if (typeof window !== 'undefined') {
              localStorage.removeItem(STORAGE_KEYS.cart)
            }
          }).catch(() => undefined)
        })
        import('@/store/wishlist-store').then(({ useWishlistStore }) => {
          useWishlistStore.getState().syncFromServer().catch(() => undefined)
        })
      },
      logout: async () => {
        try {
          await logoutSession()
        } catch {
          // Clear local session even if the server logout fails (expired token, offline, etc.)
        }
        clearAuthSession()
        set({ accessToken: null, refreshToken: null, user: null })
        // Clear cart and wishlist — both memory and localStorage
        import('@/store/cart-store').then(({ useCartStore }) => {
          useCartStore.setState({ lines: [], couponCode: null, couponDiscount: 0 })
          if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.cart)
        })
        import('@/store/wishlist-store').then(({ useWishlistStore }) => {
          useWishlistStore.setState({ productIds: [] })
        })
      },
      syncFromStorage: () => {
        const user = getStoredAuthUser()
        if (!user) return
        set({
          user,
          accessToken: typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.authToken) : null,
          refreshToken: typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEYS.refreshToken) : null,
        })
      },
    }),
    {
      name: STORAGE_KEYS.authUser,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state?.accessToken || typeof window === 'undefined') return
        window.localStorage.setItem(STORAGE_KEYS.authToken, state.accessToken)
        if (state.refreshToken) {
          window.localStorage.setItem(STORAGE_KEYS.refreshToken, state.refreshToken)
        }
        document.cookie = `${STORAGE_KEYS.authToken}=${state.accessToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
      },
    },
  ),
)
