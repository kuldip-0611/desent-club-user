'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getCartCategoryIds,
  getCartSubtotal,
  useCartStore,
} from '@/store/cart-store'
import {
  listApplicableCoupons,
  validateCoupon,
  type ApplicableCoupon,
} from '@/src/services/coupons'

type CartCouponsSectionProps = {
  compact?: boolean
}

const formatDiscountLabel = (coupon: ApplicableCoupon) => {
  if (coupon.discountType === 'PERCENT') {
    return `${coupon.value}% off`
  }
  return `Rs. ${coupon.value} off`
}

export const CartCouponsSection = ({ compact = false }: CartCouponsSectionProps) => {
  const lines = useCartStore((s) => s.lines)
  const couponCode = useCartStore((s) => s.couponCode)
  const applyCoupon = useCartStore((s) => s.applyCoupon)
  const clearCoupon = useCartStore((s) => s.clearCoupon)

  const [manualCode, setManualCode] = useState('')
  const [applicable, setApplicable] = useState<ApplicableCoupon[]>([])
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)

  const subtotal = useMemo(() => getCartSubtotal(lines), [lines])
  const categoryIds = useMemo(() => getCartCategoryIds(lines), [lines])

  const loadApplicable = useCallback(async () => {
    if (lines.length === 0 || subtotal <= 0) {
      setApplicable([])
      return
    }
    setLoading(true)
    try {
      const coupons = await listApplicableCoupons(subtotal, categoryIds)
      setApplicable(coupons)
    } catch {
      setApplicable([])
    } finally {
      setLoading(false)
    }
  }, [lines.length, subtotal, categoryIds])

  useEffect(() => {
    void loadApplicable()
  }, [loadApplicable])

  const applyCode = async (code: string) => {
    const normalized = code.trim().toUpperCase()
    if (!normalized) return
    setApplying(true)
    try {
      const result = await validateCoupon(normalized, subtotal, categoryIds)
      if (!result.valid) {
        toast.error(result.message ?? 'Coupon is not valid for this cart')
        return
      }
      const discount = Math.round(Number(result.discountAmount))
      applyCoupon(result.code ?? normalized, discount)
      setManualCode(result.code ?? normalized)
      toast.success('Coupon applied')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not apply coupon')
    } finally {
      setApplying(false)
    }
  }

  useEffect(() => {
    if (!couponCode || lines.length === 0) return
    let cancelled = false
    void validateCoupon(couponCode, subtotal, categoryIds).then((result) => {
      if (cancelled) return
      if (result.valid) {
        const discount = Math.round(Number(result.discountAmount))
        const state = useCartStore.getState()
        if (state.couponDiscount !== discount) {
          applyCoupon(result.code ?? couponCode, discount)
        }
      } else {
        clearCoupon()
        toast.error(result.message ?? 'Coupon removed — no longer valid for this cart')
      }
    })
    return () => {
      cancelled = true
    }
  }, [couponCode, subtotal, categoryIds.join(','), lines.length, applyCoupon, clearCoupon])

  if (lines.length === 0) return null

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex items-center justify-between gap-2">
        <p className={`font-semibold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          Coupons
        </p>
        {couponCode ? (
          <button
            type="button"
            onClick={() => {
              clearCoupon()
              setManualCode('')
            }}
            className="text-[11px] font-medium text-rose-600 hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      {couponCode ? (
        <p className={`rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          Applied: <span className="font-semibold">{couponCode}</span>
        </p>
      ) : null}

      <div className="flex gap-2">
        <Input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className={compact ? 'h-9 text-xs' : ''}
        />
        <Button
          type="button"
          variant="outline"
          disabled={applying || !manualCode.trim()}
          className={compact ? 'h-9 shrink-0 px-3 text-xs' : 'shrink-0'}
          onClick={() => void applyCode(manualCode)}
        >
          Apply
        </Button>
      </div>

      {loading ? (
        <p className={`text-slate-500 ${compact ? 'text-[11px]' : 'text-xs'}`}>Loading offers…</p>
      ) : null}

      {!loading && applicable.length > 0 ? (
        <div className={`space-y-1.5 ${compact ? 'max-h-28' : 'max-h-36'} overflow-y-auto`}>
          {applicable.map((coupon) => {
            const isActive = couponCode === coupon.code
            return (
              <button
                key={coupon.id}
                type="button"
                disabled={applying || isActive}
                onClick={() => void applyCode(coupon.code)}
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left transition ${
                  isActive
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-900 hover:bg-slate-100'
                } ${compact ? 'text-[11px]' : 'text-xs'}`}
              >
                <span>
                  <span className="font-semibold text-slate-900">{coupon.code}</span>
                  <span className="ml-1.5 text-slate-600">{formatDiscountLabel(coupon)}</span>
                  {coupon.minSubtotal ? (
                    <span className="mt-0.5 block text-slate-500">
                      Min order Rs. {coupon.minSubtotal}
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-slate-900">
                  -Rs. {Math.round(Number(coupon.discountAmount))}
                </span>
              </button>
            )
          })}
        </div>
      ) : null}

      {!loading && applicable.length === 0 && !couponCode ? (
        <p className={`text-slate-500 ${compact ? 'text-[11px]' : 'text-xs'}`}>
          No coupons available for this cart yet.
        </p>
      ) : null}
    </div>
  )
}
