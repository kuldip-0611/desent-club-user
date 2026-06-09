'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Formik, ErrorMessage } from 'formik'
import { toast } from 'react-hot-toast'
import { PasswordInput } from '@/components/ui/password-input'
import { Button } from '@/components/ui/button'
import { changePassword } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth-store'
import { changePasswordSchema } from '@/src/utils/validation'

type ChangePasswordValues = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const ChangePasswordForm = () => {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [isSaving, setIsSaving] = useState(false)

  return (
    <Formik<ChangePasswordValues>
      initialValues={{ currentPassword: '', newPassword: '', confirmPassword: '' }}
      validationSchema={changePasswordSchema}
      onSubmit={async (values) => {
        setIsSaving(true)
        try {
          const { message } = await changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          })
          await logout()
          toast.success(message)
          router.push('/login')
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Could not change password')
        } finally {
          setIsSaving(false)
        }
      }}
    >
      {({ handleChange, handleBlur, values, isValid, dirty }) => (
        <Form className="mt-4 space-y-3 border-t border-slate-200 pt-4">
          <h2 className="text-sm font-semibold text-slate-900">Change password</h2>
          <p className="text-xs text-slate-500">You will be signed out on all devices after updating.</p>

          <div>
            <label htmlFor="currentPassword" className="mb-1 block text-xs font-medium text-slate-700">
              Current password
            </label>
            <PasswordInput
              id="currentPassword"
              name="currentPassword"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600">
              <ErrorMessage name="currentPassword" />
            </p>
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-xs font-medium text-slate-700">
              New password
            </label>
            <PasswordInput
              id="newPassword"
              name="newPassword"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600">
              <ErrorMessage name="newPassword" />
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-xs font-medium text-slate-700">
              Confirm new password
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full"
            />
            <p className="mt-1 text-xs text-red-600">
              <ErrorMessage name="confirmPassword" />
            </p>
          </div>

          <Button type="submit" disabled={isSaving || !isValid || !dirty}>
            {isSaving ? 'Updating…' : 'Update password'}
          </Button>
        </Form>
      )}
    </Formik>
  )
}
