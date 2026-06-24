import { create } from 'zustand'

type ActiveSaleInfo = { saleId: string; saleTitle: string; discountPercent: number }

type FlashSaleStore = {
  // productId → best active sale for that product
  saleMap: Record<string, ActiveSaleInfo>
  setSaleMap: (map: Record<string, ActiveSaleInfo>) => void
}

export const useFlashSaleStore = create<FlashSaleStore>((set) => ({
  saleMap: {},
  setSaleMap: (saleMap) => set({ saleMap }),
}))

export const getProductSaleInfo = (productId: string): ActiveSaleInfo | null =>
  useFlashSaleStore.getState().saleMap[productId] ?? null
