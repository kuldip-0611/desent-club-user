'use client'

import { create } from 'zustand'
import { apiClient } from '@/services/api/client'

type WishlistState = {
  productIds: string[]
  toggle: (productId: string) => void
  add: (productId: string) => void
  remove: (productId: string) => void
  reconcile: (validIds: string[]) => void
  has: (productId: string) => boolean
  syncFromServer: () => Promise<void>
}

const serverAdd = (productId: string) =>
  apiClient.post(`/wishlist/${productId}`).catch(() => undefined)

const serverRemove = (productId: string) =>
  apiClient.delete(`/wishlist/${productId}`).catch(() => undefined)

const serverGetIds = (): Promise<string[]> =>
  apiClient
    .get<{ ids: string[] }>('/wishlist/ids')
    .then((r) => r.data.ids)
    .catch(() => [])

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  productIds: [],

  toggle: (productId) => {
    const has = get().productIds.includes(productId)
    set((state) => ({
      productIds: has
        ? state.productIds.filter((id) => id !== productId)
        : [...state.productIds, productId],
    }))
    if (has) serverRemove(productId)
    else serverAdd(productId)
  },

  add: (productId) => {
    if (get().productIds.includes(productId)) return
    set((state) => ({ productIds: [...state.productIds, productId] }))
    serverAdd(productId)
  },

  remove: (productId) => {
    if (!get().productIds.includes(productId)) return
    set((state) => ({ productIds: state.productIds.filter((id) => id !== productId) }))
    serverRemove(productId)
  },

  reconcile: (validIds) => {
    const valid = new Set(validIds)
    const current = get().productIds
    const next = current.filter((id) => valid.has(id))
    if (next.length !== current.length) set({ productIds: next })
  },

  has: (productId) => get().productIds.includes(productId),

  syncFromServer: async () => {
    const ids = await serverGetIds()
    set({ productIds: ids })
  },
}))
