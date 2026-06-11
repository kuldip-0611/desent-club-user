'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CreditCard, Banknote, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { createOrder, verifyPayment } from '@/services/order.service'
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
      })

      if (paymentMethod === 'COD') {
        // No Razorpay needed — order is already confirmed
        clearCart()
        toast.success('Order placed! Pay cash on delivery.')
        router.push(`/orders?placed=${orderPayload.orderId}`)
        return
      }

      // Online payment via Razorpay
      await openRazorpayCheckout({
        keyId: orderPayload.keyId!,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        razorpayOrderId: orderPayload.razorpayOrderId!,
        description: `Order ${orderPayload.orderId.slice(0, 8)}`,
        prefill: {
          name: user.name,
          email: user.email ?? undefined,
        },
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

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
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
                  ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${paymentMethod === 'ONLINE' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                <CreditCard className={`h-4 w-4 ${paymentMethod === 'ONLINE' ? 'text-indigo-600' : 'text-slate-500'}`} />
              </div>
              <div>
                <p className={`font-semibold ${paymentMethod === 'ONLINE' ? 'text-indigo-900' : 'text-slate-800'}`}>
                  Online Payment
                </p>
                <p className="mt-0.5 text-xs text-slate-500">UPI, cards, netbanking via Razorpay</p>
              </div>
              {paymentMethod === 'ONLINE' && <CheckCircle className="ml-auto h-4 w-4 flex-shrink-0 text-indigo-600" />}
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
                <p className={`font-semibold ${paymentMethod === 'COD' ? 'text-emerald-900' : 'text-slate-800'}`}>
                  Cash on Delivery
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Pay when your order arrives</p>
              </div>
              {paymentMethod === 'COD' && <CheckCircle className="ml-auto h-4 w-4 flex-shrink-0 text-emerald-600" />}
            </button>
          </div>

          {paymentMethod === 'ONLINE' && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-sm text-indigo-900">
              Payment processed via Razorpay. UPI, debit/credit card, netbanking all supported.
            </div>
          )}
          {paymentMethod === 'COD' && (
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
              No advance payment needed. Pay the delivery agent when your order arrives. ₹{summary.total} will be collected.
            </div>
          )}
        </div>
      </section>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-lg font-semibold">Order summary</p>
        <div className="mt-2 space-y-1 text-sm text-slate-600">
          <p>Subtotal: Rs. {summary.subtotal}</p>
          {summary.discount > 0 ? (
            <p className="text-emerald-700">
              Discount{couponCode ? ` (${couponCode})` : ''}: -Rs. {summary.discount}
            </p>
          ) : null}
          <p>Shipping: Rs. {summary.shipping}</p>
          <p>GST: Rs. {summary.gst}</p>
        </div>
        <p className="mt-3 border-t border-slate-200 pt-2 text-base font-bold">
          {paymentMethod === 'COD' ? 'Amount due on delivery' : 'Payable'}: Rs. {summary.total}
        </p>

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
              ? `Place COD Order — Rs. ${summary.total}`
              : `Pay Rs. ${summary.total}`}
        </Button>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          By placing this order you agree to our terms and conditions.
        </p>
      </aside>
    </main>
  )
}
