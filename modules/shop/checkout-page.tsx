'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CreditCard, Banknote, CheckCircle, Zap, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { createOrder, verifyPayment, previewOrder, type OrderPreviewResponse } from '@/services/order.service'
import { getStoreCreditBalance } from '@/services/store-credit.service'
import { getLoyaltyAccount, getLoyaltyRules, type LoyaltyAccount, type LoyaltyRules } from '@/services/loyalty.service'
import { getStoredAffiliateCode } from '@/hooks/use-utm'
import { getCartSummary, useCartStore } from '@/store/cart-store'
import { useCheckoutAddressStore } from '@/store/checkout-address-store'
import { useAuthStore } from '@/store/auth-store'

type PaymentMethod = 'ONLINE' | 'COD'

export const CheckoutPageModule = () => {
  const router = useRouter()
  const { requireAuth } = useAuthGuard()
  const user = useAuthStore((s) => s.user)
  const lines = useCartStore((s) => s.lines)
  const clearCart = useCartStore((s) => s.clear)
  const couponDiscount = useCartStore((s) => s.couponDiscount)
  const couponCode = useCartStore((s) => s.couponCode)
  const giftCardApplied = useCartStore((s) => s.giftCardApplied)
  const loyaltyApplied = useCartStore((s) => s.loyaltyApplied)
  const selectedAddressId = useCheckoutAddressStore((s) => s.selectedAddressId)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount), [lines, couponDiscount])
  const [preview, setPreview] = useState<OrderPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE')
  const [codOtpModal, setCodOtpModal] = useState<{ orderId: string; otp: string } | null>(null)
  const [codOtpInput, setCodOtpInput] = useState('')
  const [codOtpVerifying, setCodOtpVerifying] = useState(false)

  // Store credit
  const [storeCreditBalance, setStoreCreditBalance] = useState(0)
  const [applyStoreCredit, setApplyStoreCredit] = useState(false)

  // Loyalty points — silently fetched to compute points for order API (UI is on cart page)
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null)
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRules | null>(null)

  useEffect(() => {
    if (!user) return
    getStoreCreditBalance().then((res) => setStoreCreditBalance(res.balance)).catch(() => undefined)
    Promise.allSettled([getLoyaltyAccount(), getLoyaltyRules()]).then(([acct, rules]) => {
      if (acct.status === 'fulfilled') setLoyaltyAccount(acct.value)
      if (rules.status === 'fulfilled') setLoyaltyRules(rules.value)
    })
  }, [user])

  const rupeePerPoint = loyaltyRules?.rupeePerPoint ?? 0.25
  const maxRedeemPercent = loyaltyRules?.maxRedeemPercent ?? 20
  const loyaltyBalance = loyaltyAccount?.balance ?? 0
  const maxLoyaltyDiscount = (summary.total * maxRedeemPercent) / 100
  const potentialLoyaltyDiscount = loyaltyBalance * rupeePerPoint
  const loyaltyDiscountAmount = loyaltyApplied
    ? Math.min(potentialLoyaltyDiscount, maxLoyaltyDiscount, summary.total)
    : 0
  const loyaltyPointsToUse = loyaltyApplied
    ? Math.ceil(loyaltyDiscountAmount / rupeePerPoint)
    : 0

  // Store credit (applied after loyalty)
  const afterLoyalty = Math.max(summary.total - loyaltyDiscountAmount, 0)
  const storeCreditToApply = applyStoreCredit ? Math.min(storeCreditBalance, afterLoyalty) : 0
  const afterStoreCredit = Math.max(afterLoyalty - storeCreditToApply, 0)
  const giftCardToApply = giftCardApplied ? Math.min(giftCardApplied.balance, afterStoreCredit) : 0
  // Use backend-verified total when available; fall back to frontend estimate while loading
  const finalTotal = preview ? preview.total : Math.max(afterStoreCredit - giftCardToApply, 0)

  // Fetch backend-authoritative price preview whenever cart or discounts change
  useEffect(() => {
    if (!user || lines.length === 0) { setPreview(null); return }
    setPreviewLoading(true)
    const timer = setTimeout(() => {
      previewOrder({
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, size: l.size, color: l.color, quantity: l.quantity })),
        couponCode: couponCode ?? undefined,
        loyaltyPoints: loyaltyPointsToUse > 0 ? loyaltyPointsToUse : undefined,
        storeCreditAmount: storeCreditToApply > 0 ? storeCreditToApply : undefined,
        giftCardCode: giftCardApplied?.code,
      })
        .then(setPreview)
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false))
    }, 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, lines, couponCode, loyaltyPointsToUse, storeCreditToApply, giftCardApplied?.code])


  const handlePlaceOrder = () => {
    requireAuth(() => { void placeOrder() })
  }

  const placeOrder = async () => {
    if (!user) { toast.error('Please sign in to place an order'); return }
    if (lines.length === 0) { toast.error('Your cart is empty'); return }
    if (!selectedAddressId) { toast.error('Please select a delivery address'); return }

    setPlacing(true)
    try {
      const orderPayload = await createOrder({
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          size: line.size,
          color: line.color,
          quantity: line.quantity,
        })),
        addressId: selectedAddressId,
        couponCode: couponCode ?? undefined,
        paymentMethod,
        affiliateCode: getStoredAffiliateCode() ?? undefined,
        loyaltyPoints: loyaltyPointsToUse > 0 ? loyaltyPointsToUse : undefined,
        storeCreditAmount: storeCreditToApply > 0 ? storeCreditToApply : undefined,
        giftCardCode: giftCardApplied?.code,
      })

      if (paymentMethod === 'COD') {
        clearCart()
        toast.success('Order placed! Pay cash on delivery.')
        // Show OTP modal if backend returned an OTP
        if (orderPayload.codOtp) {
          setCodOtpModal({ orderId: orderPayload.orderId, otp: orderPayload.codOtp })
        } else {
          router.push(`/orders?placed=${orderPayload.orderId}`)
        }
        return
      }

      await openRazorpayCheckout({
        keyId: orderPayload.keyId!,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        razorpayOrderId: orderPayload.razorpayOrderId!,
        description: `Order ${orderPayload.orderId.slice(0, 8)}`,
        prefill: { name: user.name, email: user.email ?? undefined },
        onSuccess: async (response) => {
          const result = await verifyPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          clearCart()
          toast.success('Payment successful! Order confirmed.')
          router.push(`/orders?placed=${result.orderId}`)
        },
        onDismiss: () => { toast.error('Payment cancelled') },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not complete payment'
      if (message !== 'Payment cancelled') toast.error(message)
    } finally {
      setPlacing(false)
    }
  }

  const handleVerifyCodOtp = async () => {
    if (!codOtpModal || !codOtpInput.trim()) return
    setCodOtpVerifying(true)
    try {
      const { apiClient } = await import('@/services/api/client')
      await apiClient.post(`/orders/my/${codOtpModal.orderId}/verify-cod`, { otp: codOtpInput.trim() })
      toast.success('OTP verified! Your order is confirmed.')
      setCodOtpModal(null)
      router.push(`/orders?placed=${codOtpModal.orderId}`)
    } catch {
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setCodOtpVerifying(false)
    }
  }

  // Guest wall — show a sign-in prompt instead of a broken checkout
  if (!user) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <CreditCard className="h-9 w-9 text-slate-400 dark:text-slate-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sign in to checkout</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Your cart is saved. Sign in to complete your order — your items will still be there.
          </p>
        </div>
        <Button
          className="w-full max-w-xs bg-slate-900 hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          onClick={() => requireAuth(() => {})}
        >
          Sign in to continue
        </Button>
      </main>
    )
  }

  return (
    <>
    {/* COD OTP Modal */}
    {codOtpModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl space-y-4 dark:bg-slate-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mx-auto">
            <Banknote className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">COD Delivery OTP</h2>
          <p className="text-sm text-slate-600">
            Your order has been placed! We&apos;ve sent a 6-digit OTP to your email. Share it with the delivery agent when your order arrives.
          </p>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500 mb-1">Your OTP</p>
            <p className="text-3xl font-black tracking-[0.3em] text-slate-900">{codOtpModal.otp}</p>
          </div>
          <p className="text-xs text-slate-400">Or enter your OTP here to pre-verify:</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl font-bold tracking-[0.2em] outline-none focus:border-slate-900"
            placeholder="6-digit OTP"
            value={codOtpInput}
            onChange={(e) => setCodOtpInput(e.target.value.replace(/\D/g, ''))}
          />
          <Button
            className="w-full"
            disabled={codOtpVerifying || codOtpInput.length !== 6}
            onClick={() => void handleVerifyCodOtp()}
          >
            {codOtpVerifying ? 'Verifying…' : 'Verify & Continue'}
          </Button>
          <button
            type="button"
            className="text-sm text-slate-900 hover:underline"
            onClick={() => {
              setCodOtpModal(null)
              router.push(`/orders?placed=${codOtpModal.orderId}`)
            }}
          >
            I&apos;ll verify later
          </button>
        </div>
      </div>
    )}
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <div>
          <h1 className="text-2xl font-bold">Checkout</h1>
          <p className="mt-1 text-sm text-slate-500">Choose your delivery address and payment method.</p>
        </div>

        <AddressesPanel
          mode="checkout"
          isAuthenticated={Boolean(user)}
          onRequireAuth={() => requireAuth(() => {})}
        />

        {/* Address warning */}
        {!selectedAddressId && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-700/40 dark:bg-amber-950/30">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">No delivery address selected</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Please add or select a delivery address above to place your order.</p>
            </div>
          </div>
        )}

        {/* ── Payment method selector ── */}
        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">Payment method</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('ONLINE')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                paymentMethod === 'ONLINE'
                  ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${paymentMethod === 'ONLINE' ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <CreditCard className={`h-4 w-4 ${paymentMethod === 'ONLINE' ? 'text-white' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className={`font-semibold ${paymentMethod === 'ONLINE' ? 'text-slate-900' : 'text-slate-800'}`}>Online Payment</p>
                <p className="mt-0.5 text-xs text-slate-500">UPI, cards, netbanking via Razorpay</p>
              </div>
              {paymentMethod === 'ONLINE' && <CheckCircle className="ml-auto h-4 w-4 flex-shrink-0 text-white" />}
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('COD')}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                paymentMethod === 'COD'
                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${paymentMethod === 'COD' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                <Banknote className={`h-4 w-4 ${paymentMethod === 'COD' ? 'text-emerald-600' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className={`font-semibold ${paymentMethod === 'COD' ? 'text-emerald-900' : 'text-slate-800'}`}>Cash on Delivery</p>
                <p className="mt-0.5 text-xs text-slate-500">Pay when your order arrives</p>
              </div>
              {paymentMethod === 'COD' && <CheckCircle className="ml-auto h-4 w-4 flex-shrink-0 text-emerald-600" />}
            </button>
          </div>

          {paymentMethod === 'ONLINE' && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
              Payment processed via Razorpay. UPI, debit/credit card, netbanking all supported.
            </div>
          )}
          {paymentMethod === 'COD' && (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              No advance payment needed. Pay the delivery agent when your order arrives. ₹{finalTotal.toFixed(2)} will be collected.
            </div>
          )}
        </div>
      </section>

      <aside className="h-fit space-y-3">
        {/* Store credit — only this stays on checkout since it's checkout-specific */}
        {user && storeCreditBalance > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <div className={`rounded-xl border p-3 transition ${
              applyStoreCredit
                ? 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950/40'
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <Zap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">₹{storeCreditBalance.toFixed(2)} Store Credit</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">From a previous return</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setApplyStoreCredit((v) => !v)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                    applyStoreCredit
                      ? 'bg-green-600 text-white dark:bg-green-500'
                      : 'border border-green-400 text-green-700 hover:bg-green-100 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/30'
                  }`}
                >
                  {applyStoreCredit ? '✓ Applied' : 'Apply'}
                </button>
              </div>
              {applyStoreCredit && (
                <div className="mt-2 rounded-lg bg-green-100 dark:bg-green-900/40 px-3 py-1.5 text-xs text-green-800 dark:text-green-300 font-medium">
                  ⚡ Saving ₹{storeCreditToApply.toFixed(2)} with store credit
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Order summary ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">Order summary</p>
            {previewLoading && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            )}
          </div>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{(preview?.subtotal ?? summary.subtotal).toFixed(2)}</span>
            </div>
            {(preview ? preview.couponDiscount > 0 : summary.discount > 0) && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon{couponCode ? ` (${couponCode})` : ''}</span>
                <span>−₹{(preview?.couponDiscount ?? summary.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>₹{(preview?.shipping ?? summary.shipping).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST{preview ? ` (${Math.round(preview.gstRate * 100)}%)` : ''}</span>
              <span>₹{(preview?.gst ?? summary.gst).toFixed(2)}</span>
            </div>
            {(preview ? preview.loyaltyDiscount > 0 : loyaltyDiscountAmount > 0) && (
              <div className="flex justify-between text-yellow-700 font-medium">
                <span>🏆 Loyalty ({loyaltyPointsToUse} pts)</span>
                <span>−₹{(preview?.loyaltyDiscount ?? loyaltyDiscountAmount).toFixed(2)}</span>
              </div>
            )}
            {(preview ? preview.storeCreditApplied > 0 : storeCreditToApply > 0) && (
              <div className="flex justify-between text-green-700 font-medium">
                <span>⚡ Store Credit</span>
                <span>−₹{(preview?.storeCreditApplied ?? storeCreditToApply).toFixed(2)}</span>
              </div>
            )}
            {(preview ? preview.giftCardDiscount > 0 : giftCardToApply > 0) && (
              <div className="flex justify-between text-slate-900 font-medium">
                <span>🎁 Gift Card</span>
                <span>−₹{(preview?.giftCardDiscount ?? giftCardToApply).toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
            <span className="text-base font-bold text-slate-900">
              {paymentMethod === 'COD' ? 'Due on delivery' : 'Total payable'}
            </span>
            <span className="text-base font-bold text-slate-900">₹{finalTotal.toFixed(2)}</span>
          </div>

          {lines.length > 0 && (
            <div className="mt-3 max-h-40 space-y-2 overflow-y-auto border-t border-slate-100 pt-3">
              {lines.map((line) => (
                <div key={`${line.productId}-${line.variantId}`} className="flex items-center gap-2 text-xs text-slate-600">
                  {line.image && (
                    <img src={line.image} alt={line.name} className="h-8 w-8 rounded-md object-cover" />
                  )}
                  <span className="flex-1 truncate">{line.name}</span>
                  <span className="font-medium">×{line.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <Button
            className="mt-4 w-full"
            disabled={placing || lines.length === 0 || (Boolean(user) && !selectedAddressId)}
            onClick={handlePlaceOrder}
          >
            {placing
              ? 'Processing…'
              : paymentMethod === 'COD'
                ? `Place COD Order — ₹${finalTotal.toFixed(2)}`
                : `Pay ₹${finalTotal.toFixed(2)}`}
          </Button>
          <p className="mt-2 text-center text-[10px] text-slate-400">
            By placing this order you agree to our terms and conditions.
          </p>
        </div>
      </aside>
    </main>
    </>
  )
}
