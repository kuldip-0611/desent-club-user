'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/services/api/client'

type FlashSale = {
  id: string
  title: string
  discountPercent: number
  startsAt: string
  endsAt: string
  isActive: boolean
}

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null)
  useEffect(() => {
    if (!endsAt) return
    const end = new Date(endsAt).getTime()
    const update = () => { const diff = end - Date.now(); setRemaining(diff > 0 ? diff : 0) }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [endsAt])
  return remaining
}

function formatCountdown(ms: number) {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export const FlashSaleBanner = () => {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    apiClient
      .get<FlashSale[]>('/flash-sales/active-all')
      .then(({ data }) => { if (Array.isArray(data) && data.length) setSales(data) })
      .catch(() => {})
  }, [])

  // Rotate through multiple sales every 4 seconds
  useEffect(() => {
    if (sales.length <= 1) return
    const id = setInterval(() => setCurrentIdx((i) => (i + 1) % sales.length), 4000)
    return () => clearInterval(id)
  }, [sales.length])

  const sale = sales[currentIdx]
  const remaining = useCountdown(sale?.endsAt ?? null)

  if (!sale || dismissed || remaining === 0) return null

  return (
    <div className="relative bg-slate-900 px-8 py-2 text-white dark:bg-white dark:text-slate-900">
      {/* Close button — always top-right, never disrupts layout */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2.5 top-2 rounded-full p-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Content row */}
      <div className="flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-center sm:gap-3 sm:text-left">
        <p className="text-sm font-semibold leading-snug">
          🔥 {sale.title} —{' '}
          <span className="font-black text-yellow-300 dark:text-yellow-600">{sale.discountPercent}% off</span>
          {' '}on selected products
        </p>
        <div className="flex items-center gap-2">
          {remaining !== null && remaining > 0 && (
            <span className="rounded-md bg-white/20 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums dark:bg-slate-900/20">
              ⏱ {formatCountdown(remaining)}
            </span>
          )}
          {sales.length > 1 && (
            <span className="text-xs text-white/60 dark:text-slate-500">
              {currentIdx + 1}/{sales.length}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
