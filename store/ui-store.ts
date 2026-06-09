'use client'

import { create } from 'zustand'
import { STORAGE_KEYS } from '@/constants/storage'

type ModalName = 'auth' | 'quickView' | null

type UiState = {
  modal: ModalName
  modalPayload?: Record<string, string>
  authOnSuccess: (() => void) | null
  isCartDrawerOpen: boolean
  theme: 'light' | 'dark'
  openModal: (modal: Exclude<ModalName, null>, payload?: Record<string, string>) => void
  openAuthModal: (onSuccess?: () => void) => void
  closeModal: () => void
  setCartDrawer: (open: boolean) => void
  toggleTheme: () => void
  initTheme: () => void
}

export const useUiStore = create<UiState>((set, get) => ({
  modal: null,
  modalPayload: undefined,
  authOnSuccess: null,
  isCartDrawerOpen: false,
  theme: 'light',
  openModal: (modal, modalPayload) => set({ modal, modalPayload }),
  openAuthModal: (onSuccess) =>
    set({
      modal: 'auth',
      authOnSuccess: onSuccess ?? null,
    }),
  closeModal: () => set({ modal: null, modalPayload: undefined, authOnSuccess: null }),
  setCartDrawer: (isCartDrawerOpen) => set({ isCartDrawerOpen }),
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: next })
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEYS.theme, next)
      document.documentElement.dataset.theme = next
    }
  },
  initTheme: () => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(STORAGE_KEYS.theme)
    const theme = stored === 'dark' ? 'dark' : 'light'
    set({ theme })
    document.documentElement.dataset.theme = theme
  },
}))
