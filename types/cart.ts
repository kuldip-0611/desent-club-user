export type CartLine = {
  lineId: string
  productId: string
  variantId: string
  name: string
  slug: string
  image: string
  size: string
  color: string
  unitPrice: number
  quantity: number
}

export type CartSummary = {
  subtotal: number
  discount: number
  shipping: number
  gst: number
  total: number
}
