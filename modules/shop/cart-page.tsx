'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Heart, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Tag, Truck, ShieldCheck, Gift, Star, Zap, X, RotateCcw, CreditCard, Headphones, BadgeCheck } from 'lucide-react'
import { CartCouponsSection } from '@/modules/shop/components/cart-coupons-section'
import { getCartSummary, getFreeShippingThreshold, getShippingFee, useCartStore } from '@/store/cart-store'
import { useWishlistStore } from '@/store/wishlist-store'
import { useGstStore } from '@/store/gst-store'
import { useAuthStore } from '@/store/auth-store'
import { checkCartBundle, type CartBundleResult } from '@/services/bundle.service'
import { getLoyaltyAccount, getLoyaltyRules, type LoyaltyAccount, type LoyaltyRules } from '@/services/loyalty.service'
import { apiClient } from '@/services/api/client'
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
  <div className="flex flex-col gap-1.5 rounded-xl border border-rose-100 bg-rose-50 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
      Remove <span className="text-slate-900 dark:text-white">{line.name}</span>?
    </p>
    <p className="text-[11px] text-slate-500 dark:text-slate-400">Save it to your wishlist before removing?</p>
    <div className="mt-1 flex flex-wrap gap-2">
      <button type="button" onClick={onWishlist} className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-rose-500">
        <Heart size={11} /> Save to Wishlist
      </button>
      <button type="button" onClick={onRemove} className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800">
        Just Remove
      </button>
      <button type="button" onClick={onKeep} className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200">
        Keep
      </button>
    </div>
  </div>
)

export const CartPageModule = () => {
  const lines = useCartStore((s) => s.lines)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeLine = useCartStore((s) => s.removeLine)
  const clearCart = useCartStore((s) => s.clear)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const giftCardApplied = useCartStore((s) => s.giftCardApplied)
  const applyGiftCard = useCartStore((s) => s.applyGiftCard)
  const removeGiftCard = useCartStore((s) => s.removeGiftCard)
  const loyaltyApplied = useCartStore((s) => s.loyaltyApplied)
  const setLoyaltyApplied = useCartStore((s) => s.setLoyaltyApplied)
  const gstRate = useGstStore((s) => s.rate)
  const wishlistAdd = useWishlistStore((s) => s.add)
  const user = useAuthStore((s) => s.user)

  const summary = useMemo(() => getCartSummary(lines, couponDiscount, gstRate), [lines, couponDiscount, gstRate])
  const [bundleDeal, setBundleDeal] = useState<CartBundleResult>(null)
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Gift card input state
  const [giftCardInput, setGiftCardInput] = useState('')
  const [giftCardChecking, setGiftCardChecking] = useState(false)

  // Loyalty state
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null)
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRules | null>(null)
  const [loyaltyLoading, setLoyaltyLoading] = useState(false)

  const productIds = useMemo(() => lines.map((l) => l.productId), [lines])
  useEffect(() => {
    if (!productIds.length) { setBundleDeal(null); return }
    checkCartBundle(productIds).then(setBundleDeal)
  }, [productIds.join(',')])

  useEffect(() => {
    if (!user) return
    setLoyaltyLoading(true)
    Promise.allSettled([getLoyaltyAccount(), getLoyaltyRules()]).then(([acct, rules]) => {
      if (acct.status === 'fulfilled') setLoyaltyAccount(acct.value)
      if (rules.status === 'fulfilled') setLoyaltyRules(rules.value)
      setLoyaltyLoading(false)
    })
  }, [user])

  // Loyalty discount calculation
  const loyaltyBalance = loyaltyAccount?.balance ?? 0
  const minPoints = loyaltyRules?.minRedeemPoints ?? 100
  const rupeePerPoint = loyaltyRules?.rupeePerPoint ?? 0.25
  const maxRedeemPercent = loyaltyRules?.maxRedeemPercent ?? 20
  const canUseLoyalty = loyaltyBalance >= minPoints

  const maxLoyaltyDiscount = (summary.total * maxRedeemPercent) / 100
  const potentialLoyaltyDiscount = loyaltyBalance * rupeePerPoint
  const loyaltyDiscountAmount = loyaltyApplied
    ? Math.min(potentialLoyaltyDiscount, maxLoyaltyDiscount, summary.total)
    : 0

  // Gift card discount
  const afterLoyalty = Math.max(summary.total - loyaltyDiscountAmount, 0)
  const giftCardToApply = giftCardApplied ? Math.min(giftCardApplied.balance, afterLoyalty) : 0
  const grandTotal = Math.max(afterLoyalty - giftCardToApply, 0)

  const freeShippingThreshold = getFreeShippingThreshold()
  const shippingFee = getShippingFee()
  const afterDiscount = summary.subtotal - summary.discount
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - afterDiscount)
  const freeShippingProgress = Math.min(100, (afterDiscount / freeShippingThreshold) * 100)

  const handleCheckGiftCard = async () => {
    if (!giftCardInput.trim()) return
    setGiftCardChecking(true)
    try {
      const { data } = await apiClient.post<{ code: string; balance: number; isValid: boolean }>('/gift-cards/check', { code: giftCardInput.trim() })
      applyGiftCard(data.code, data.balance)
      setGiftCardInput('')
      toast.success(`Gift card applied! ₹${data.balance.toFixed(2)} available`)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Invalid gift card')
    } finally {
      setGiftCardChecking(false)
    }
  }

  const handleRemoveClick = (lineId: string) => setPendingRemoveId(lineId)
  const handleWishlistAndRemove = (line: CartLine) => {
    wishlistAdd(line.productId)
    removeLine(line.lineId)
    setPendingRemoveId(null)
  }
  const handleJustRemove = (lineId: string) => {
    removeLine(lineId)
    setPendingRemoveId(null)
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-[1440px] flex-col items-center justify-center px-4 py-16 text-center sm:px-8">
        <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <ShoppingBag className="h-14 w-14 text-slate-300 dark:text-slate-600" strokeWidth={1.2} />
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Your cart is empty</h1>
        <p className="mb-8 max-w-xs text-sm text-slate-500 dark:text-slate-400">
          Looks like you haven&apos;t added anything yet. Browse our collection and find something you&apos;ll love.
        </p>
        <Link href="/products" className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
          Browse Collection <ArrowRight size={15} />
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8">

      {/* Trust strip */}
      <div className="mb-6 -mx-1 overflow-x-auto">
        <div className="flex gap-3 px-1 pb-1" style={{ width: 'max-content' }}>
          {[
            { icon: <RotateCcw size={15} className="text-emerald-600 dark:text-emerald-400" />, bg: 'bg-emerald-50 dark:bg-emerald-950/40', title: '7-Day Easy Returns', sub: 'No questions asked' },
            { icon: <Truck size={15} className="text-blue-600 dark:text-blue-400" />, bg: 'bg-blue-50 dark:bg-blue-950/40', title: 'Fast Tracked Delivery', sub: 'Ships within 24 hrs' },
            { icon: <ShieldCheck size={15} className="text-violet-600 dark:text-violet-400" />, bg: 'bg-violet-50 dark:bg-violet-950/40', title: '100% Secure Payments', sub: 'SSL encrypted checkout' },
            { icon: <BadgeCheck size={15} className="text-amber-600 dark:text-amber-400" />, bg: 'bg-amber-50 dark:bg-amber-950/40', title: 'Quality Guaranteed', sub: 'Defect? Free replacement' },
            { icon: <Headphones size={15} className="text-rose-600 dark:text-rose-400" />, bg: 'bg-rose-50 dark:bg-rose-950/40', title: '24/7 Support', sub: 'Always here to help' },
            { icon: <CreditCard size={15} className="text-indigo-600 dark:text-indigo-400" />, bg: 'bg-indigo-50 dark:bg-indigo-950/40', title: 'UPI · Cards · COD', sub: 'Multiple payment options' },
          ].map(({ icon, bg, title, sub }) => (
            <div key={title} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-900 min-w-[190px]">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${bg}`}>{icon}</div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{title}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {lines.length} item{lines.length !== 1 ? 's' : ''} in your cart
          </p>
        </div>
        <button
          onClick={() => setShowClearConfirm(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-500 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear cart
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* ── Left: Items ── */}
        <section className="space-y-4">
          {bundleDeal && (
            <div className="flex items-start gap-3 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-indigo-50 px-4 py-3 dark:border-violet-800/40 dark:from-violet-950/30 dark:to-indigo-950/20">
              <Gift size={16} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-800 dark:text-violet-200">Bundle deal applied — {bundleDeal.bundleName}</p>
                <p className="mt-0.5 text-xs text-violet-600 dark:text-violet-400">
                  {bundleDeal.discountType === 'PERCENT'
                    ? `${bundleDeal.discountValue}% off on ${bundleDeal.matchedProductIds.length} matched item${bundleDeal.matchedProductIds.length !== 1 ? 's' : ''}`
                    : `₹${bundleDeal.discountValue.toLocaleString('en-IN')} off on ${bundleDeal.matchedProductIds.length} matched item${bundleDeal.matchedProductIds.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
          )}

          {freeShippingThreshold > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Truck size={13} />
                {remainingForFreeShipping > 0
                  ? `Add ₹${remainingForFreeShipping.toFixed(2)} more for FREE shipping`
                  : 'You qualify for FREE shipping!'}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-emerald-200 dark:bg-emerald-900/60">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${freeShippingProgress}%` }} />
              </div>
            </div>
          )}

          {lines.map((line) => (
            <article key={line.lineId} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <Link href={`/products/${line.slug}`} className="shrink-0">
                <div className="relative h-24 w-20 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 sm:h-28 sm:w-24">
                  {line.image ? (
                    <Image src={line.image} alt={line.name} fill className="object-cover transition duration-300 hover:scale-105" sizes="96px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/products/${line.slug}`}>
                      <p className="line-clamp-2 font-semibold text-slate-900 hover:underline dark:text-white">{line.name}</p>
                    </Link>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {line.size && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Size: {line.size}</span>}
                      {line.color && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{line.color}</span>}
                    </div>
                  </div>
                  {pendingRemoveId !== line.lineId && (
                    <button type="button" onClick={() => handleRemoveClick(line.lineId)} className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400" aria-label="Remove item">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {pendingRemoveId === line.lineId && (
                  <div className="mt-2">
                    <RemovePrompt line={line} onKeep={() => setPendingRemoveId(null)} onWishlist={() => handleWishlistAndRemove(line)} onRemove={() => handleJustRemove(line.lineId)} />
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-0 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button type="button" onClick={() => updateQuantity(line.lineId, line.quantity - 1)} disabled={line.quantity <= 1} className="flex h-8 w-8 items-center justify-center rounded-l-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Minus size={13} />
                    </button>
                    <span className="w-8 select-none text-center text-sm font-semibold text-slate-900 dark:text-white">{line.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(line.lineId, line.quantity + 1)} disabled={line.quantity >= 10} className="flex h-8 w-8 items-center justify-center rounded-r-xl text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800">
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">₹{(line.unitPrice * line.quantity).toFixed(2)}</p>
                    {line.quantity > 1 && <p className="text-xs text-slate-400">₹{line.unitPrice.toFixed(2)} each</p>}
                  </div>
                </div>
              </div>
            </article>
          ))}

          <div className="pt-1">
            <Link href="/products" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
              ← Continue shopping
            </Link>
          </div>
        </section>

        {/* ── Right: Summary ── */}
        <aside className="h-fit space-y-4">
          {/* Coupon section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              <Tag size={14} className="text-indigo-500" /> Coupons & Rewards
            </div>
            <CartCouponsSection />
          </div>

          {/* Loyalty & Gift Card — only when logged in */}
          {user && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Rewards & Gift Card</p>
                {loyaltyLoading && <span className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />}
              </div>

              {/* Loyalty points */}
              <div className={`rounded-xl border p-3 transition ${loyaltyApplied ? 'border-yellow-400 bg-yellow-50 dark:border-yellow-500 dark:bg-yellow-950/40' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                      <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div className="min-w-0">
                      {loyaltyLoading ? (
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      ) : (
                        <>
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {loyaltyBalance.toLocaleString()} pts
                            <span className="ml-1.5 text-xs font-normal text-slate-500">= ₹{(loyaltyBalance * rupeePerPoint).toFixed(0)} off</span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {canUseLoyalty
                              ? `Up to ₹${Math.min(potentialLoyaltyDiscount, maxLoyaltyDiscount).toFixed(0)} off this order`
                              : `Need ${minPoints} pts to redeem`}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  {!loyaltyLoading && (
                    canUseLoyalty ? (
                      <button
                        type="button"
                        onClick={() => setLoyaltyApplied(!loyaltyApplied)}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${loyaltyApplied ? 'bg-yellow-500 text-white' : 'border border-yellow-400 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-500 dark:text-yellow-400'}`}
                      >
                        {loyaltyApplied ? '✓ Applied' : 'Apply'}
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {loyaltyBalance}/{minPoints} pts
                      </span>
                    )
                  )}
                </div>
                {loyaltyApplied && (
                  <div className="mt-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1.5 text-xs text-yellow-800 dark:text-yellow-300 font-medium">
                    🏆 Saving ₹{loyaltyDiscountAmount.toFixed(2)} with loyalty points
                  </div>
                )}
              </div>

              {/* Gift card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Gift size={14} className="text-violet-500" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Gift Card</p>
                </div>
                {giftCardApplied ? (
                  <div className="flex items-center justify-between rounded-lg bg-violet-50 dark:bg-violet-950/30 px-3 py-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{giftCardApplied.code}</p>
                      <p className="text-xs text-violet-600 dark:text-violet-400">−₹{giftCardToApply.toFixed(2)} will be applied</p>
                    </div>
                    <button type="button" onClick={() => removeGiftCard()} className="ml-2 rounded-full p-1 text-slate-400 hover:text-rose-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-transparent dark:text-slate-100 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-slate-900 dark:focus:border-slate-400 dark:placeholder-slate-500"
                      placeholder="XXXX-XXXX-XXXX"
                      value={giftCardInput}
                      onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                    />
                    <button
                      type="button"
                      disabled={giftCardChecking || !giftCardInput.trim()}
                      onClick={() => void handleCheckGiftCard()}
                      className="shrink-0 rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                    >
                      {giftCardChecking ? '…' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-4 text-base font-bold text-slate-900 dark:text-white">Order Summary</p>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal ({lines.reduce((s, l) => s + l.quantity, 0)} items)</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{summary.subtotal.toFixed(2)}</span>
              </div>

              {summary.discount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Coupon discount</span>
                  <span className="font-semibold">−₹{summary.discount.toFixed(2)}</span>
                </div>
              )}

              {bundleDeal && (() => {
                const base = lines.filter((l) => bundleDeal.matchedProductIds.includes(l.productId)).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
                const saving = bundleDeal.discountType === 'PERCENT' ? (base * bundleDeal.discountValue) / 100 : bundleDeal.discountValue
                return saving > 0 ? (
                  <div className="flex justify-between text-violet-600 dark:text-violet-400">
                    <span className="flex items-center gap-1"><Gift size={12} /> Bundle Deal</span>
                    <span className="font-semibold">−₹{saving.toFixed(2)}</span>
                  </div>
                ) : null
              })()}

              {loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                  <span className="flex items-center gap-1"><Star size={12} /> Loyalty pts</span>
                  <span className="font-semibold">−₹{loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              {giftCardToApply > 0 && (
                <div className="flex justify-between text-violet-600 dark:text-violet-400">
                  <span className="flex items-center gap-1"><Gift size={12} /> Gift Card</span>
                  <span className="font-semibold">−₹{giftCardToApply.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping</span>
                {summary.shipping === 0 ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">FREE</span>
                ) : (
                  <span className="font-medium text-slate-900 dark:text-white">₹{summary.shipping.toFixed(2)}</span>
                )}
              </div>

              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>GST ({Math.round(gstRate * 100)}%)</span>
                <span className="font-medium text-slate-900 dark:text-white">₹{summary.gst.toFixed(2)}</span>
              </div>

              <div className="mt-1 border-t border-slate-200 pt-3 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-base font-bold text-slate-900 dark:text-white">Total</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">₹{grandTotal.toFixed(2)}</span>
                </div>
                {(summary.discount > 0 || loyaltyDiscountAmount > 0 || giftCardToApply > 0) && (
                  <p className="mt-1 text-right text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    You save ₹{(summary.discount + loyaltyDiscountAmount + giftCardToApply).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Proceed to Checkout <ArrowRight size={15} />
            </Link>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
              <ShieldCheck size={12} className="shrink-0 text-emerald-500" />
              Secure checkout · SSL encrypted
            </div>

            {/* Payment icons */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {['VISA', 'MC', 'UPI', 'GPay'].map((m) => (
                <span key={m} className="rounded border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-400 dark:border-slate-700 dark:text-slate-500">{m}</span>
              ))}
            </div>
          </div>


          {freeShippingThreshold > 0 && summary.shipping > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
              <Truck size={12} className="mb-1 inline text-slate-400" />{' '}
              Add <span className="font-semibold text-slate-700 dark:text-slate-300">₹{remainingForFreeShipping.toFixed(2)}</span> more to get free shipping (orders above ₹{freeShippingThreshold})
            </div>
          )}
        </aside>
      </div>
      {/* Clear cart confirmation modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <Trash2 className="h-5 w-5 text-red-500" />
            </div>
            <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-white">Clear entire cart?</h3>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
              This will remove all {lines.length} item{lines.length !== 1 ? 's' : ''} from your cart. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Keep items
              </button>
              <button
                type="button"
                onClick={() => { clearCart(); toast.success('Cart cleared'); setShowClearConfirm(false) }}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Yes, clear cart
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
