'use client'
export const dynamic = 'force-dynamic'

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { AuthShell } from '@/src/components/auth/AuthShell';

function ReferralCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get('ref');
    if (ref) {
      sessionStorage.setItem('pending_referral', ref);
    }
  }, [params]);
  return null;
}

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create account"
      subtitle="Choose a password, then verify your email with the code we send"
    >
      <Suspense>
        <ReferralCapture />
      </Suspense>
      <AuthForm action="register" />
    </AuthShell>
  );
}
