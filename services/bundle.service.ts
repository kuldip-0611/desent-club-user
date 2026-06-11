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

export const getActiveBundles = async (): Promise<ActiveBundle[]> => {
  try {
    const { data } = await apiClient.get<ActiveBundle[]>('/bundles/active')
    return data
  } catch {
    return []
  }
}
