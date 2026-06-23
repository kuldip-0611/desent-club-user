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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Loyalty Points</h2>
              <Link href="/loyalty" className="text-xs font-medium text-slate-900 hover:underline">
                View history →
              </Link>
            </div>
            {loyalty ? (
              <div className="mt-3 flex items-center gap-4">
                <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-black text-white">
                  <span className="text-xl font-bold leading-none">{loyalty.balance.toLocaleString()}</span>
                  <span className="text-[9px] text-slate-400">pts</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    ≈ ₹{rupeeValue} redeemable
                  </p>
                  <p className="text-xs text-slate-500">
                    {loyalty.totalEarned.toLocaleString()} earned · {loyalty.totalRedeemed.toLocaleString()} redeemed
                  </p>
                  {rules && loyalty.balance >= rules.minRedeemPoints ? (
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                      ✓ Redeemable at checkout
                    </span>
                  ) : rules ? (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                      Need {rules.minRedeemPoints} pts to redeem
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Loading…</p>
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
