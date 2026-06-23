import { apiClient } from '@/services/api/client'

export type ActiveBundle = {
  id: string
  name: string
  description: string | null
  discountType: 'PERCENT' | 'FLAT'
  discountValue: number
  minItems: number
  productIds: string[]
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

type ApiBundleProduct = { productId: string }
type ApiBundle = Omit<ActiveBundle, 'productIds'> & { products: ApiBundleProduct[] }

export const getActiveBundles = async (): Promise<ActiveBundle[]> => {
  try {
    const { data } = await apiClient.get<ApiBundle[]>('/bundles/active')
    return (data ?? []).map((b) => ({
      ...b,
      productIds: (b.products ?? []).map((p) => p.productId),
    }))
  } catch {
    return []
  }
}
