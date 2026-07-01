import { apiClient } from '@/services/api/client'

export type BundleProductInfo = {
  productId: string
  name: string
  slug: string | null
  price: number
  discountPercent: number | null
  image: string | null
}

export type ActiveBundle = {
  id: string
  name: string
  description: string | null
  discountType: 'PERCENT' | 'FLAT'
  discountValue: number
  minItems: number
  productIds: string[]
  products: BundleProductInfo[]
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

type ApiBundleProduct = {
  productId: string
  product: {
    id: string
    name: string
    slug: string | null
    price: number
    discountPercent: number | null
    images: { path: string }[]
  }
}
type ApiBundle = Omit<ActiveBundle, 'productIds' | 'products'> & { products: ApiBundleProduct[] }

export const getActiveBundles = async (): Promise<ActiveBundle[]> => {
  try {
    const { data } = await apiClient.get<ApiBundle[]>('/bundles/active')
    return (data ?? []).map((b) => ({
      ...b,
      productIds: (b.products ?? []).map((p) => p.productId),
      products: (b.products ?? []).map((p) => ({
        productId: p.productId,
        name: p.product.name,
        slug: p.product.slug,
        price: Number(p.product.price),
        discountPercent: p.product.discountPercent,
        image: p.product.images?.[0]?.path ?? null,
      })),
    }))
  } catch {
    return []
  }
}

export type CartBundleResult = {
  bundleId: string
  bundleName: string
  discountType: 'PERCENT' | 'FLAT'
  discountValue: number
  matchedProductIds: string[]
} | null

export const checkCartBundle = async (productIds: string[]): Promise<CartBundleResult> => {
  if (!productIds.length) return null
  try {
    const { data } = await apiClient.get<{
      bundleId: string | null
      bundleName: string | null
      discountType: string | null
      discountValue: number | null
      matchedProductIds: string[]
    }>('/bundles/cart-discount', { params: { productIds: productIds.join(',') } })
    if (!data.bundleId) return null
    return {
      bundleId: data.bundleId,
      bundleName: data.bundleName!,
      discountType: data.discountType as 'PERCENT' | 'FLAT',
      discountValue: data.discountValue!,
      matchedProductIds: data.matchedProductIds,
    }
  } catch {
    return null
  }
}
