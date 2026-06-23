'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Formik, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/src/services/auth';
import { forgotPasswordSchema } from '@/src/utils/validation';

type ForgotValues = {
  email: string;
};

export const ForgotPasswordForm = () => {
  const router = useRouter();

  return (
    <>
      <Formik<ForgotValues>
        initialValues={{ email: '' }}
        validationSchema={forgotPasswordSchema}
        onSubmit={async (values, { setSubmitting }) => {
          try {
            const { message } = await forgotPassword({ email: values.email.trim() });
            toast.success(message);
            router.push('/home');
          } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Request failed');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ handleChange, handleBlur, isSubmitting, isValid, dirty, values }) => (
          <Form className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-white dark:focus:ring-slate-700"
              />
              <p className="mt-1 text-xs text-red-500">
                <ErrorMessage name="email" />
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </Form>
        )}
      </Formik>
      <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-slate-900 underline dark:text-white">
          Sign in
        </Link>
      </p>
    </>
  );
};
