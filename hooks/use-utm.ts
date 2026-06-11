'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export const useUtmTracking = () => {
  const searchParams = useSearchParams()
  useEffect(() => {
    const utmSource = searchParams.get('utm_source')
    const utmMedium = searchParams.get('utm_medium')
    const utmCampaign = searchParams.get('utm_campaign')
    const ref = searchParams.get('ref') ?? searchParams.get('affiliate')

    if (utmSource || ref) {
      sessionStorage.setItem('utm_source', utmSource ?? '')
      sessionStorage.setItem('utm_medium', utmMedium ?? '')
      sessionStorage.setItem('utm_campaign', utmCampaign ?? '')
      sessionStorage.setItem('affiliate_code', ref ?? utmSource ?? '')
    }
  }, [searchParams])
}

export const getStoredAffiliateCode = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('affiliate_code') || null
}
