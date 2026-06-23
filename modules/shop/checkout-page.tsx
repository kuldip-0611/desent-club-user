'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CreditCard, Banknote, CheckCircle, Zap, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { createOrder, verifyPayment } from '@/services/order.service'
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
  const selectedAddressId = useCheckoutAddressStore((s) => s.selectedAddressId)
  const summary = useMemo(() => getCartSummary(lines, couponDiscount), [lines, couponDiscount])
  const [placing, setPlacing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE')
  const [codOtpModal, setCodOtpModal] = useState<{ orderId: string; otp: string } | null>(null)
  const [codOtpInput, setCodOtpInput] = useState('')
  const [codOtpVerifying, setCodOtpVerifying] = useState(false)

  // Store credit
  const [storeCreditBalance, setStoreCreditBalance] = useState(0)
  const [applyStoreCredit, setApplyStoreCredit] = useState(false)

  // Gift card
  const [giftCardInput, setGiftCardInput] = useState('')
  const [giftCardApplied, setGiftCardApplied] = useState<{ code: string; balance: number } | null>(null)
  const [giftCardChecking, setGiftCardChecking] = useState(false)

  // Loyalty points
  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null)
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRules | null>(null)
  const [applyLoyalty, setApplyLoyalty] = useState(false)
  const [loyaltyLoading, setLoyaltyLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoyaltyLoading(false); return }
    getStoreCreditBalance().then((res) => setStoreCreditBalance(res.balance)).catch(() => undefined)
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
  const loyaltyDiscountAmount = applyLoyalty
    ? Math.min(potentialLoyaltyDiscount, maxLoyaltyDiscount, summary.total)
    : 0
  const loyaltyPointsToUse = applyLoyalty
    ? Math.ceil(loyaltyDiscountAmount / rupeePerPoint)
    : 0

  // Store credit (applied after loyalty)
  const afterLoyalty = Math.max(summary.total - loyaltyDiscountAmount, 0)
  const storeCreditToApply = applyStoreCredit ? Math.min(storeCreditBalance, afterLoyalty) : 0
  const afterStoreCredit = Math.max(afterLoyalty - storeCreditToApply, 0)
  const giftCardToApply = giftCardApplied ? Math.min(giftCardApplied.balance, afterStoreCredit) : 0
  const finalTotal = Math.max(afterStoreCredit - giftCardToApply, 0)

  const handleCheckGiftCard = async () => {
    if (!giftCardInput.trim()) return
    setGiftCardChecking(true)
    try {
      const { apiClient } = await import('@/services/api/client')
      const { data } = await apiClient.post<{ code: string; balance: number; isValid: boolean }>('/gift-cards/check', { code: giftCardInput.trim() })
      setGiftCardApplied({ code: data.code, balance: data.balance })
      toast.success(`Gift card applied! ₹${data.balance.toFixed(2)} available`)
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Invalid gift card')
    } finally {
      setGiftCardChecking(false)
    }
  }

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
              No advance payment needed. Pay the delivery agent when your order arrives. ₹{finalTotal} will be collected.
            </div>
          )}
        </div>
      </section>

      <aside className="h-fit space-y-3">
        {/* ── Savings & Loyalty panel — always visible when logged in ── */}
        {user && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Rewards & Savings</p>
              {loyaltyLoading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
              )}
            </div>

            {/* Loyalty points */}
            <div className={`rounded-xl border p-3 transition ${
              applyLoyalty ? 'border-yellow-400 bg-yellow-50' : 'border-slate-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-100">
                    <Star className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="min-w-0">
                    {loyaltyLoading ? (
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                    ) : (
                      <>
                        <p className="text-sm font-bold text-slate-900">
                          {loyaltyBalance.toLocaleString()} pts
                          <span className="ml-1.5 text-xs font-normal text-slate-500">
                            = ₹{(loyaltyBalance * rupeePerPoint).toFixed(0)} off
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {canUseLoyalty
                            ? `Up to ₹${Math.min(loyaltyBalance * rupeePerPoint, (summary.total * maxRedeemPercent) / 100).toFixed(0)} off this order`
                            : `Need ${minPoints} pts to redeem · earn more by shopping`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {!loyaltyLoading && (
                  canUseLoyalty ? (
                    <button
                      type="button"
                      onClick={() => setApplyLoyalty((v) => !v)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                        applyLoyalty
                          ? 'bg-yellow-500 text-white'
                          : 'border border-yellow-400 text-yellow-700 hover:bg-yellow-50'
                      }`}
                    >
                      {applyLoyalty ? '✓ Applied' : 'Apply'}
                    </button>
                  ) : (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                      {loyaltyBalance} / {minPoints} pts
                    </span>
                  )
                )}
              </div>
              {applyLoyalty && (
                <div className="mt-2 rounded-lg bg-yellow-100 px-3 py-1.5 text-xs text-yellow-800 font-medium">
                  🏆 Saving ₹{loyaltyDiscountAmount.toFixed(2)} · using {loyaltyPointsToUse} pts (max {maxRedeemPercent}% of order)
                </div>
              )}
            </div>

            {/* Store credit */}
            {storeCreditBalance > 0 && (
              <div className={`rounded-xl border p-3 transition ${applyStoreCredit ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Zap className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">₹{storeCreditBalance.toFixed(2)} Store Credit</p>
                      <p className="text-[10px] text-slate-500">From a previous return</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApplyStoreCredit((v) => !v)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                      applyStoreCredit
                        ? 'bg-green-600 text-white'
                        : 'border border-green-400 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {applyStoreCredit ? '✓ Applied' : 'Apply'}
                  </button>
                </div>
                {applyStoreCredit && (
                  <div className="mt-2 rounded-lg bg-green-100 px-3 py-1.5 text-xs text-green-800 font-medium">
                    ⚡ Saving ₹{storeCreditToApply.toFixed(2)} with store credit
                  </div>
                )}
              </div>
            )}

            {/* Gift card */}
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-700 mb-2">Gift Card</p>
              {giftCardApplied ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900 font-mono">{giftCardApplied.code}</p>
                    <p className="text-xs text-slate-500">₹{giftCardToApply.toFixed(2)} will be applied</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setGiftCardApplied(null); setGiftCardInput('') }}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-slate-900"
                    placeholder="XXXX-XXXX-XXXX"
                    value={giftCardInput}
                    onChange={(e) => setGiftCardInput(e.target.value.toUpperCase())}
                  />
                  <button
                    type="button"
                    disabled={giftCardChecking || !giftCardInput.trim()}
                    onClick={() => void handleCheckGiftCard()}
                    className="rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition"
                  >
                    {giftCardChecking ? '…' : 'Apply'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Order summary ── */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-lg font-semibold">Order summary</p>
          <div className="mt-2 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><span>Subtotal</span><span>₹{summary.subtotal}</span></div>
            {summary.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon{couponCode ? ` (${couponCode})` : ''}</span>
                <span>−₹{summary.discount}</span>
              </div>
            )}
            <div className="flex justify-between"><span>Shipping</span><span>₹{summary.shipping}</span></div>
            <div className="flex justify-between"><span>GST</span><span>₹{summary.gst}</span></div>
            {loyaltyDiscountAmount > 0 && (
              <div className="flex justify-between text-yellow-700 font-medium">
                <span>🏆 Loyalty ({loyaltyPointsToUse} pts)</span>
                <span>−₹{loyaltyDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            {storeCreditToApply > 0 && (
              <div className="flex justify-between text-green-700 font-medium">
                <span>⚡ Store Credit</span>
                <span>−₹{storeCreditToApply.toFixed(2)}</span>
              </div>
            )}
            {giftCardToApply > 0 && (
              <div className="flex justify-between text-slate-900 font-medium">
                <span>🎁 Gift Card</span>
                <span>−₹{giftCardToApply.toFixed(2)}</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-between border-t border-slate-200 pt-3">
            <span className="text-base font-bold text-slate-900">
              {paymentMethod === 'COD' ? 'Due on delivery' : 'Total payable'}
            </span>
            <span className="text-base font-bold text-slate-900">₹{finalTotal}</span>
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
                ? `Place COD Order — ₹${finalTotal}`
                : `Pay ₹${finalTotal}`}
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
