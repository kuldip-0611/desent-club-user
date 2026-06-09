'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { getCartSummary, useCartStore } from '@/store/cart-store'

export const CheckoutPageModule = () => {
  const { requireAuth } = useAuthGuard()
  const lines = useCartStore((s) => s.lines)
  const couponCode = useCartStore((s) => s.couponCode)
  const summary = useMemo(() => getCartSummary(lines, couponCode), [lines, couponCode])

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-slate-500">Authentication is required only when placing the order.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input placeholder="Full name" />
          <Input placeholder="Phone" />
          <Input placeholder="Pincode" />
          <Input placeholder="City" />
          <Input placeholder="State" />
          <Input placeholder="Country" />
        </div>
        <Input placeholder="Address line" />
        <div className="grid gap-3 sm:grid-cols-3">
          <button className="rounded-xl border border-slate-300 p-3 text-sm font-medium">UPI</button>
          <button className="rounded-xl border border-slate-300 p-3 text-sm font-medium">Card</button>
          <button className="rounded-xl border border-slate-300 p-3 text-sm font-medium">Cash on delivery</button>
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-semibold">Order summary</p>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>Subtotal: Rs. {summary.subtotal}</p>
          <p>Shipping: Rs. {summary.shipping}</p>
          <p>GST: Rs. {summary.gst}</p>
        </div>
        <p className="mt-3 border-t border-slate-200 pt-2 text-base font-bold">Payable: Rs. {summary.total}</p>
        <Button className="mt-3 w-full" onClick={() => requireAuth(() => {})}>
          Place order
        </Button>
      </aside>
    </main>
  )
}
