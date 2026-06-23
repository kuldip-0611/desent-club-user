export type RazorpaySuccessResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayPrefill = {
  name?: string
  email?: string
  contact?: string
}

type OpenRazorpayCheckoutParams = {
  keyId: string
  amount: number
  currency: string
  razorpayOrderId: string
  name?: string
  description?: string
  prefill?: RazorpayPrefill
  onSuccess: (response: RazorpaySuccessResponse) => void | Promise<void>
  onDismiss?: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void
      on: (event: string, handler: (response: unknown) => void) => void
    }
  }
}

export const loadRazorpayScript = (): Promise<boolean> =>
  new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const existing = document.querySelector('script[data-razorpay-checkout]')
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.razorpayCheckout = 'true'
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export const openRazorpayCheckout = async ({
  keyId,
  amount,
  currency,
  razorpayOrderId,
  name = 'Disent Club',
  description = 'Order payment',
  prefill,
  onSuccess,
  onDismiss,
}: OpenRazorpayCheckoutParams): Promise<void> => {
  const loaded = await loadRazorpayScript()
  if (!loaded || !window.Razorpay) {
    throw new Error('Could not load Razorpay checkout. Check your connection and try again.')
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: keyId,
      amount,
      currency,
      name,
      description,
      order_id: razorpayOrderId,
      prefill,
      theme: { color: '#4f46e5' },
      handler: async (response: RazorpaySuccessResponse) => {
        try {
          await onSuccess(response)
          resolve()
        } catch (error) {
          reject(error)
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.()
          reject(new Error('Payment cancelled'))
        },
      },
    })

    rzp.on('payment.failed', (response: unknown) => {
      const failed = response as { error?: { description?: string } }
      const message = failed?.error?.description ?? 'Payment failed'
      reject(new Error(message))
    })

    rzp.open()
  })
}
