'use client';

import { Form, Formik } from 'formik';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthShell } from '@/src/components/auth/AuthShell';
import { OtpInput } from '@/src/components/auth/OtpInput';
import {
  useResendEmailOtpMutation,
  useVerifyEmailOtpMutation,
} from '@/src/hooks/useAuthMutations';
import { useResendTimer } from '@/src/hooks/useResendTimer';
import { clearOtpContext, getOtpContext } from '@/src/utils/auth';
import { useAuthStore } from '@/store/auth-store';
import { otpSchema } from '@/src/utils/validation';

export default function VerifyOtpPage() {
  const router = useRouter();
  const setAuthResponse = useAuthStore((s) => s.setAuthResponse);
  /** Avoid hydration mismatch: server and first client paint cannot read localStorage. */
  const [hasHydrated, setHasHydrated] = useState(false);
  const [otpContext, setOtpContext] = useState<ReturnType<typeof getOtpContext>>(null);

  const verifyEmailOtpMutation = useVerifyEmailOtpMutation();
  const resendEmailOtpMutation = useResendEmailOtpMutation();

  const { canResend, formatted, restart } = useResendTimer(30);

  useEffect(() => {
    queueMicrotask(() => {
      setOtpContext(getOtpContext());
      setHasHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (!otpContext) {
      toast.error('Session expired. Please register or sign in again.');
      router.replace('/login');
    }
  }, [router, otpContext, hasHydrated]);

  const handleResendOtp = async () => {
    const ctx = getOtpContext();

    if (!ctx) {
      toast.error('Unable to resend OTP.');
      return;
    }

    try {
      await resendEmailOtpMutation.mutateAsync({ email: ctx.email, name: ctx.name });
      restart();
      toast.success('OTP resent successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend OTP';
      toast.error(message);
    }
  };

  if (!hasHydrated || !otpContext) {
    return (
      <AuthShell title="Verifying Session" subtitle="Please wait while we load your OTP request">
        <p className="text-center text-sm text-white/70">Preparing OTP verification screen...</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${otpContext.email}`}
    >
      <Formik
        initialValues={{ otp: '' }}
        validationSchema={otpSchema}
        onSubmit={async ({ otp }) => {
          const ctx = getOtpContext();

          if (!ctx) {
            toast.error('Session expired. Please try again.');
            router.replace('/login');
            return;
          }

          try {
            const response = await verifyEmailOtpMutation.mutateAsync({
              email: ctx.email,
              otp,
              name: ctx.name,
            });

            setAuthResponse(response);
            clearOtpContext();
            toast.success('Email verified successfully');
            router.push('/home');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'OTP verification failed';
            toast.error(message);
          }
        }}
      >
        {({ values, setFieldValue, errors, touched }) => {
          const isSubmitting = verifyEmailOtpMutation.isPending;

          return (
            <Form className="space-y-5">
              <OtpInput
                value={values.otp}
                length={6}
                onChange={(value) => {
                  setFieldValue('otp', value);
                }}
              />
              {touched.otp && errors.otp ? (
                <p className="text-center text-sm text-red-500">{errors.otp}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting || values.otp.length !== 6}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Verify email'}
              </button>

              <div className="text-center text-sm text-white/70">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="font-semibold text-white hover:underline"
                  >
                    Resend code
                  </button>
                ) : (
                  <span>Resend code in {formatted}</span>
                )}
              </div>
            </Form>
          );
        }}
      </Formik>
    </AuthShell>
  );
}
