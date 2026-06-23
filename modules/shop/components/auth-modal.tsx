'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { GoogleSignInButton } from '@/src/components/auth/GoogleSignInButton'
import {
  loginWithGoogle,
  registerAccount,
  resendEmailOtp,
  userLogin,
  verifyEmailOtp,
} from '@/services/auth.service'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name is required'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  })

const otpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>
type OtpValues = z.infer<typeof otpSchema>
type ModalMode = 'login' | 'register' | 'verify'

export const AuthModal = () => {
  const modal = useUiStore((s) => s.modal)
  const close = useUiStore((s) => s.closeModal)
  const authOnSuccess = useUiStore((s) => s.authOnSuccess)
  const setAuthResponse = useAuthStore((s) => s.setAuthResponse)
  const [mode, setMode] = useState<ModalMode>('login')
  const [submitting, setSubmitting] = useState(false)
  const [pendingRegister, setPendingRegister] = useState<{ email: string; name: string } | null>(null)

  const finishAuth = () => {
    const callback = authOnSuccess
    close()
    setMode('login')
    setPendingRegister(null)
    callback?.()
  }

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const otpForm = useForm<OtpValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })

  const onLogin = loginForm.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const response = await userLogin(values)
      setAuthResponse(response)
      toast.success('Signed in successfully')
      finishAuth()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  const onRegister = registerForm.handleSubmit(async (values) => {
    setSubmitting(true)
    try {
      const { message } = await registerAccount({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      })
      setPendingRegister({ email: values.email.trim(), name: values.name.trim() })
      setMode('verify')
      otpForm.reset({ otp: '' })
      toast.success(message)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  const onVerifyOtp = otpForm.handleSubmit(async (values) => {
    if (!pendingRegister) return
    setSubmitting(true)
    try {
      const response = await verifyEmailOtp({
        email: pendingRegister.email,
        otp: values.otp,
        name: pendingRegister.name,
      })
      setAuthResponse(response)
      toast.success('Account verified')
      finishAuth()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verification failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  })

  const handleResendOtp = async () => {
    if (!pendingRegister) return
    setSubmitting(true)
    try {
      await resendEmailOtp({ email: pendingRegister.email, name: pendingRegister.name })
      toast.success('Code resent')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not resend code'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setMode('login')
    setPendingRegister(null)
    close()
  }

  const handleGoogleSignIn = async (token: string) => {
    setSubmitting(true)
    try {
      const response = await loginWithGoogle(token)
      setAuthResponse(response)
      toast.success('Signed in with Google')
      finishAuth()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in failed'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={modal === 'auth'} onClose={handleClose}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {mode === 'login' ? 'Sign in' : mode === 'register' ? 'Create account' : 'Verify email'}
        </h3>
        {mode !== 'verify' ? (
          <button
            type="button"
            className="text-xs font-medium text-slate-900 underline"
            onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
          >
            {mode === 'login' ? 'Need an account?' : 'Have an account?'}
          </button>
        ) : (
          <button type="button" className="text-xs font-medium text-slate-900 underline" onClick={() => setMode('login')}>
            Back to sign in
          </button>
        )}
      </div>

      {mode === 'login' ? (
        <>
          <GoogleSignInButton
            variant="modal"
            disabled={submitting}
            onCredential={handleGoogleSignIn}
          />
          <div className="my-3 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        <form className="space-y-3" onSubmit={onLogin}>
          <div>
            <Input type="email" placeholder="Email address" autoComplete="email" {...loginForm.register('email')} />
            {loginForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <PasswordInput
              placeholder="Password"
              autoComplete="current-password"
              {...loginForm.register('password')}
            />
            {loginForm.formState.errors.password ? (
              <p className="mt-1 text-xs text-red-600">{loginForm.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs font-medium text-slate-900 underline hover:underline">
              Forgot password?
            </Link>
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        </>
      ) : null}

      {mode === 'register' ? (
        <form className="space-y-3" onSubmit={onRegister}>
          <div>
            <Input placeholder="Full name" autoComplete="name" {...registerForm.register('name')} />
            {registerForm.formState.errors.name ? (
              <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.name.message}</p>
            ) : null}
          </div>
          <div>
            <Input type="email" placeholder="Email address" autoComplete="email" {...registerForm.register('email')} />
            {registerForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div>
            <PasswordInput
              placeholder="Password (min 8 characters)"
              autoComplete="new-password"
              {...registerForm.register('password')}
            />
            {registerForm.formState.errors.password ? (
              <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.password.message}</p>
            ) : null}
          </div>
          <div>
            <PasswordInput
              placeholder="Confirm password"
              autoComplete="new-password"
              {...registerForm.register('confirmPassword')}
            />
            {registerForm.formState.errors.confirmPassword ? (
              <p className="mt-1 text-xs text-red-600">{registerForm.formState.errors.confirmPassword.message}</p>
            ) : null}
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      ) : null}

      {mode === 'verify' && pendingRegister ? (
        <form className="space-y-3" onSubmit={onVerifyOtp}>
          <p className="text-sm text-slate-600">Enter the 6-digit code sent to {pendingRegister.email}</p>
          <div>
            <Input
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              {...otpForm.register('otp')}
            />
            {otpForm.formState.errors.otp ? (
              <p className="mt-1 text-xs text-red-600">{otpForm.formState.errors.otp.message}</p>
            ) : null}
          </div>
          <Button className="w-full" type="submit" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Verify & continue'}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs font-medium text-slate-900 underline"
            onClick={handleResendOtp}
            disabled={submitting}
          >
            Resend code
          </button>
        </form>
      ) : null}
    </Modal>
  )
}
