'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/constants/storage'
import { apiClient } from '@/services/api/client'

type WishlistState = {
  productIds: string[]
  toggle: (productId: string) => void
  has: (productId: string) => boolean
  syncFromServer: () => Promise<void>
  syncToServer: () => Promise<void>
}

// Sync helpers — silent fail if not authenticated
const serverAdd = (productId: string) =>
  apiClient.post(`/wishlist/${productId}`).catch(() => undefined)

const serverRemove = (productId: string) =>
  apiClient.delete(`/wishlist/${productId}`).catch(() => undefined)

const serverGetIds = (): Promise<string[]> =>
  apiClient
    .get<{ ids: string[] }>('/wishlist/ids')
    .then((r) => r.data.ids)
    .catch(() => [])

const serverSync = (productIds: string[]) =>
  apiClient.post('/wishlist/sync', { productIds }).catch(() => undefined)

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      productIds: [],

      toggle: (productId) => {
        const has = get().productIds.includes(productId)
        set((state) => ({
          productIds: has
            ? state.productIds.filter((id) => id !== productId)
            : [...state.productIds, productId],
        }))
        // Fire-and-forget server sync
        if (has) serverRemove(productId)
        else serverAdd(productId)
      },

      has: (productId) => get().productIds.includes(productId),

      /** Called on login: merge localStorage ids to server, then load server state */
      syncToServer: async () => {
        const localIds = get().productIds
        if (localIds.length > 0) await serverSync(localIds)
        await get().syncFromServer()
      },

      /** Pull server wishlist and overwrite local state */
      syncFromServer: async () => {
        const ids = await serverGetIds()
        if (ids.length > 0) set({ productIds: ids })
      },
    }),
    {
      name: STORAGE_KEYS.wishlist,
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
