/** List price and discounted amount for display (e.g. storefront cards). */
export function pricingFromList(
  listPrice: number,
  discountPercent?: number | null,
): { listPrice: number; salePrice: number; discountPercent: number | null } {
  const d =
    discountPercent != null && discountPercent > 0
      ? Math.min(100, Math.floor(discountPercent))
      : null
  const salePrice =
    d != null ? Math.round(listPrice * (100 - d)) / 100 : listPrice
  return { listPrice, salePrice, discountPercent: d }
}
