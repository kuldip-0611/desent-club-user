'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/storage'

type CheckoutAddressState = {
  selectedAddressId: string | null
  setSelectedAddressId: (id: string | null) => void
}

export const useCheckoutAddressStore = create<CheckoutAddressState>()(
  persist(
    (set) => ({
      selectedAddressId: null,
      setSelectedAddressId: (id) => set({ selectedAddressId: id }),
    }),
    {
      name: STORAGE_KEYS.checkoutAddress,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedAddressId: state.selectedAddressId }),
    },
  ),
)
