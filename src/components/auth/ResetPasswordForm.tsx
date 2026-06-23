'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Formik, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import { PasswordInput } from '@/components/ui/password-input';
import { resetPassword } from '@/src/services/auth';
import { resetPasswordSchema } from '@/src/utils/validation';
import { useAuthStore } from '@/store/auth-store';

type ResetValues = {
  password: string;
  confirmPassword: string;
};

type ResetPasswordFormProps = {
  token: string;
};

export const ResetPasswordForm = ({ token }: ResetPasswordFormProps) => {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  if (!token) {
    return (
      <div className="space-y-4 text-center text-sm text-slate-500 dark:text-slate-400">
        <p>This reset link is invalid or missing. Request a new link from the forgot password page.</p>
        <Link href="/forgot-password" className="font-semibold text-slate-900 underline dark:text-white">
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
            await logout();
            router.push('/');
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
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                className="h-auto w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-slate-700"
              />
              <p className="mt-1 text-xs text-red-500">
                <ErrorMessage name="password" />
              </p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
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
                className="h-auto w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-slate-700"
              />
              <p className="mt-1 text-xs text-red-500">
                <ErrorMessage name="confirmPassword" />
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isSubmitting ? 'Updating…' : 'Reset password'}
            </button>
          </Form>
        )}
      </Formik>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        <Link href="/login" className="font-semibold text-slate-900 underline dark:text-white">
          Back to sign in
        </Link>
      </p>
    </>
  );
};
