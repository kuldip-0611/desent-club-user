import { api } from './api';

export type CouponValidationResult = {
  valid: boolean;
  message?: string;
  couponId?: string;
  code?: string;
  discountAmount: string;
  subtotal: string;
  subtotalAfterDiscount: string;
};

/**
 * Preview discount for a cart subtotal. Does not consume coupon usage.
 * Call from checkout UI; increment usage when creating an order via backend.
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
): Promise<CouponValidationResult> {
  const { data } = await api.post<CouponValidationResult>('/coupons/validate', {
    code,
    subtotal,
  });
  return data;
}
