'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api/client'

type ActiveCoupon = {
  code: string
  discountType: 'PERCENT' | 'FIXED'
  value: number
  endsAt: string | null
  minSubtotal?: number | null
}

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) return
    const end = new Date(endsAt).getTime()

    const update = () => {
      const diff = end - Date.now()
      setRemaining(diff > 0 ? diff : 0)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return remaining
}

function formatCountdown(ms: number) {
  const totalSecs = Math.floor(ms / 1000)
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const FlashSaleBanner = () => {
  const [coupon, setCoupon] = useState<ActiveCoupon | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const remaining = useCountdown(coupon?.endsAt ?? null)

  useEffect(() => {
    // Fetch nearest-expiring active coupon with an endsAt date
    apiClient
      .get<ActiveCoupon[]>('/coupons/available')
      .then(({ data }) => {
        const withExpiry = data
          .filter((c) => c.endsAt && new Date(c.endsAt) > new Date())
          .sort((a, b) => new Date(a.endsAt!).getTime() - new Date(b.endsAt!).getTime())
        setCoupon(withExpiry[0] ?? null)
      })
      .catch(() => {/* silently fail */})
  }, [])

  if (!coupon || dismissed || remaining === 0) return null

  const label =
    coupon.discountType === 'PERCENT'
      ? `${coupon.value}% off`
      : `₹${coupon.value} off`

  return (
    <div className="relative flex flex-wrap items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-3 text-white shadow-md">
      <span className="text-lg">🔥</span>
      <p className="text-sm font-semibold">
        Flash Sale! Get <span className="font-black text-yellow-300">{label}</span> with code{' '}
        <span className="rounded bg-white/20 px-2 py-0.5 font-mono font-bold tracking-widest">{coupon.code}</span>
        {coupon.minSubtotal ? ` on orders above ₹${coupon.minSubtotal}` : ''}
      </p>
      {remaining !== null && remaining > 0 && (
        <span className="rounded-lg bg-black/30 px-3 py-1 font-mono text-sm font-bold tabular-nums">
          ⏱ {formatCountdown(remaining)}
        </span>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
