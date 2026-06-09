'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'

type LogoutConfirmModalProps = {
  open: boolean
  onClose: () => void
}

export const LogoutConfirmModal = ({ open, onClose }: LogoutConfirmModalProps) => {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await logout()
      toast.success('Logged out')
      onClose()
      router.push('/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="text-lg font-semibold text-slate-900">Log out?</h2>
      <p className="mt-2 text-sm text-slate-600">
        Are you sure you want to log out of your account?
      </p>
      <div className="mt-5 flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          className="flex-1 bg-rose-600 hover:bg-rose-500"
          onClick={() => void handleConfirm()}
          disabled={loading}
        >
          {loading ? 'Logging out…' : 'Yes, log out'}
        </Button>
      </div>
    </Modal>
  )
}