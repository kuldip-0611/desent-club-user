'use client'
export const dynamic = 'force-dynamic'

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthShell } from '@/src/components/auth/AuthShell';
import { ResetPasswordForm } from '@/src/components/auth/ResetPasswordForm';

const ResetPasswordContent = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Reset password" subtitle="Loading…">
          <p className="text-center text-sm text-white/70">Please wait…</p>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
