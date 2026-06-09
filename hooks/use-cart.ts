'use client'

import { useMemo } from 'react'
import { getCartCount, getCartSummary, useCartStore } from '@/store/cart-store'

export const useCart = () => {
  const lines = useCartStore((s) => s.lines)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const addLine = useCartStore((s) => s.addLine)
  const removeLine = useCartStore((s) => s.removeLine)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount), [lines, couponDiscount])
  const count = useMemo(() => getCartCount(lines), [lines])

  return { lines, addLine, removeLine, updateQuantity, summary, count }
}
