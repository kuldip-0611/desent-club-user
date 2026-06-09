'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { createOrder, verifyPayment } from '@/services/order.service'
import { getCartSummary, useCartStore } from '@/store/cart-store'
import { useCheckoutAddressStore } from '@/store/checkout-address-store'
import { useAuthStore } from '@/store/auth-store'

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

  const handlePlaceOrder = () => {
    requireAuth(() => {
      void placeOrder()
    })
  }

  const placeOrder = async () => {
    if (!user) {
      toast.error('Please sign in to place an order')
      return
    }
    if (lines.length === 0) {
      toast.error('Your cart is empty')
      return
    }
    if (!selectedAddressId) {
      toast.error('Please select a delivery address')
      return
    }

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
      })

      await openRazorpayCheckout({
        keyId: orderPayload.keyId,
        amount: orderPayload.amount,
        currency: orderPayload.currency,
        razorpayOrderId: orderPayload.razorpayOrderId,
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
        onDismiss: () => {
          toast.error('Payment cancelled')
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not complete payment'
      if (message !== 'Payment cancelled') {
        toast.error(message)
      }
    } finally {
      setPlacing(false)
    }
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px] sm:px-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-slate-500">
          Choose a saved address, then pay securely with Razorpay (UPI, cards, netbanking).
        </p>

        <AddressesPanel
          mode="checkout"
          isAuthenticated={Boolean(user)}
          onRequireAuth={() => requireAuth(() => {})}
        />

        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-indigo-900">
          Payment is processed via Razorpay. You can pay using UPI, debit/credit card, or netbanking in the
          secure popup.
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
        <p className="mt-3 border-t border-slate-200 pt-2 text-base font-bold">Payable: Rs. {summary.total}</p>
        <Button
          className="mt-3 w-full"
          disabled={placing || lines.length === 0 || (Boolean(user) && !selectedAddressId)}
          onClick={handlePlaceOrder}
        >
          {placing ? 'Processing…' : `Pay Rs. ${summary.total}`}
        </Button>
      </aside>
    </main>
  )
}
