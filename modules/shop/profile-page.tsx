'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { AddressesPanel } from '@/modules/shop/components/addresses-panel'
import { ChangePasswordForm } from '@/modules/shop/components/change-password-form'
import { LogoutConfirmModal } from '@/modules/shop/components/logout-confirm-modal'
import { getLoyaltyAccount, getLoyaltyRules, type LoyaltyAccount, type LoyaltyRules } from '@/services/loyalty.service'
import { apiClient } from '@/services/api/client'

interface UserCoupon {
  id: string
  code: string
  discountType: 'PERCENT' | 'FLAT'
  value: string
  source: string
}

export const ProfilePageModule = () => {
  const { user, requireAuth } = useAuthGuard()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loyalty, setLoyalty] = useState<LoyaltyAccount | null>(null)
  const [rules, setRules] = useState<LoyaltyRules | null>(null)
  const [coupons, setCoupons] = useState<UserCoupon[]>([])

  useEffect(() => {
    if (!user) return
    getLoyaltyAccount().then(setLoyalty).catch(() => undefined)
    getLoyaltyRules().then(setRules).catch(() => undefined)
    apiClient
      .get<UserCoupon[]>('/users/me/available-coupons')
      .then((r) => setCoupons(r.data))
      .catch(() => undefined)
  }, [user])

  const rupeeValue = loyalty && rules
    ? (loyalty.balance * rules.rupeePerPoint).toFixed(2)
    : '0'

  const formatDiscount = (type: string, value: string) =>
    type === 'PERCENT' ? `${Number(value)}% off` : `₹${Number(value).toFixed(0)} off`

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      {!user ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-600">Sign in to view profile, addresses, and notifications.</p>
          <Button className="mt-3" onClick={() => requireAuth(() => {})}>
            Sign in
          </Button>
        </div>
      ) : (
        <>
          {/* ── User info ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
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

          {/* ── Loyalty Points ── */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 pt-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Loyalty Points</h2>
              <Link href="/loyalty" className="text-xs font-medium text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white">
                View history →
              </Link>
            </div>
            {loyalty ? (
              <>
                {/* Balance banner */}
                <div className="mx-5 mt-3 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 dark:bg-slate-800">
                  <div>
                    <p className="text-xs font-medium text-slate-400">Available balance</p>
                    <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">
                      {loyalty.balance.toLocaleString()}
                      <span className="ml-1 text-sm font-medium text-slate-400">pts</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-slate-400">≈ Value</p>
                    <p className="mt-0.5 text-lg font-bold text-amber-400">₹{rupeeValue}</p>
                  </div>
                </div>
                {/* Stats row */}
                <div className="flex gap-0 divide-x divide-slate-100 px-5 py-3 dark:divide-slate-800">
                  <div className="flex-1 pr-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Earned</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">{loyalty.totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 px-4">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Redeemed</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-800 dark:text-slate-100">{loyalty.totalRedeemed.toLocaleString()}</p>
                  </div>
                  <div className="flex-1 pl-4">
                    {rules && loyalty.balance >= rules.minRedeemPoints ? (
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-green-600">Status</p>
                        <p className="mt-0.5 text-xs font-bold text-green-600">✓ Ready to use</p>
                      </>
                    ) : rules ? (
                      <>
                        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Need</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-300">{(rules.minRedeemPoints - loyalty.balance).toLocaleString()} more</p>
                      </>
                    ) : null}
                  </div>
                </div>
              </>
            ) : (
              <p className="px-5 pb-5 pt-3 text-sm text-slate-400">Loading…</p>
            )}
          </div>

          {/* ── Your Coupons ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Your Coupons</h2>
              <span className="text-xs text-slate-500">{coupons.length} available</span>
            </div>
            {coupons.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 py-5 text-center text-sm text-slate-400">
                No coupons available right now
              </p>
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3"
                  >
                    <div>
                      <p className="font-mono text-sm font-bold text-slate-900">{c.code}</p>
                      <p className="text-xs text-slate-500">
                        {c.source === 'public' ? 'Everyone' : c.source === 'direct' ? 'Assigned to you' : 'Via group'}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      {formatDiscount(c.discountType, c.value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Apply these codes at checkout to save on your order.
            </p>
          </div>

          {/* ── Addresses ── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <AddressesPanel mode="profile" isAuthenticated />
          </div>
        </>
      )}

      <LogoutConfirmModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </main>
  )
}
