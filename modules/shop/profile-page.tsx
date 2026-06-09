'use client'

import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'

export const ProfilePageModule = () => {
  const { user, requireAuth } = useAuthGuard()

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      {!user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-600">Login to view profile, addresses, and notifications.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => {})}>
            Login to continue
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-semibold">{user.name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      )}
    </main>
  )
}
