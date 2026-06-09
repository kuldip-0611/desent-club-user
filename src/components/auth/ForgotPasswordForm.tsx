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
            router.push('/login');
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
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-white/85">
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
                className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none"
              />
              <p className="mt-1 text-xs text-red-400">
                <ErrorMessage name="email" />
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isValid || !dirty}
              className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </button>
          </Form>
        )}
      </Formik>
      <p className="mt-5 text-center text-sm text-white/70">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-white hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
};
