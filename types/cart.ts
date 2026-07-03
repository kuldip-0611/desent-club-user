export type CartLine = {
  lineId: string
  productId: string
  variantId: string
  categoryId?: string
  name: string
  slug: string
  image: string
  size: string
  color: string
  unitPrice: number
  quantity: number
  // Combo fields — set when this line is part of a combo
  comboId?: string
  comboName?: string
}

export type CartSummary = {
  subtotal: number
  discount: number
  shipping: number
  gst: number
  total: number
}
