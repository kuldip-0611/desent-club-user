'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartCouponsSection } from '@/modules/shop/components/cart-coupons-section'
import { getCartSummary, useCartStore } from '@/store/cart-store'

export const CartPageModule = () => {
  const lines = useCartStore((s) => s.lines)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeLine = useCartStore((s) => s.removeLine)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount), [lines, couponDiscount])

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Your cart</h1>
        {lines.length === 0 ? <p className="text-sm text-slate-500">Cart is empty.</p> : null}
        {lines.map((line) => (
          <article key={line.lineId} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{line.name}</p>
                <p className="text-xs text-slate-500">
                  {line.size} · {line.color}
                </p>
              </div>
              <button onClick={() => removeLine(line.lineId)} className="text-xs text-rose-600">
                Remove
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Input
                type="number"
                min={1}
                max={10}
                value={line.quantity}
                onChange={(e) => updateQuantity(line.lineId, Number(e.target.value))}
                className="w-24"
              />
              <p className="font-semibold">Rs. {line.unitPrice * line.quantity}</p>
            </div>
          </article>
        ))}
      </section>

      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-lg font-semibold">Summary</p>
        <div className="space-y-1 text-sm text-slate-600">
          <p>Subtotal: Rs. {summary.subtotal}</p>
          {summary.discount > 0 ? <p className="text-emerald-700">Discount: -Rs. {summary.discount}</p> : null}
          <p>Shipping: Rs. {summary.shipping}</p>
          <p>GST: Rs. {summary.gst}</p>
        </div>
        <p className="border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700">Total: Rs. {summary.total}</p>
        <CartCouponsSection />
        <Link href="/checkout">
          <Button className="w-full">Proceed to checkout</Button>
        </Link>
      </aside>
    </main>
  )
}
