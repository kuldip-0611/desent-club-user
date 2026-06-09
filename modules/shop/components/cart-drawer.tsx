'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { getCartSummary, useCartStore } from '@/store/cart-store'
import { useUiStore } from '@/store/ui-store'

export const CartDrawer = () => {
  const open = useUiStore((s) => s.isCartDrawerOpen)
  const setOpen = useUiStore((s) => s.setCartDrawer)
  const lines = useCartStore((s) => s.lines)
  const removeLine = useCartStore((s) => s.removeLine)
  const couponCode = useCartStore((s) => s.couponCode)
  const summary = useMemo(() => getCartSummary(lines, couponCode), [lines, couponCode])

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Mini cart">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {lines.length === 0 ? <p className="text-sm text-slate-500">Your cart is empty.</p> : null}
          {lines.map((line) => (
            <div key={line.lineId} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{line.name}</p>
                <button
                  type="button"
                  onClick={() => removeLine(line.lineId)}
                  className="rounded-md border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-slate-500">
                {line.size} · {line.color}
              </p>
              <p className="text-xs text-slate-700">
                {line.quantity} x Rs. {line.unitPrice}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-3 border-t border-slate-200 bg-white pt-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium text-slate-600">Items ({lines.reduce((a, r) => a + r.quantity, 0)})</p>
            <p className="text-sm font-semibold text-slate-900">Rs. {summary.total}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/cart" className="flex-1">
              <Button variant="outline" className="w-full">
                View cart
              </Button>
            </Link>
            <Link href="/checkout" className="flex-1">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Checkout</Button>
            </Link>
          </div>
        </div>
      </div>
    </Drawer>
  )
}
