import { apiClient } from '@/services/api/client';

export type CouponValidationResult = {
  valid: boolean;
  message?: string;
  couponId?: string;
  code?: string;
  discountAmount: string;
  subtotal: string;
  subtotalAfterDiscount: string;
};

export type ApplicableCoupon = {
  id: string;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  value: string;
  minSubtotal: string | null;
  maxDiscount: string | null;
  discountAmount: string;
  categories: { id: string; name: string; slug: string }[];
};

export async function listApplicableCoupons(
  subtotal: number,
  categoryIds: string[],
): Promise<ApplicableCoupon[]> {
  const { data } = await apiClient.post<ApplicableCoupon[]>('/coupons/applicable', {
    subtotal,
    categoryIds: categoryIds.length ? categoryIds : undefined,
  });
  return data;
}

export async function validateCoupon(
  code: string,
  subtotal: number,
  categoryIds?: string[],
): Promise<CouponValidationResult> {
  const { data } = await apiClient.post<CouponValidationResult>('/coupons/validate', {
    code,
    subtotal,
    categoryIds: categoryIds?.length ? categoryIds : undefined,
  });
  return data;
}
