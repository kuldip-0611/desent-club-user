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
}

export type CreateOrderResponse = {
  orderId: string
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
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
  adminNote: string | null
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
  items: OrderItem[]
  payment: { status: string; razorpayPaymentId: string | null } | null
  returnRequests?: OrderReturnRequest[]
  reviews?: OrderReview[]
  actions?: OrderActions
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

export const cancelOrder = async (orderId: string, reason?: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/orders/my/${orderId}/cancel`, { reason })
  return data
}

export const requestReturn = async (orderId: string, reason: string): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/orders/my/${orderId}/return`, { reason })
  return data
}

export const submitOrderReviews = async (
  orderId: string,
  reviews: ReviewInput[],
): Promise<{ message: string }> => {
  const { data } = await apiClient.post<{ message: string }>(`/orders/my/${orderId}/reviews`, { reviews })
  return data
}
