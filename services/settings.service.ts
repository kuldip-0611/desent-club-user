import { apiClient } from '@/services/api/client'

export interface PublicStoreSettings {
  defaultGstRate: string
  freeShippingThreshold: string
  currency: string
  storeName: string
}

let cached: PublicStoreSettings | null = null

export const getPublicSettings = async (): Promise<PublicStoreSettings> => {
  if (cached) return cached
  const { data } = await apiClient.get<PublicStoreSettings>('/settings/public')
  cached = data
  return data
}

export const getGstRate = async (): Promise<number> => {
  try {
    const s = await getPublicSettings()
    const rate = parseFloat(s.defaultGstRate)
    return isNaN(rate) ? 0.18 : rate / 100
  } catch {
    return 0.18
  }
}
