'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginWithEmail, registerWithEmail } from '@/services'
import { useAuthStore } from '@/store/auth-store'
import { useUiStore } from '@/store/ui-store'

const loginSchema = z.object({
  email: z.string().email(),
})

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

type LoginValues = z.infer<typeof loginSchema>
type RegisterValues = z.infer<typeof registerSchema>

export const AuthModal = () => {
  const modal = useUiStore((s) => s.modal)
  const close = useUiStore((s) => s.closeModal)
  const setSession = useAuthStore((s) => s.setSession)
  const [mode, setMode] = useState<'login' | 'register'>('login')

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '' } })
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '' },
  })

  const onLogin = loginForm.handleSubmit(async (values) => {
    const res = await loginWithEmail(values.email)
    setSession(res.token, res.user)
    toast.success('Logged in successfully')
    close()
  })

  const onRegister = registerForm.handleSubmit(async (values) => {
    const res = await registerWithEmail(values.name, values.email)
    setSession(res.token, res.user)
    toast.success('Account created')
    close()
  })

  return (
    <Modal open={modal === 'auth'} onClose={close}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{mode === 'login' ? 'Login' : 'Create account'}</h3>
        <button
          className="text-xs font-medium text-indigo-600"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? 'Need account?' : 'Have account?'}
        </button>
      </div>
      {mode === 'login' ? (
        <form className="space-y-3" onSubmit={onLogin}>
          <Input placeholder="Email address" {...loginForm.register('email')} />
          <Button className="w-full" type="submit">
            Continue
          </Button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={onRegister}>
          <Input placeholder="Full name" {...registerForm.register('name')} />
          <Input placeholder="Email address" {...registerForm.register('email')} />
          <Button className="w-full" type="submit">
            Register
          </Button>
        </form>
      )}
    </Modal>
  )
}
