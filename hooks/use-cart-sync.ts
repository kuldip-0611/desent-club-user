'use client'

import { useEffect, useRef } from 'react'
import { useCartStore } from '@/store/cart-store'
import { useAuthStore } from '@/store/auth-store'
import { apiClient } from '@/services/api/client'

/**
 * Silently persists the cart to the backend whenever it changes (debounced 3s).
 * Only runs for logged-in users. Used for abandoned-cart recovery emails.
 */
export const useCartSync = () => {
  const lines = useCartStore((s) => s.lines)
  const user = useAuthStore((s) => s.user)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      const items = lines.map((l) => ({
        productId: l.productId,
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        image: typeof l.image === 'string' ? l.image : (l.image as any)?.path ?? null,
        size: l.size,
        color: l.color,
      }))

      apiClient.post('/cart/save', { items }).catch(() => undefined)
    }, 3000) // debounce 3s to avoid spamming on rapid add/remove

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [lines, user])
}
