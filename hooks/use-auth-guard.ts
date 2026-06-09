'use client'

import { toast } from 'react-hot-toast'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

export const useAuthGuard = () => {
  const user = useAuthStore((s) => s.user)
  const openModal = useUiStore((s) => s.openModal)

  return {
    requireAuth: (onSuccess: () => void) => {
      if (!user) {
        openModal('auth')
        toast('Please login to continue')
        return
      }
      onSuccess()
    },
    user,
  }
}
