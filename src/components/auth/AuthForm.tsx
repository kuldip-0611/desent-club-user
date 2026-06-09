'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Form, Formik, ErrorMessage } from 'formik';
import toast from 'react-hot-toast';
import type { AuthAction } from '@/src/types/auth';
import { useRegisterMutation, useUserLoginMutation } from '@/src/hooks/useAuthMutations';
import { setAuthSession, setOtpContext } from '@/src/utils/auth';
import { loginEmailPasswordSchema, registerWithPasswordSchema } from '@/src/utils/validation';

type LoginValues = {
  email: string;
  password: string;
};

type RegisterValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type AuthFormProps = {
  action: AuthAction;
};

const secondaryRouteMap: Record<AuthAction, { href: string; label: string; cta: string }> = {
  login: {
    href: '/register',
    label: "Don't have an account?",
    cta: 'Create account',
  },
  register: {
    href: '/login',
    label: 'Already have an account?',
    cta: 'Sign in',
  },
};

export const AuthForm = ({ action }: AuthFormProps) => {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const loginMutation = useUserLoginMutation();
  const secondaryRoute = secondaryRouteMap[action];

  if (action === 'login') {
    return (
      <>
        <Formik<LoginValues>
          initialValues={{ email: '', password: '' }}
          validationSchema={loginEmailPasswordSchema}
          onSubmit={async (values) => {
            try {
              const response = await loginMutation.mutateAsync(values);
              setAuthSession(response.accessToken, response.user);
              toast.success('Signed in successfully');
              router.push('/dashboard');
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Login failed';
              toast.error(message);
            }
          }}
        >
          {({ values, handleChange, handleBlur, isValid, dirty }) => {
            const isSubmitting = loginMutation.isPending;

            return (
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
                  <p className="mt-1 text-xs text-red-500">
                    <ErrorMessage name="email" />
                  </p>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/85">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-red-500">
                    <ErrorMessage name="password" />
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isValid || !dirty}
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </button>
              </Form>
            );
          }}
        </Formik>

        <p className="mt-5 text-center text-sm text-white/70">
          {secondaryRoute.label}{' '}
          <Link href={secondaryRoute.href} className="font-medium text-white hover:underline">
            {secondaryRoute.cta}
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Formik<RegisterValues>
        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
        validationSchema={registerWithPasswordSchema}
        onSubmit={async (values) => {
          try {
            const { message } = await registerMutation.mutateAsync({
              name: values.name,
              email: values.email,
              password: values.password,
            });
            setOtpContext({
              action: 'register',
              method: 'email',
              value: values.email,
              name: values.name,
            });
            toast.success(message);
            router.push('/verify-otp');
          } catch (error) {
            const errMessage = error instanceof Error ? error.message : 'Registration failed';
            toast.error(errMessage);
          }
        }}
      >
        {({ values, handleChange, handleBlur, isValid, dirty }) => {
          const isSubmitting = registerMutation.isPending;

          return (
            <Form className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-1 block text-sm font-medium text-white/85">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  value={values.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none"
                />
                <p className="mt-1 text-xs text-red-500">
                  <ErrorMessage name="name" />
                </p>
              </div>

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
                <p className="mt-1 text-xs text-red-500">
                  <ErrorMessage name="email" />
                </p>
              </div>

              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-white/85">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none"
                />
                <p className="mt-1 text-xs text-red-500">
                  <ErrorMessage name="password" />
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-white/85">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-sky-300 focus:outline-none"
                />
                <p className="mt-1 text-xs text-red-500">
                  <ErrorMessage name="confirmPassword" />
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isValid || !dirty}
                className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-900/30 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Creating account...' : 'Create account & send code'}
              </button>
            </Form>
          );
        }}
      </Formik>

      <p className="mt-5 text-center text-sm text-white/70">
        {secondaryRoute.label}{' '}
        <Link href={secondaryRoute.href} className="font-medium text-white hover:underline">
          {secondaryRoute.cta}
        </Link>
      </p>
    </>
  );
};
