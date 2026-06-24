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
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (d > 0) return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`
  return `${pad(h)}:${pad(m)}:${pad(s)}`
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

  useEffect(() => {
    if (sales.length <= 1) return
    const id = setInterval(() => setCurrentIdx((i) => (i + 1) % sales.length), 4000)
    return () => clearInterval(id)
  }, [sales.length])

  const sale = sales[currentIdx]
  const remaining = useCountdown(sale?.endsAt ?? null)

  if (!sale || dismissed || remaining === 0) return null

  return (
    <div className="bg-slate-900 py-2 text-white dark:bg-white dark:text-slate-900">
      {/* Single row: [spacer] [content] [close] — spacer mirrors close width so content stays centred */}
      <div className="flex items-center gap-2 px-3">
        {/* Left spacer — same width as close button to keep content centred */}
        <div className="w-7 shrink-0" />

        {/* Content — grows to fill, centred */}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-center">
          <p className="text-sm font-semibold leading-snug">
            🔥 {sale.title} —{' '}
            <span className="font-black text-yellow-300 dark:text-yellow-600">{sale.discountPercent}% off</span>
            {' '}on selected products
          </p>
          <div className="flex items-center gap-2">
            {remaining !== null && remaining > 0 && (
              <span className="flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums dark:bg-slate-900/20">
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

        {/* Close button — fixed right, never overlaps content */}
        <button
          onClick={() => setDismissed(true)}
          className="w-7 shrink-0 rounded-full p-1 text-center opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
