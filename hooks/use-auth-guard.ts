'use client'

import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

export const useAuthGuard = () => {
  const user = useAuthStore((s) => s.user)
  const openAuthModal = useUiStore((s) => s.openAuthModal)
  const [hydrated, setHydrated] = useState(() => {
    try { return useAuthStore.persist.hasHydrated() } catch { return false }
  })

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  return {
    requireAuth: (onSuccess: () => void) => {
      if (!user) {
        openAuthModal(onSuccess)
        toast('Please sign in to continue')
        return
      }
      onSuccess()
    },
    user,
    isAuthReady: hydrated,
  }
}
