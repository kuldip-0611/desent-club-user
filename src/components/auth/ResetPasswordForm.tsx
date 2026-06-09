'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Formik, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import { PasswordInput } from '@/components/ui/password-input';
import { resetPassword } from '@/src/services/auth';
import { resetPasswordSchema } from '@/src/utils/validation';

type ResetValues = {
  password: string;
  confirmPassword: string;
};

type ResetPasswordFormProps = {
  token: string;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();

  if (!token) {
    return (
      <div className="space-y-4 text-center text-sm text-white/80">
        <p>This reset link is invalid or missing. Request a new link from the forgot password page.</p>
        <Link href="/forgot-password" className="font-medium text-white underline">
          Forgot password
        </Link>
      </div>
    );
  }

  return (
    <>
      <Formik<ResetValues>
        initialValues={{ password: '', confirmPassword: '' }}
        validationSchema={resetPasswordSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const { message } = await resetPassword({
              token,
              password: values.password,
            });
            toast.success(message);
            router.push('/login');
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Reset failed');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange, handleBlur, isSubmitting, isValid, dirty, values }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/85">
                New password
              </label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                toggleVariant="auth"
                className="h-auto w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pr-10 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none focus:ring-0"
              />
              <p className="mt-1 text-xs text-red-400">
                <ErrorMessage name="password" />
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white/85">
                Confirm password
              </label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                toggleVariant="auth"
                className="h-auto w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pr-10 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none focus:ring-0"
              />
              <p className="mt-1 text-xs text-red-400">
                <ErrorMessage name="confirmPassword" />
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Updating…' : 'Reset password'}
            </button>
          </Form>
        )}
      </Formik>
      <p className="mt-5 text-center text-sm text-white/70">
        <Link href="/login" className="font-medium text-white hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
};
