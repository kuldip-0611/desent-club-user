'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { CartCouponsSection } from '@/modules/shop/components/cart-coupons-section'
import { getCartSummary, useCartStore } from '@/store/cart-store'
import { useUiStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getLoyaltyAccount } from '@/services/loyalty.service'

export const CartDrawer = () => {
  const open = useUiStore((s) => s.isCartDrawerOpen)
  const setOpen = useUiStore((s) => s.setCartDrawer)
  const lines = useCartStore((s) => s.lines)
  const removeLine = useCartStore((s) => s.removeLine)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount), [lines, couponDiscount])
  const user = useAuthStore((s) => s.user)
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user || !open) return
    getLoyaltyAccount().then((a) => setLoyaltyBalance(a.balance)).catch(() => undefined)
  }, [user, open])

  const itemCount = lines.reduce((a, r) => a + r.quantity, 0)

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Mini cart">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
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
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={line.quantity <= 1}
                    onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    −
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-900">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={line.quantity >= 10}
                    onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  Rs. {line.unitPrice * line.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>

        {lines.length > 0 ? (
          <div className="mt-4 shrink-0 space-y-3 border-t border-slate-200 pt-4">
            {/* Loyalty points hint */}
            {user && loyaltyBalance !== null && (
              <div className="flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-3 py-2">
                <Star className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                <p className="flex-1 text-xs text-yellow-800">
                  {loyaltyBalance > 0
                    ? <><strong>{loyaltyBalance.toLocaleString()} pts</strong> available — apply at checkout for a discount</>
                    : <>Earn loyalty points on every order</>
                  }
                </p>
              </div>
            )}

            <CartCouponsSection compact />

            <div className="space-y-1 rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>Rs. {summary.subtotal}</span>
              </div>
              {summary.discount > 0 ? (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-Rs. {summary.discount}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>After discount</span>
                    <span>Rs. {summary.subtotal - summary.discount}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span>{summary.shipping === 0 ? 'Free' : `Rs. ${summary.shipping}`}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span>Rs. {summary.gst}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                <span>Total ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
                <span>Rs. {summary.total}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pb-1">
              <Link href="/cart" onClick={() => setOpen(false)} className="min-w-0">
                <Button variant="outline" className="h-11 w-full">
                  View cart
                </Button>
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="min-w-0">
                <Button className="h-11 w-full bg-slate-900 hover:bg-slate-700">Checkout</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </Drawer>
  )
}
