'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, Star } from 'lucide-react'
import { Drawer } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { CartCouponsSection } from '@/modules/shop/components/cart-coupons-section'
import { getCartSummary, useCartStore, getFreeShippingThreshold } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useGstStore } from '@/store/gst-store'
import { useUiStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getLoyaltyAccount } from '@/services/loyalty.service'
import type { CartLine } from '@/types/cart'

const RemovePrompt = ({
  line,
  onKeep,
  onWishlist,
  onRemove,
}: {
  line: CartLine
  onKeep: () => void
  onWishlist: () => void
  onRemove: () => void
}) => (
  <div className="mt-2 rounded-xl border border-rose-100 bg-rose-50 p-2.5 dark:border-rose-900/40 dark:bg-rose-950/20">
    <p className="text-[11px] text-slate-600 dark:text-slate-300">Save to wishlist before removing?</p>
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={onWishlist}
        className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-rose-500"
      >
        <Heart size={9} /> Save to Wishlist
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg border border-slate-300 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300"
      >
        Just Remove
      </button>
      <button
        type="button"
        onClick={onKeep}
        className="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-slate-400 transition hover:text-slate-600"
      >
        Keep
      </button>
    </div>
  </div>
)

export const CartDrawer = () => {
  const open = useUiStore((s) => s.isCartDrawerOpen)
  const setOpen = useUiStore((s) => s.setCartDrawer)
  const lines = useCartStore((s) => s.lines)
  const removeLine = useCartStore((s) => s.removeLine)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const gstRate = useGstStore((s) => s.rate)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount, gstRate), [lines, couponDiscount, gstRate])
  const wishlistAdd = useWishlistStore((s) => s.add)
  const user = useAuthStore((s) => s.user)
  const [loyaltyBalance, setLoyaltyBalance] = useState<number | null>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !open) return
    getLoyaltyAccount().then((a) => setLoyaltyBalance(a.balance)).catch(() => undefined)
  }, [user, open])

  // Reset prompt when drawer closes
  useEffect(() => {
    if (!open) setPendingRemoveId(null)
  }, [open])

  const handleWishlistAndRemove = (line: CartLine) => {
    wishlistAdd(line.productId)
    removeLine(line.lineId)
    setPendingRemoveId(null)
  }

  const itemCount = lines.reduce((a, r) => a + r.quantity, 0)

  return (
    <Drawer open={open} onClose={() => setOpen(false)} title="Mini cart">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.674-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                </svg>
              </div>
              <p className="mb-1 font-semibold text-slate-800 dark:text-slate-200">Your cart is empty</p>
              <p className="mb-5 text-xs text-slate-500">Add items to get started</p>
              <Link
                href="/products"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
              >
                Browse Collection
              </Link>
            </div>
          ) : null}
          {lines.map((line) => (
            <div key={line.lineId} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold">{line.name}</p>
                {pendingRemoveId !== line.lineId && (
                  <button
                    type="button"
                    onClick={() => setPendingRemoveId(line.lineId)}
                    className="rounded-md border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {line.size} · {line.color}
              </p>

              {/* Wishlist prompt */}
              {pendingRemoveId === line.lineId && (
                <RemovePrompt
                  line={line}
                  onKeep={() => setPendingRemoveId(null)}
                  onWishlist={() => handleWishlistAndRemove(line)}
                  onRemove={() => { removeLine(line.lineId); setPendingRemoveId(null) }}
                />
              )}

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
                <span>Rs. {summary.subtotal.toFixed(2)}</span>
              </div>
              {summary.discount > 0 ? (
                <>
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>-Rs. {summary.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>After discount</span>
                    <span>Rs. {(Math.round((summary.subtotal - summary.discount) * 100) / 100).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
              <div className="flex justify-between text-slate-600">
                <span>Shipping</span>
                <span className={summary.shipping === 0 ? 'font-medium text-emerald-600' : ''}>{summary.shipping === 0 ? 'Free' : `Rs. ${summary.shipping.toFixed(2)}`}</span>
              </div>
              {summary.shipping > 0 && getFreeShippingThreshold() > 0 && (
                <p className="text-[10px] text-slate-400">
                  Add Rs. {Math.max(0, getFreeShippingThreshold() - summary.subtotal + summary.discount).toFixed(2)} more for free shipping
                </p>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST ({Math.round(gstRate * 100)}%)</span>
                <span>Rs. {summary.gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-slate-900">
                <span>Total ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
                <span>Rs. {summary.total.toFixed(2)}</span>
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
