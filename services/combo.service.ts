import { apiClient } from '@/services/api/client'

export type ComboProduct = {
  id: string
  productId: string
  variantId: string | null
  quantity: number
  product: {
    id: string
    name: string
    slug: string | null
    price: number
    discountPercent: number | null
    images: { path: string }[]
  }
  variant: { id: string; size: string; color: string; quantity: number } | null
}

export type Combo = {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  image: string | null
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  items: ComboProduct[]
}

export const getActiveCombos = async (): Promise<Combo[]> => {
  try {
    const { data } = await apiClient.get<Combo[]>('/combos/active')
    return data ?? []
  } catch {
    return []
  }
}

export const getComboBySlug = async (slug: string): Promise<Combo | null> => {
  try {
    const { data } = await apiClient.get<Combo>(`/combos/slug/${slug}`)
    return data
  } catch {
    return null
  }
}
