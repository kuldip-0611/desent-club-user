'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  ORDER_TIMELINE,
  RETURN_STATUS_LABEL,
  timelineIndex,
} from '@/lib/order-status'
import {
  cancelOrder,
  getCancellationReasons,
  downloadInvoice,
  getMyOrder,
  getOrderItemSizes,
  getOrderTracking,
  requestReturn,
  submitOrderReviews,
  submitNpsSurvey,
  type CancellationReason,
  type CancelOrderPayload,
  type ItemSizesResponse,
  type OrderItem,
  type OrderTracking,
  type ReviewInput,
  type UserOrder,
} from '@/services/order.service'
import { listProducts } from '@/services/product.service'
import { updateOrderAddress } from '@/services/order.service'
import { listMyAddresses } from '@/services/address.service'
import type { UserAddress } from '@/types/address'
import type { Product } from '@/types/product'

type OrderDetailPageModuleProps = {
  orderId: string
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

// ── Dynamic Cancel Order Modal ─────────────────────────────────────────────

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

function CancelOrderModal({
  orderId,
  submitting,
  orderItems,
  onConfirm,
  onBack,
  onAddressUpdated,
}: {
  orderId: string
  submitting: boolean
  orderItems: OrderItem[]
  onConfirm: (payload: CancelOrderPayload) => void
  onBack: () => void
  onAddressUpdated: () => void
}) {
  const [reasons, setReasons] = useState<CancellationReason[]>([])
  const [selectedReason, setSelectedReason] = useState('')
  const [otherText, setOtherText] = useState('')
  const [requestedSize, setRequestedSize] = useState('')
  const [requestedColor, setRequestedColor] = useState('')

  // Address change flow
  const [addresses, setAddresses] = useState<UserAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [addressSaving, setAddressSaving] = useState(false)

  const isVariantChange = selectedReason.toLowerCase().includes('size') || selectedReason.toLowerCase().includes('color')
  const isAddressChange = selectedReason.toLowerCase().includes('address')
  const isOther = selectedReason === 'Other'

  const firstItem = orderItems[0]

  useEffect(() => {
    getCancellationReasons().then(setReasons).catch(() => {
      setReasons([
        { id: '1', label: 'Changed my mind' },
        { id: '2', label: 'Found a better price elsewhere' },
        { id: '3', label: 'Ordered by mistake' },
        { id: '4', label: 'Delivery time is too long' },
        { id: '5', label: 'Want to change size or color' },
        { id: '6', label: 'Want to change delivery address' },
        { id: '7', label: 'Product no longer needed' },
        { id: '8', label: 'Other' },
      ])
    })
  }, [])

  // Load addresses when address-change reason is selected
  useEffect(() => {
    if (!isAddressChange) return
    setAddressesLoading(true)
    listMyAddresses()
      .then((list) => {
        setAddresses(list)
        const def = list.find((a) => a.isDefault)
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => undefined)
      .finally(() => setAddressesLoading(false))
  }, [isAddressChange])

  const handleUpdateAddress = async () => {
    if (!selectedAddressId) return
    setAddressSaving(true)
    try {
      const result = await updateOrderAddress(orderId, selectedAddressId)
      toast.success(result.message)
      onAddressUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update address')
    } finally {
      setAddressSaving(false)
    }
  }

  const canSubmit =
    selectedReason !== '' &&
    (!isOther || otherText.trim().length >= 3) &&
    (!isVariantChange || requestedSize !== '' || requestedColor !== '') &&
    !isAddressChange  // address-change uses a different action, not the cancel confirm

  const handleConfirm = () => {
    const reason = isOther ? `Other: ${otherText.trim()}` : selectedReason
    onConfirm({
      reason,
      variantChange: isVariantChange,
      requestedSize: isVariantChange && requestedSize ? requestedSize : undefined,
      requestedColor: isVariantChange && requestedColor ? requestedColor : undefined,
    })
  }

  return (
    <div className="w-full rounded-2xl border border-red-100 bg-white p-5 shadow-sm dark:border-red-900/40 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-sm text-red-600">✕</span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Cancel this order?</p>
          <p className="text-xs text-slate-500">Select a reason — some issues can be fixed without cancelling.</p>
        </div>
      </div>

      {/* Reason list */}
      {reasons.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">Loading reasons…</p>
      ) : (
        <div className="space-y-2">
          {reasons.map((r) => (
            <label
              key={r.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                selectedReason === r.label
                  ? 'border-red-400 bg-red-50 font-medium text-red-700'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                value={r.label}
                checked={selectedReason === r.label}
                onChange={() => {
                  setSelectedReason(r.label)
                  setOtherText('')
                  setRequestedSize('')
                  setRequestedColor('')
                  setSelectedAddressId('')
                }}
                className="accent-red-600"
              />
              {r.label}
            </label>
          ))}
        </div>
      )}

      {/* Other — free text */}
      {isOther && (
        <textarea
          className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          rows={2}
          placeholder="Please tell us more (min. 3 chars)…"
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
        />
      )}

      {/* Variant change — size & color picker */}
      {isVariantChange && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-800">Which size / color would you like instead?</p>
          {firstItem && (
            <p className="text-xs text-blue-600">
              Current order: <strong>{firstItem.size}</strong> · <strong>{firstItem.color}</strong>
            </p>
          )}
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">New size</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRequestedSize(requestedSize === s ? '' : s)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    requestedSize === s
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 text-slate-700 hover:border-slate-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-slate-700">New color (optional)</p>
            <input
              type="text"
              placeholder="e.g. Black, Navy, White…"
              value={requestedColor}
              onChange={(e) => setRequestedColor(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-blue-600">
            Our team will contact you to arrange the exchange after cancellation.
          </p>
        </div>
      )}

      {/* Address change — inline address picker */}
      {isAddressChange && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-semibold text-slate-800">
            📍 Change delivery address — no need to cancel!
          </p>
          <p className="text-xs text-slate-600">
            Select a saved address below and we&apos;ll update your order instantly.
          </p>
          {addressesLoading ? (
            <p className="text-xs text-slate-400">Loading your addresses…</p>
          ) : addresses.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved addresses found.{' '}
              <a href="/profile/addresses" className="font-medium text-slate-900 underline">
                Add one
              </a>{' '}
              then come back.
            </p>
          ) : (
            <div className="space-y-2">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition ${
                    selectedAddressId === addr.id
                      ? 'border-slate-900 bg-white ring-1 ring-slate-300'
                      : 'border-slate-200 bg-white hover:border-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="address-pick"
                    value={addr.id}
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-0.5 accent-slate-900"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800">
                      {addr.fullName}
                      {addr.isDefault && (
                        <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          Default
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}
                    </p>
                    <p className="text-xs text-slate-500">{addr.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onBack} disabled={addressSaving}>
              Keep original
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedAddressId || addressSaving}
              onClick={() => void handleUpdateAddress()}
            >
              {addressSaving ? 'Updating…' : 'Update & Keep Order'}
            </Button>
          </div>
        </div>
      )}

      {/* Actions — only shown when reason is NOT address change */}
      {!isAddressChange && (
        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onBack} disabled={submitting}>
            Keep order
          </Button>
          <Button
            className="flex-1 bg-red-600 hover:bg-red-700"
            disabled={!canSubmit || submitting}
            onClick={handleConfirm}
          >
            {submitting ? 'Cancelling…' : isVariantChange ? 'Cancel & Request Change' : 'Yes, cancel order'}
          </Button>
        </div>
      )}
    </div>
  )
}

export const OrderDetailPageModule = ({ orderId }: OrderDetailPageModuleProps) => {
  const router = useRouter()
  const { user, requireAuth, isAuthReady } = useAuthGuard()
  const [order, setOrder] = useState<UserOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelPayload, setCancelPayload] = useState<CancelOrderPayload>({})
  const [returnReason, setReturnReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  // Size exchange state
  // 'choose' → pick return or exchange
  // 'refund-method' → (RETURN only) pick store credit or bank refund
  // 'exchange-item' → pick which item (if multiple sized items)
  // 'exchange-size' → pick the new size
  // 'reason' → write reason (final step for both flows)
  type ReturnStep = 'choose' | 'refund-method' | 'exchange-item' | 'exchange-size' | 'reason'
  const [returnStep, setReturnStep] = useState<ReturnStep>('choose')
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN')
  const [refundMethod, setRefundMethod] = useState<'BANK' | 'STORE_CREDIT'>('BANK')
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [selectedItemForExchange, setSelectedItemForExchange] = useState<OrderItem | null>(null)
  const [itemSizes, setItemSizes] = useState<ItemSizesResponse | null>(null)
  const [itemSizesLoading, setItemSizesLoading] = useState(false)
  const [exchangeSize, setExchangeSize] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [tracking, setTracking] = useState<OrderTracking | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [npsScore, setNpsScore] = useState<number | null>(null)
  const [npsComment, setNpsComment] = useState('')
  const [npsSubmitting, setNpsSubmitting] = useState(false)
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [npsSubmitted, setNpsSubmitted] = useState(false)

  const loadOrder = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyOrder(orderId)
      setOrder(data)
      const drafts: Record<string, { rating: number; comment: string }> = {}
      const reviewed = new Set(data.actions?.reviewedItemIds ?? data.reviews?.map((r) => r.orderItemId) ?? [])
      for (const item of data.items) {
        if (!reviewed.has(item.id)) {
          drafts[item.id] = { rating: 5, comment: '' }
        }
      }
      setReviewDrafts(drafts)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load order')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!user) return
    void loadOrder()
  }, [user, loadOrder])

  const loadTracking = useCallback(async () => {
    setTrackingLoading(true)
    try {
      const t = await getOrderTracking(orderId)
      setTracking(t)
    } catch {
      // best-effort
    } finally {
      setTrackingLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (!order) return
    if (['SHIPPED', 'DELIVERED', 'PROCESSING'].includes(order.status)) {
      void loadTracking()
    }
  }, [order, loadTracking])

  const unreviewedItems = useMemo(() => {
    if (!order) return []
    const reviewed = new Set(order.actions?.reviewedItemIds ?? order.reviews?.map((r) => r.orderItemId) ?? [])
    return order.items.filter((item) => !reviewed.has(item.id))
  }, [order])

  const handleCancel = async (payload: CancelOrderPayload) => {
    if (!order) return
    setCancelPayload(payload)
    setSubmitting(true)
    try {
      await cancelOrder(order.id, payload)
      toast.success(payload.variantChange ? 'Order cancelled — our team will contact you for the exchange.' : 'Order cancelled')
      setShowCancel(false)
      await loadOrder()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not cancel order')
    } finally {
      setSubmitting(false)
    }
  }

  /** Items in the order that have a size (eligible for size exchange) */
  const sizedItems = useMemo(() => (order?.items ?? []).filter((i) => !!i.size), [order])

  const openReturnFlow = () => {
    setReturnReason('')
    setExchangeSize('')
    setSelectedItemForExchange(null)
    setItemSizes(null)
    setReturnType('RETURN')
    setRefundMethod('BANK')
    setSimilarProducts([])
    // If no items have a size just go straight to refund-method
    setReturnStep(sizedItems.length > 0 ? 'choose' : 'refund-method')
    setShowReturn(true)
  }

  const closeReturnFlow = () => {
    setShowReturn(false)
    setReturnStep('choose')
    setSimilarProducts([])
  }

  const handleChooseType = (type: 'RETURN' | 'EXCHANGE') => {
    setReturnType(type)
    if (type === 'EXCHANGE') {
      if (sizedItems.length === 1) {
        // auto-select the only sized item and load sizes
        void handleSelectItemForExchange(sizedItems[0])
      } else {
        setReturnStep('exchange-item')
      }
    } else {
      setReturnStep('refund-method')
    }
  }

  const handleSelectItemForExchange = async (item: OrderItem) => {
    setSelectedItemForExchange(item)
    setItemSizesLoading(true)
    setReturnStep('exchange-size')
    try {
      const sizes = await getOrderItemSizes(orderId, item.id)
      setItemSizes(sizes)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load sizes')
      setReturnStep('choose')
    } finally {
      setItemSizesLoading(false)
    }
  }

  const handleReturn = async () => {
    if (!order || returnReason.trim().length < 10) {
      toast.error('Please describe your return reason (min 10 characters)')
      return
    }
    if (returnType === 'EXCHANGE' && !exchangeSize) {
      toast.error('Please select the size you want to exchange to')
      return
    }
    setSubmitting(true)
    try {
      const result = await requestReturn(order.id, {
        reason: returnReason.trim(),
        type: returnType,
        orderItemId: returnType === 'EXCHANGE' ? selectedItemForExchange?.id : undefined,
        exchangeSize: returnType === 'EXCHANGE' ? exchangeSize : undefined,
        refundMethod: returnType === 'RETURN' ? refundMethod : undefined,
      })
      toast.success(result.message)
      setShowReturn(false)
      await loadOrder()
      // Fetch similar products to suggest after return
      if (returnType === 'RETURN') {
        try {
          const res = await listProducts({ limit: 8 })
          const returnedIds = new Set(order.items.map((i) => i.product?.id))
          setSimilarProducts(res.items.filter((p: Product) => !returnedIds.has(p.id)).slice(0, 4))
        } catch {
          // non-critical
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit request')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviews = async () => {
    if (!order || unreviewedItems.length === 0) return
    const reviews: ReviewInput[] = unreviewedItems.map((item) => ({
      orderItemId: item.id,
      rating: reviewDrafts[item.id]?.rating ?? 5,
      comment: reviewDrafts[item.id]?.comment?.trim() || undefined,
    }))
    setSubmitting(true)
    try {
      await submitOrderReviews(order.id, reviews)
      toast.success('Reviews submitted — thank you!')
      await loadOrder()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit reviews')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNpsSubmit = async () => {
    if (!order || npsScore === null) return
    setNpsSubmitting(true)
    try {
      await submitNpsSurvey(order.id, npsScore, npsComment.trim() || undefined)
      setNpsSubmitted(true)
    } catch {
      toast.error('Could not submit feedback. Please try again.')
    } finally {
      setNpsSubmitting(false)
    }
  }

  if (!isAuthReady) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500 sm:px-6">Loading order…</main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Sign in to view order details.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => router.push(`/orders/${orderId}`))}>
            Sign in
          </Button>
        </div>
      </main>
    )
  }

  if (loading || !order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500 sm:px-6">
        {loading ? 'Loading order…' : 'Order not found.'}
      </main>
    )
  }

  const currentStep = timelineIndex(order.status)
  const latestReturn = order.returnRequests?.[0]
  const address = order.shippingAddress

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-slate-700 hover:underline dark:text-slate-300">
            ← Back to orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-sm text-slate-500">Placed {formatDate(order.createdAt)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${ORDER_STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-700'}`}
        >
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && order.status !== 'PENDING' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-5 text-sm font-semibold text-slate-700 dark:text-slate-200">Order progress</p>
          <div className="relative flex items-start justify-between">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-slate-900 transition-all duration-500 dark:bg-white"
              style={{ width: `${(currentStep / (ORDER_TIMELINE.length - 1)) * 100}%` }}
              aria-hidden="true"
            />
            {ORDER_TIMELINE.map((step, index) => {
              const done = currentStep >= index
              const active = currentStep === index
              const icons = ['📦', '⚙️', '🚚', '✅']
              return (
                <div key={step.key} className="relative z-10 flex flex-1 flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm transition-all duration-300 ${
                      done
                        ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                        : 'border-slate-300 bg-white text-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-500'
                    } ${active ? 'ring-4 ring-slate-200 dark:ring-slate-600' : ''}`}
                  >
                    {done ? <span>{icons[index]}</span> : <span className="text-xs">{index + 1}</span>}
                  </div>
                  <p
                    className={`mt-2 max-w-[64px] text-[10px] leading-tight sm:text-xs ${
                      done ? 'font-semibold text-slate-900' : 'text-slate-400'
                    } ${active ? 'text-slate-900' : ''}`}
                  >
                    {step.label}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      {/* ── Shipment tracking ───────────────────────────────────────── */}
      {['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Shipment &amp; tracking</p>
            {!trackingLoading && (
              <button
                type="button"
                className="text-xs text-slate-600 hover:underline"
                onClick={() => void loadTracking()}
              >
                Refresh
              </button>
            )}
          </div>

          {trackingLoading ? (
            <p className="mt-3 text-sm text-slate-400">Loading tracking info…</p>
          ) : tracking ? (
            <div className="mt-3 space-y-3 text-sm">
              {tracking.awbCode ? (
                <>
                  <div className="flex flex-wrap gap-4">
                    <div>
                      <p className="text-xs text-slate-500">AWB / Tracking Number</p>
                      <p className="font-mono font-medium">{tracking.awbCode}</p>
                    </div>
                    {tracking.courierName ? (
                      <div>
                        <p className="text-xs text-slate-500">Courier</p>
                        <p className="font-medium">{tracking.courierName}</p>
                      </div>
                    ) : null}
                  </div>
                  {tracking.trackingUrl && !tracking.trackingUrl.startsWith('sr_shipment:') ? (
                    <a
                      href={tracking.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                    >
                      Track on Shiprocket ↗
                    </a>
                  ) : null}
                  {/* Live tracking events from Shiprocket */}
                  {tracking.shiprocketTracking ? (() => {
                    const activities = (
                      (tracking.shiprocketTracking as Record<string, unknown>)?.tracking_data as Record<string, unknown>
                    )?.shipment_track_activities as { date: string; activity: string; location: string }[] | undefined
                    if (activities && activities.length > 0) {
                      return (
                        <div className="mt-2">
                          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Activity log
                          </p>
                          <ol className="relative border-l border-slate-200 pl-4 dark:border-slate-700">
                            {activities.slice(0, 6).map((act, i) => (
                              <li key={i} className="mb-3 ml-1">
                                <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-slate-900 dark:bg-white" />
                                <p className="font-medium text-slate-800">{act.activity}</p>
                                <p className="text-xs text-slate-500">
                                  {act.location} · {act.date}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )
                    }
                    return null
                  })() : null}
                </>
              ) : (
                <p className="text-slate-500">
                  {order.status === 'PROCESSING'
                    ? 'Your order is being prepared. Tracking details will appear once shipped.'
                    : 'Tracking details are being updated — check back soon.'}
                </p>
              )}
            </div>
          ) : null}
        </section>
      ) : null}

      {order.status === 'CANCELLED' && order.cancelReason ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          Cancelled: {order.cancelReason}
        </div>
      ) : null}

      {latestReturn ? (
        <div
          className={`rounded-xl border p-4 text-sm ${
            latestReturn.type === 'EXCHANGE'
              ? 'border-slate-200 bg-slate-50 text-slate-900'
              : 'border-amber-100 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">
              {RETURN_STATUS_LABEL[latestReturn.status] ?? latestReturn.status}
            </p>
            {latestReturn.type === 'EXCHANGE' ? (
              <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                🔄 Size Exchange → {latestReturn.exchangeSize}
              </span>
            ) : (
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                ↩️ Return for Refund
              </span>
            )}
          </div>
          <p className="mt-1 opacity-80">{latestReturn.reason}</p>

          {/* Pickup tracking */}
          {latestReturn.returnAwbCode && (
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              <span className="opacity-60">Pickup AWB:</span>
              <a
                href={`https://shiprocket.co/tracking/${latestReturn.returnAwbCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold underline underline-offset-2"
              >
                {latestReturn.returnAwbCode}
              </a>
              {latestReturn.returnCourierName && (
                <span className="opacity-60">({latestReturn.returnCourierName})</span>
              )}
            </div>
          )}

          {/* Exchange dispatch tracking */}
          {latestReturn.exchangeAwbCode && (
            <div className="mt-1 flex items-center gap-1.5 text-xs">
              <span className="opacity-60">New item AWB:</span>
              <a
                href={`https://shiprocket.co/tracking/${latestReturn.exchangeAwbCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-semibold text-slate-900 underline underline-offset-2"
              >
                {latestReturn.exchangeAwbCode}
              </a>
              {latestReturn.exchangeCourierName && (
                <span className="opacity-60">({latestReturn.exchangeCourierName})</span>
              )}
            </div>
          )}

          {latestReturn.adminNote ? (
            <p className="mt-2 text-xs opacity-70">Admin note: {latestReturn.adminNote}</p>
          ) : null}
        </div>
      ) : null}

      {address ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="font-semibold">Delivery address</p>
          <p className="mt-2 text-slate-600">
            {address.fullName} · {address.phone}
            <br />
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.state} {address.pincode}, {address.country}
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <p className="mb-3 font-semibold">Items</p>
        <ul className="space-y-3">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              {item.product.images[0] ? (
                <img
                  src={item.product.images[0].path}
                  alt={item.product.name}
                  className="h-14 w-14 rounded-lg object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-slate-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.product.name}</p>
                <p className="text-xs text-slate-500">
                  {[item.size, item.color].filter(Boolean).join(' · ')} · Qty {item.quantity}
                </p>
              </div>
              <p className="font-medium">Rs. {item.total}</p>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600 dark:border-slate-700">
          <p>Subtotal: Rs. {order.subtotal}</p>
          {Number(order.discountAmount) > 0 ? <p>Discount: -Rs. {order.discountAmount}</p> : null}
          <p className="font-bold text-slate-900">Total: Rs. {order.total}</p>
          <p className="text-xs">
            Payment: {order.payment?.status === 'PAID' ? 'Paid' : order.payment?.status ?? 'Pending'}
          </p>
        </div>
      </section>

      {order.reviews && order.reviews.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="mb-3 font-semibold">Your reviews</p>
          <ul className="space-y-3">
            {order.reviews.map((review) => (
              <li key={review.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
                <p className="font-medium">{review.product.name}</p>
                <p className="text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                {review.comment ? <p className="mt-1 text-slate-600">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {order.actions?.canReview && unreviewedItems.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="font-semibold text-slate-900">Rate your purchase</p>
          <p className="mt-1 text-sm text-slate-600">Share your experience — it helps other shoppers.</p>
          <div className="mt-4 space-y-4">
            {unreviewedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-600 dark:bg-slate-900">
                <p className="text-sm font-medium">{item.product.name}</p>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`text-xl ${(reviewDrafts[item.id]?.rating ?? 5) >= star ? 'text-amber-500' : 'text-slate-300'}`}
                      onClick={() =>
                        setReviewDrafts((prev) => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], rating: star, comment: prev[item.id]?.comment ?? '' },
                        }))
                      }
                    >
                      ★
                    </button>
                  ))}
                </div>
                <Input
                  className="mt-2"
                  placeholder="Write a review (optional)"
                  value={reviewDrafts[item.id]?.comment ?? ''}
                  onChange={(e) =>
                    setReviewDrafts((prev) => ({
                      ...prev,
                      [item.id]: { rating: prev[item.id]?.rating ?? 5, comment: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <Button className="mt-4" disabled={submitting} onClick={() => void handleReviews()}>
            Submit reviews
          </Button>
        </section>
      ) : null}

      {/* ── NPS Survey (shown for DELIVERED orders) ── */}
      {order.status === 'DELIVERED' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          {npsSubmitted ? (
            <p className="text-sm font-medium text-emerald-700">
              Thank you for your feedback! It helps us improve.
            </p>
          ) : (
            <>
              <p className="font-semibold">How was your experience?</p>
              <p className="mt-0.5 text-sm text-slate-500">Rate your overall satisfaction (0 = terrible, 10 = excellent)</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {Array.from({ length: 11 }, (_, i) => i).map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition ${
                      npsScore === score
                        ? score >= 9
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : score >= 7
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-red-500 bg-red-500 text-white'
                        : 'border-slate-200 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-200 dark:hover:border-slate-400'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {npsScore !== null && (
                <div className="mt-3 space-y-2">
                  <textarea
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-900"
                    rows={2}
                    placeholder="Tell us more (optional)…"
                    value={npsComment}
                    onChange={(e) => setNpsComment(e.target.value)}
                  />
                  <Button disabled={npsSubmitting} onClick={() => void handleNpsSubmit()}>
                    {npsSubmitting ? 'Submitting…' : 'Submit feedback'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="flex flex-wrap gap-3">
        {/* Invoice download */}
        <button
          type="button"
          disabled={invoiceLoading}
          onClick={async () => {
            setInvoiceLoading(true)
            try {
              await downloadInvoice(order.id)
            } catch {
              toast.error('Failed to download invoice. Please try again.')
            } finally {
              setInvoiceLoading(false)
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-900 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white dark:bg-slate-900 dark:text-white dark:hover:bg-white dark:hover:text-slate-900"
        >
          <FileDown className={`h-4 w-4 ${invoiceLoading ? 'animate-bounce' : ''}`} />
          {invoiceLoading ? 'Downloading…' : 'Download Invoice'}
        </button>

        {order.actions?.canCancel ? (
          showCancel ? (
            <CancelOrderModal
              orderId={orderId}
              submitting={submitting}
              orderItems={order.items}
              onConfirm={(payload) => void handleCancel(payload)}
              onBack={() => { setShowCancel(false); setCancelPayload({}) }}
              onAddressUpdated={() => { setShowCancel(false); void loadOrder() }}
            />
          ) : (
            <Button variant="outline" onClick={() => setShowCancel(true)}>
              Cancel order
            </Button>
          )
        ) : null}

        {order.actions?.canReturn ? (
          showReturn ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              {/* ── Step: choose return or exchange ── */}
              {returnStep === 'choose' && (
                <>
                  <p className="text-sm font-semibold text-slate-800">What would you like to do?</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Some items in this order were purchased with a size. You can return for a refund or swap for a
                    different size.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleChooseType('RETURN')}
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 text-center transition hover:border-slate-900 hover:bg-slate-50"
                    >
                      <span className="text-2xl">↩️</span>
                      <span className="text-sm font-semibold text-slate-800">Return for refund</span>
                      <span className="text-xs text-slate-500">Get your money back</span>
                    </button>
                    <button
                      onClick={() => handleChooseType('EXCHANGE')}
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 text-center transition hover:border-slate-900 hover:bg-slate-50"
                    >
                      <span className="text-2xl">🔄</span>
                      <span className="text-sm font-semibold text-slate-800">Exchange size</span>
                      <span className="text-xs text-slate-500">Swap for bigger or smaller</span>
                    </button>
                  </div>
                  <Button variant="outline" className="mt-3" onClick={closeReturnFlow}>
                    Back
                  </Button>
                </>
              )}

              {/* ── Step: refund method (RETURN flow only) ── */}
              {returnStep === 'refund-method' && (
                <>
                  <p className="text-sm font-semibold text-slate-800">How would you like your refund?</p>
                  <p className="mt-0.5 text-xs text-slate-500">Choose the option that works best for you.</p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRefundMethod('STORE_CREDIT')}
                      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                        refundMethod === 'STORE_CREDIT'
                          ? 'border-green-500 bg-green-50'
                          : 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                      }`}
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="text-sm font-semibold text-slate-800">Store Credit</span>
                      <span className="text-xs text-slate-500">Instant · Use on next order</span>
                      <span className="mt-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                        INSTANT
                      </span>
                    </button>
                    <button
                      onClick={() => setRefundMethod('BANK')}
                      className={`flex flex-col items-start gap-1 rounded-xl border-2 p-4 text-left transition ${
                        refundMethod === 'BANK'
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 hover:border-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl">🏦</span>
                      <span className="text-sm font-semibold text-slate-800">Bank Refund</span>
                      <span className="text-xs text-slate-500">Back to original payment method</span>
                      <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        5-7 DAYS
                      </span>
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReturnStep(sizedItems.length > 0 ? 'choose' : 'choose')}
                    >
                      Back
                    </Button>
                    <Button onClick={() => setReturnStep('reason')}>Continue</Button>
                  </div>
                </>
              )}

              {/* ── Step: pick which item to exchange ── */}
              {returnStep === 'exchange-item' && (
                <>
                  <p className="text-sm font-semibold text-slate-800">Which item do you want to exchange?</p>
                  <div className="mt-3 space-y-2">
                    {sizedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => void handleSelectItemForExchange(item)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-slate-900 hover:bg-slate-50"
                      >
                        {item.product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.product.images[0].path}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                          <p className="text-xs text-slate-500">
                            Size: <span className="font-semibold text-slate-900">{item.size}</span>
                            {item.color ? ` · ${item.color}` : ''} · Qty {item.quantity}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" className="mt-3" onClick={() => setReturnStep('choose')}>
                    Back
                  </Button>
                </>
              )}

              {/* ── Step: pick new size ── */}
              {returnStep === 'exchange-size' && (
                <>
                  <p className="text-sm font-semibold text-slate-800">
                    Select a different size for{' '}
                    <span className="text-slate-900">{selectedItemForExchange?.product.name}</span>
                  </p>
                  {itemSizes && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      Current size:{' '}
                      <span className="font-semibold text-slate-700">{itemSizes.currentSize}</span>
                    </p>
                  )}
                  {itemSizesLoading ? (
                    <p className="mt-4 text-center text-sm text-slate-400">Loading available sizes…</p>
                  ) : itemSizes && itemSizes.availableSizes.length === 0 ? (
                    <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                      No other sizes are in stock for this product right now. You can still request a refund instead.
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {itemSizes?.availableSizes.map((s) => (
                        <button
                          key={s.size}
                          onClick={() => {
                            setExchangeSize(s.size)
                            setReturnStep('reason')
                          }}
                          className={`rounded-lg border-2 px-4 py-2 text-sm font-semibold transition ${
                            exchangeSize === s.size
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 text-slate-700 hover:border-slate-900'
                          }`}
                        >
                          {s.size}
                          <span className="ml-1 text-xs font-normal opacity-70">({s.quantity} left)</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() =>
                      setReturnStep(sizedItems.length > 1 ? 'exchange-item' : 'choose')
                    }
                  >
                    Back
                  </Button>
                </>
              )}

              {/* ── Step: reason (final) ── */}
              {returnStep === 'reason' && (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    {returnType === 'EXCHANGE' ? (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-900">
                        🔄 Size Exchange → {exchangeSize}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                        ↩️ Return for Refund
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-800">
                    {returnType === 'EXCHANGE'
                      ? 'Tell us why the current size doesn\'t fit (min 10 characters)'
                      : 'Return reason (min 10 characters)'}
                  </p>
                  <textarea
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-slate-900"
                    rows={3}
                    placeholder={
                      returnType === 'EXCHANGE'
                        ? 'e.g. The M size is too tight, I need an L...'
                        : 'Describe the issue — wrong size, damaged item, etc.'
                    }
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setReturnStep(
                          returnType === 'EXCHANGE' ? 'exchange-size' : 'refund-method',
                        )
                      }
                    >
                      Back
                    </Button>
                    <Button disabled={submitting} onClick={() => void handleReturn()}>
                      {returnType === 'EXCHANGE' ? 'Submit exchange request' : 'Submit return request'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button variant="outline" onClick={openReturnFlow}>
              Request return
            </Button>
          )
        ) : null}
      </section>

      {/* ── Similar Products (shown after return submitted) ── */}
      {similarProducts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800">You might also like</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Shop similar products — your store credit will be applied automatically at checkout.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {similarProducts.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group rounded-xl border border-slate-100 bg-slate-50 p-2 transition hover:border-slate-900 hover:bg-slate-50"
              >
                {product.images?.[0] && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0] as { path: string }).path}
                    alt={product.name}
                    className="h-28 w-full rounded-lg object-cover"
                  />
                )}
                <p className="mt-2 truncate text-xs font-semibold text-slate-800 group-hover:text-slate-900">
                  {product.name}
                </p>
                <p className="text-xs text-slate-500">
                  ₹{Number(product.price).toLocaleString('en-IN')}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
