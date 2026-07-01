'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CartLine, CartSummary } from '@/types/cart'
import { getLiveGstRate } from '@/store/gst-store'
import { apiClient } from '@/services/api/client'
import { STORAGE_KEYS } from '@/constants/storage'

type AddLinePayload = Omit<CartLine, 'lineId'>

type CartState = {
  lines: CartLine[]
  couponCode: string | null
  couponDiscount: number
  loading: boolean
  // Gift card
  giftCardApplied: { code: string; balance: number } | null
  // Loyalty
  loyaltyApplied: boolean
  addLine: (payload: AddLinePayload) => void
  removeLine: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  applyCoupon: (code: string, discount: number) => void
  clearCoupon: () => void
  applyGiftCard: (code: string, balance: number) => void
  removeGiftCard: () => void
  setLoyaltyApplied: (v: boolean) => void
  summary: () => CartSummary
  count: () => number
  loadFromServer: () => Promise<void>
}

/** @deprecated — use useGstStore or getLiveGstRate() instead */
export let LIVE_GST_RATE = 0.18
/** @deprecated — use useGstStore.getState().setRate() instead */
export const setLiveGstRate = (rate: number) => {
  LIVE_GST_RATE = rate
  import('@/store/gst-store').then(({ useGstStore }) => useGstStore.getState().setRate(rate))
}

let _freeShippingThreshold = 999
let _shippingFee = 99
export const setShippingConfig = (threshold: number, fee: number) => {
  _freeShippingThreshold = threshold
  _shippingFee = fee
}
export const getLiveShippingFee = (subtotal: number): number =>
  _freeShippingThreshold > 0 && subtotal >= _freeShippingThreshold ? 0 : _shippingFee
export const getFreeShippingThreshold = () => _freeShippingThreshold
export const getShippingFee = () => _shippingFee

export const getCartCount = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.quantity, 0)

export const getCartCategoryIds = (lines: CartLine[]): string[] =>
  [...new Set(lines.map((line) => line.categoryId).filter((id): id is string => Boolean(id)))]

export const getCartSubtotal = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

const r2 = (n: number) => Math.round(n * 100) / 100

export const getCartSummary = (lines: CartLine[], couponDiscount: number, gstRate = getLiveGstRate()): CartSummary => {
  const subtotal = r2(getCartSubtotal(lines))
  const discount = r2(Math.min(Math.max(couponDiscount, 0), subtotal))
  const taxable = r2(Math.max(subtotal - discount, 0))
  const shipping = getLiveShippingFee(subtotal - discount)
  const gst = r2(taxable * gstRate)
  const total = r2(taxable + shipping + gst)
  return { subtotal, discount, shipping, gst, total }
}

// Only sync to server when the user is authenticated
const isAuthenticated = () => {
  if (typeof window === 'undefined') return false
  return !!window.localStorage.getItem(STORAGE_KEYS.authToken)
}

// Debounced server sync — fires 600ms after last mutation (skipped for guests)
let _syncTimer: ReturnType<typeof setTimeout> | null = null
let _pendingGetState: (() => CartState) | null = null

const scheduleSync = (getState: () => CartState) => {
  if (!isAuthenticated()) return
  _pendingGetState = getState
  if (_syncTimer) clearTimeout(_syncTimer)
  _syncTimer = setTimeout(() => {
    _syncTimer = null
    _pendingGetState = null
    const { lines, couponCode, couponDiscount } = getState()
    apiClient
      .post('/cart/save', { lines, couponCode, couponDiscount })
      .catch(() => undefined)
  }, 600)
}

/** Flush any pending debounced sync immediately (call before loadFromServer). */
export const flushCartSync = () => {
  if (_syncTimer && _pendingGetState) {
    clearTimeout(_syncTimer)
    _syncTimer = null
    const getState = _pendingGetState
    _pendingGetState = null
    const { lines, couponCode, couponDiscount } = getState()
    apiClient
      .post('/cart/save', { lines, couponCode, couponDiscount })
      .catch(() => undefined)
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      couponDiscount: 0,
      loading: false,
      giftCardApplied: null,
      loyaltyApplied: false,

      addLine: (payload) => {
        set((state) => {
          const found = state.lines.find((l) => l.variantId === payload.variantId)
          if (found) {
            return {
              lines: state.lines.map((l) =>
                l.variantId === payload.variantId
                  ? { ...l, quantity: Math.min(l.quantity + payload.quantity, 10) }
                  : l,
              ),
            }
          }
          return {
            lines: [{ ...payload, lineId: `${payload.variantId}-${Date.now()}` }, ...state.lines],
          }
        })
        scheduleSync(get)
      },

      removeLine: (lineId) => {
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) }))
        scheduleSync(get)
      },

      updateQuantity: (lineId, quantity) => {
        set((state) => ({
          lines: state.lines.map((l) =>
            l.lineId === lineId ? { ...l, quantity: Math.max(1, Math.min(quantity, 10)) } : l,
          ),
        }))
        scheduleSync(get)
      },

      clear: () => {
        set({ lines: [], couponCode: null, couponDiscount: 0, giftCardApplied: null, loyaltyApplied: false })
        if (isAuthenticated()) {
          apiClient.post('/cart/save', { lines: [], couponCode: null, couponDiscount: 0 }).catch(() => undefined)
        }
      },

      applyCoupon: (code, discount) => {
        set({ couponCode: code, couponDiscount: discount })
        scheduleSync(get)
      },

      clearCoupon: () => {
        set({ couponCode: null, couponDiscount: 0 })
        scheduleSync(get)
      },

      applyGiftCard: (code, balance) => set({ giftCardApplied: { code, balance } }),
      removeGiftCard: () => set({ giftCardApplied: null }),
      setLoyaltyApplied: (v) => set({ loyaltyApplied: v }),

      count: () => getCartCount(get().lines),
      summary: () => getCartSummary(get().lines, get().couponDiscount),

      loadFromServer: async () => {
        set({ loading: true })
        try {
          const { data } = await apiClient.get<{
            lines: CartLine[]
            couponCode: string | null
            couponDiscount: number
          }>('/cart')
          set({
            lines: data.lines ?? [],
            couponCode: data.couponCode ?? null,
            couponDiscount: data.couponDiscount ?? 0,
          })
        } catch {
          // Not authenticated or network error — keep current state
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: createJSONStorage(() => localStorage),
      // Only persist cart lines — not loading/transient state
      partialize: (state) => ({
        lines: state.lines,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
        giftCardApplied: state.giftCardApplied,
        loyaltyApplied: state.loyaltyApplied,
      }),
      // Skip auto-hydration on store creation — prevents SSR/client race condition
      // where Next.js App Router mounts client components before persist can read
      // from localStorage. We call rehydrate() explicitly in StoreInitializer.
      skipHydration: true,
    },
  ),
)
