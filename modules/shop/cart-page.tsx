'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CartCouponsSection } from '@/modules/shop/components/cart-coupons-section'
import { getCartSummary, useCartStore } from '@/store/cart-store'
import { useGstStore } from '@/store/gst-store'

export const CartPageModule = () => {
  const lines = useCartStore((s) => s.lines)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeLine = useCartStore((s) => s.removeLine)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const gstRate = useGstStore((s) => s.rate)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount, gstRate), [lines, couponDiscount, gstRate])

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">Your cart</h1>
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 py-20 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.674-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-slate-700 dark:text-slate-300">Your cart is empty</h3>
            <p className="mb-6 max-w-xs text-sm text-slate-500">Looks like you haven&apos;t added anything yet. Browse our collection and find something you&apos;ll love.</p>
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200">
              Browse Collection
            </Link>
          </div>
        ) : null}
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

      {lines.length > 0 && (
        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-semibold">Summary</p>
          <div className="space-y-1 text-sm text-slate-600">
            <p>Subtotal: Rs. {summary.subtotal}</p>
            {summary.discount > 0 ? <p className="text-emerald-700">Discount: -Rs. {summary.discount}</p> : null}
            <p>Shipping: Rs. {summary.shipping}</p>
            <p>GST ({Math.round(gstRate * 100)}%): Rs. {summary.gst}</p>
          </div>
          <p className="border-t border-slate-200 pt-2 text-base font-bold dark:border-slate-700">Total: Rs. {summary.total}</p>
          <CartCouponsSection />
          <Link href="/checkout">
            <Button className="w-full">Proceed to checkout</Button>
          </Link>
        </aside>
      )}
    </main>
  )
}
