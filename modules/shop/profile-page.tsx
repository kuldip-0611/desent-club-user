'use client'

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { ChangePasswordForm } from '@/modules/shop/components/change-password-form'
import { LogoutConfirmModal } from '@/modules/shop/components/logout-confirm-modal'

export const ProfilePageModule = () => {
  const { user, requireAuth } = useAuthGuard()
  const [logoutOpen, setLogoutOpen] = useState(false)

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      {!user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Sign in to view profile, addresses, and notifications.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => {})}>
            Sign in
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          {user.isVerified ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">Email verified</p>
          ) : (
            <p className="mt-2 text-xs font-medium text-amber-700">Email not verified</p>
          )}
          {user.provider === 'EMAIL' ? <ChangePasswordForm /> : null}
          <Button variant="outline" className="mt-4" onClick={() => setLogoutOpen(true)}>
            Log out
          </Button>
        </div>
      )}

      {user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <AddressesPanel mode="profile" isAuthenticated />
        </div>
      ) : null}

      <LogoutConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </main>
  )
}