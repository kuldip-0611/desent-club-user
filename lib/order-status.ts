export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending payment',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-slate-100 text-slate-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
}

export const RETURN_STATUS_LABEL: Record<string, string> = {
  REQUESTED: 'Return / exchange requested',
  APPROVED: 'Approved — pickup scheduled',
  REJECTED: 'Request rejected',
  RECEIVED: 'Item received at warehouse',
  REFUNDED: 'Refund processed',
  EXCHANGED: 'New size dispatched 🚚',
}

export const ORDER_TIMELINE = [
  { key: 'CONFIRMED', label: 'Order placed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
] as const

export const timelineIndex = (status: string): number => {
  if (status === 'CANCELLED' || status === 'REFUNDED' || status === 'PENDING') return -1
  const idx = ORDER_TIMELINE.findIndex((s) => s.key === status)
  return idx >= 0 ? idx : ORDER_TIMELINE.length - 1
}
