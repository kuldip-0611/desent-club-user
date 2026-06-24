'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/storage'
import type { CartLine, CartSummary } from '@/types/cart'
import { getLiveGstRate } from '@/store/gst-store'

type AddLinePayload = Omit<CartLine, 'lineId'>

type CartState = {
  lines: CartLine[]
  couponCode: string | null
  couponDiscount: number
  addLine: (payload: AddLinePayload) => void
  removeLine: (lineId: string) => void
  updateQuantity: (lineId: string, quantity: number) => void
  clear: () => void
  applyCoupon: (code: string, discount: number) => void
  clearCoupon: () => void
  summary: () => CartSummary
  count: () => number
}

/** @deprecated — use useGstStore or getLiveGstRate() instead */
export let LIVE_GST_RATE = 0.18
/** @deprecated — use useGstStore.getState().setRate() instead */
export const setLiveGstRate = (rate: number) => {
  LIVE_GST_RATE = rate
  // also sync to reactive store
  import('@/store/gst-store').then(({ useGstStore }) => useGstStore.getState().setRate(rate))
}

const SHIPPING_FEE = 99

export const getCartCount = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.quantity, 0)

export const getCartCategoryIds = (lines: CartLine[]): string[] =>
  [...new Set(lines.map((line) => line.categoryId).filter((id): id is string => Boolean(id)))]

export const getCartSubtotal = (lines: CartLine[]): number =>
  lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)

export const getCartSummary = (lines: CartLine[], couponDiscount: number, gstRate = getLiveGstRate()): CartSummary => {
  const subtotal = getCartSubtotal(lines)
  const discount = Math.min(Math.max(Math.round(couponDiscount), 0), subtotal)
  const taxable = Math.max(subtotal - discount, 0)
  const shipping = subtotal > 1999 ? 0 : SHIPPING_FEE
  const gst = Math.round(taxable * gstRate)
  const total = taxable + shipping + gst
  return { subtotal, discount, shipping, gst, total }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      couponCode: null,
      couponDiscount: 0,
      addLine: (payload) =>
        set((state) => {
          const found = state.lines.find((line) => line.variantId === payload.variantId)
          if (found) {
            return {
              lines: state.lines.map((line) =>
                line.variantId === payload.variantId
                  ? { ...line, quantity: Math.min(line.quantity + payload.quantity, 10) }
                  : line,
              ),
            }
          }
          return {
            lines: [{ ...payload, lineId: `${payload.variantId}-${Date.now()}` }, ...state.lines],
          }
        }),
      removeLine: (lineId) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.lineId !== lineId),
        })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          lines: state.lines.map((line) =>
            line.lineId === lineId ? { ...line, quantity: Math.max(1, Math.min(quantity, 10)) } : line,
          ),
        })),
      clear: () => set({ lines: [], couponCode: null, couponDiscount: 0 }),
      applyCoupon: (code, discount) => set({ couponCode: code, couponDiscount: discount }),
      clearCoupon: () => set({ couponCode: null, couponDiscount: 0 }),
      count: () => getCartCount(get().lines),
      summary: () => getCartSummary(get().lines, get().couponDiscount),
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lines: state.lines,
        couponCode: state.couponCode,
        couponDiscount: state.couponDiscount,
      }),
    },
  ),
)
