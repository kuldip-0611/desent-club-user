import { apiClient } from '@/services/api/client'

export type CreateOrderItem = {
  productId: string
  variantId?: string
  size?: string
  color?: string
  quantity: number
}

export type CreateOrderPayload = {
  items: CreateOrderItem[]
  addressId?: string
  couponCode?: string
  notes?: string
  paymentMethod?: 'COD' | 'ONLINE'
  affiliateCode?: string
  loyaltyPoints?: number
  storeCreditAmount?: number
}

export type CreateOrderResponse = {
  orderId: string
  paymentMethod: 'COD' | 'ONLINE'
  razorpayOrderId?: string
  amount: number
  currency: string
  keyId?: string
}

export type VerifyPaymentPayload = {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export type VerifyPaymentResponse = {
  message: string
  orderId: string
}

export const createOrder = async (payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
  const { data } = await apiClient.post<CreateOrderResponse>('/orders', payload)
  return data
}

export const verifyPayment = async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> => {
  const { data } = await apiClient.post<VerifyPaymentResponse>('/orders/verify-payment', payload)
  return data
}

export type OrderItem = {
  id: string
  productId: string
  variantId?: string | null
  size: string
  color: string
  quantity: number
  unitPrice: string
  total: string
  product: {
    id: string
    name: string
    images: { path: string }[]
  }
}

export type OrderReview = {
  id: string
  orderItemId: string
  rating: number
  comment: string | null
  product: { id: string; name: string; images: { path: string }[] }
}

export type OrderReturnRequest = {
  id: string
  status: string
  reason: string
  type?: 'RETURN' | 'EXCHANGE'
  exchangeSize?: string | null
  orderItemId?: string | null
  adminNote: string | null
  returnAwbCode?: string | null
  returnCourierName?: string | null
  exchangeAwbCode?: string | null
  exchangeCourierName?: string | null
  createdAt: string
}

export type OrderActions = {
  canCancel: boolean
  canReturn: boolean
  canReview: boolean
  returnStatus: string | null
  returnId: string | null
  reviewedItemIds: string[]
}

export type ShippingAddress = {
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  pincode: string
  country: string
}

export type UserOrder = {
  id: string
  status: string
  subtotal: string
  discountAmount: string
  total: string
  createdAt: string
  deliveredAt?: string | null
  cancelledAt?: string | null
  cancelReason?: string | null
  shippingAddress?: ShippingAddress | null
  awbCode?: string | null
  courierName?: string | null
  trackingUrl?: string | null
  items: OrderItem[]
  payment: { status: string; razorpayPaymentId: string | null } | null
  returnRequests?: OrderReturnRequest[]
  reviews?: OrderReview[]
  actions?: OrderActions
}

export type OrderTracking = {
  status: string
  awbCode: string | null
  courierName: string | null
  trackingUrl: string | null
  shiprocketTracking: Record<string, unknown> | null
}

export type UserOrdersResponse = {
  items: UserOrder[]
  total: number
  page: number
  totalPages: number
  hasNextPage: boolean
}

export type ReviewInput = {
  orderItemId: string
  rating: number
  comment?: string
}

export const listMyOrders = async (page = 1, limit = 10): Promise<UserOrdersResponse> => {
  const { data } = await apiClient.get<UserOrdersResponse>('/orders/my', { params: { page, limit } })
  return data
}

export const getMyOrder = async (orderId: string): Promise<UserOrder> => {
  const { data } = await apiClient.get<UserOrder>(`/orders/my/${orderId}`)
  return data
}

export type CancelOrderPayload = {
  reason?: string
  variantChange?: boolean
  requestedSize?: string
  requestedColor?: string
}

export const cancelOrder = async (orderId: string, payload?: CancelOrderPayload): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/orders/my/${orderId}/cancel`, payload ?? {})
  return data
}

export type CancellationReason = { id: string; label: string }

export const getCancellationReasons = async (): Promise<CancellationReason[]> => {
  const { data } = await apiClient.get<CancellationReason[]>('/cancellation-reasons')
  return data
}

export type ReturnRequestPayload = {
  reason: string
  type?: 'RETURN' | 'EXCHANGE'
  orderItemId?: string
  exchangeSize?: string
  refundMethod?: 'BANK' | 'STORE_CREDIT'
}

export const requestReturn = async (
  orderId: string,
  payload: ReturnRequestPayload,
): Promise<{ message: string; returnId: string }> => {
  const { data } = await apiClient.post<{ message: string; returnId: string }>(
    `/orders/my/${orderId}/return`,
    payload,
  )
  return data
}

export type ItemSizesResponse = {
  currentSize: string
  availableSizes: { size: string; quantity: number }[]
}

export const getOrderItemSizes = async (orderId: string, itemId: string): Promise<ItemSizesResponse> => {
  const { data } = await apiClient.get<ItemSizesResponse>(`/orders/my/${orderId}/items/${itemId}/sizes`)
  return data
}

export const getOrderTracking = async (orderId: string): Promise<OrderTracking> => {
  const { data } = await apiClient.get<OrderTracking>(`/orders/my/${orderId}/track`)
  return data
}

export const submitOrderReviews = async (
  orderId: string,
  reviews: ReviewInput[],
): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/orders/my/${orderId}/reviews`, { reviews })
  return data
}

export const downloadInvoice = async (orderId: string): Promise<void> => {
  const response = await apiClient.get(`/orders/my/${orderId}/invoice`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data as BlobPart], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `invoice-${orderId.slice(-8).toUpperCase()}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const submitNpsSurvey = async (
  orderId: string,
  score: number,
  comment?: string,
): Promise<void> => {
  await apiClient.post(`/orders/my/${orderId}/nps`, { score, comment })
}

export const updateOrderAddress = async (
  orderId: string,
  addressId: string,
): Promise<{ message: string }> => {
  const { data } = await apiClient.patch<{ message: string }>(`/orders/my/${orderId}/address`, { addressId })
  return data
}
