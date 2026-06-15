import { apiClient } from '@/services/api/client'

export interface StoreCreditBalance {
  balance: number
}

export const getStoreCreditBalance = async (): Promise<StoreCreditBalance> => {
  const { data } = await apiClient.get<StoreCreditBalance>('/store-credit/my/balance')
  return data
}
