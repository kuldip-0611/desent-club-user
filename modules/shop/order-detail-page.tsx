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
  getMyOrder,
  getOrderItemSizes,
  getOrderTracking,
  requestReturn,
  submitOrderReviews,
  type ItemSizesResponse,
  type OrderItem,
  type OrderTracking,
  type ReviewInput,
  type UserOrder,
} from '@/services/order.service'

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

export const OrderDetailPageModule = ({ orderId }: OrderDetailPageModuleProps) => {
  const router = useRouter()
  const { user, requireAuth, isAuthReady } = useAuthGuard()
  const [order, setOrder] = useState<UserOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelReason, setCancelReason] = useState('')
  const [returnReason, setReturnReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  // Size exchange state
  // 'choose' → pick return or exchange
  // 'exchange-item' → pick which item (if multiple sized items)
  // 'exchange-size' → pick the new size
  // 'reason' → write reason (final step for both flows)
  type ReturnStep = 'choose' | 'exchange-item' | 'exchange-size' | 'reason'
  const [returnStep, setReturnStep] = useState<ReturnStep>('choose')
  const [returnType, setReturnType] = useState<'RETURN' | 'EXCHANGE'>('RETURN')
  const [selectedItemForExchange, setSelectedItemForExchange] = useState<OrderItem | null>(null)
  const [itemSizes, setItemSizes] = useState<ItemSizesResponse | null>(null)
  const [itemSizesLoading, setItemSizesLoading] = useState(false)
  const [exchangeSize, setExchangeSize] = useState('')
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { rating: number; comment: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [tracking, setTracking] = useState<OrderTracking | null>(null)
  const [trackingLoading, setTrackingLoading] = useState(false)

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

  const handleCancel = async () => {
    if (!order) return
    setSubmitting(true)
    try {
      await cancelOrder(order.id, cancelReason.trim() || undefined)
      toast.success('Order cancelled')
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
    // If no items have a size just go straight to reason
    setReturnStep(sizedItems.length > 0 ? 'choose' : 'reason')
    setShowReturn(true)
  }

  const closeReturnFlow = () => {
    setShowReturn(false)
    setReturnStep('choose')
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
      setReturnStep('reason')
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
      })
      toast.success(result.message)
      closeReturnFlow()
      await loadOrder()
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

  if (!isAuthReady) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 text-sm text-slate-500 sm:px-6">Loading order…</main>
    )
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
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
          <Link href="/orders" className="text-sm text-indigo-600 hover:underline">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-slate-700">Order progress</p>
          <div className="flex items-center justify-between gap-2">
            {ORDER_TIMELINE.map((step, index) => {
              const done = currentStep >= index
              const active = currentStep === index
              return (
                <div key={step.key} className="flex flex-1 flex-col items-center text-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                    } ${active ? 'ring-2 ring-indigo-300' : ''}`}
                  >
                    {index + 1}
                  </div>
                  <p className={`mt-2 text-[10px] sm:text-xs ${done ? 'text-slate-800' : 'text-slate-400'}`}>
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Shipment &amp; tracking</p>
            {!trackingLoading && (
              <button
                type="button"
                className="text-xs text-indigo-600 hover:underline"
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
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
                          <ol className="relative border-l border-slate-200 pl-4">
                            {activities.slice(0, 6).map((act, i) => (
                              <li key={i} className="mb-3 ml-1">
                                <div className="absolute -left-1.5 h-3 w-3 rounded-full bg-indigo-500" />
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
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{RETURN_STATUS_LABEL[latestReturn.status] ?? latestReturn.status}</p>
            {latestReturn.type === 'EXCHANGE' ? (
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                🔄 Size Exchange → {latestReturn.exchangeSize}
              </span>
            ) : (
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                ↩️ Return for Refund
              </span>
            )}
          </div>
          <p className="mt-1 text-amber-800">{latestReturn.reason}</p>
          {latestReturn.adminNote ? (
            <p className="mt-2 text-xs text-amber-700">Admin note: {latestReturn.adminNote}</p>
          ) : null}
        </div>
      ) : null}

      {address ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
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
        <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
          <p>Subtotal: Rs. {order.subtotal}</p>
          {Number(order.discountAmount) > 0 ? <p>Discount: -Rs. {order.discountAmount}</p> : null}
          <p className="font-bold text-slate-900">Total: Rs. {order.total}</p>
          <p className="text-xs">
            Payment: {order.payment?.status === 'PAID' ? 'Paid' : order.payment?.status ?? 'Pending'}
          </p>
        </div>
      </section>

      {order.reviews && order.reviews.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-3 font-semibold">Your reviews</p>
          <ul className="space-y-3">
            {order.reviews.map((review) => (
              <li key={review.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                <p className="font-medium">{review.product.name}</p>
                <p className="text-amber-600">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                {review.comment ? <p className="mt-1 text-slate-600">{review.comment}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {order.actions?.canReview && unreviewedItems.length > 0 ? (
        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5">
          <p className="font-semibold text-indigo-900">Rate your purchase</p>
          <p className="mt-1 text-sm text-indigo-800">Share your experience — it helps other shoppers.</p>
          <div className="mt-4 space-y-4">
            {unreviewedItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-indigo-100 bg-white p-4">
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

      <section className="flex flex-wrap gap-3">
        {/* Invoice download */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/orders/my/${order.id}/invoice`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
        >
          <FileDown className="h-4 w-4" />
          Download Invoice
        </a>

        {order.actions?.canCancel ? (
          showCancel ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-medium">Why are you cancelling?</p>
              <Input
                className="mt-2"
                placeholder="Optional reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setShowCancel(false)}>
                  Back
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700"
                  disabled={submitting}
                  onClick={() => void handleCancel()}
                >
                  Confirm cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setShowCancel(true)}>
              Cancel order
            </Button>
          )
        ) : null}

        {order.actions?.canReturn ? (
          showReturn ? (
            <div className="w-full rounded-2xl border border-slate-200 bg-white p-4">
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
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
                    >
                      <span className="text-2xl">↩️</span>
                      <span className="text-sm font-semibold text-slate-800">Return for refund</span>
                      <span className="text-xs text-slate-500">Get your money back</span>
                    </button>
                    <button
                      onClick={() => handleChooseType('EXCHANGE')}
                      className="flex flex-col items-center gap-2 rounded-xl border-2 border-slate-200 p-4 text-center transition hover:border-indigo-400 hover:bg-indigo-50"
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

              {/* ── Step: pick which item to exchange ── */}
              {returnStep === 'exchange-item' && (
                <>
                  <p className="text-sm font-semibold text-slate-800">Which item do you want to exchange?</p>
                  <div className="mt-3 space-y-2">
                    {sizedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => void handleSelectItemForExchange(item)}
                        className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50"
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
                            Size: <span className="font-semibold text-indigo-600">{item.size}</span>
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
                    <span className="text-indigo-600">{selectedItemForExchange?.product.name}</span>
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
                              ? 'border-indigo-500 bg-indigo-500 text-white'
                              : 'border-slate-200 text-slate-700 hover:border-indigo-400'
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
                      <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
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
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400"
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
                          returnType === 'EXCHANGE' ? 'exchange-size' : sizedItems.length > 0 ? 'choose' : 'choose',
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
    </main>
  )
}
