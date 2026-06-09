'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/utils/cn'

const defaultInputClass =
  'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 pr-10 text-sm outline-none ring-indigo-100 transition focus:border-indigo-500 focus:ring-2'

type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  toggleVariant?: 'default' | 'auth'
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, toggleVariant = 'default', ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(defaultInputClass, className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className={cn(
            'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 transition',
            toggleVariant === 'auth'
              ? 'text-white/60 hover:bg-white/10 hover:text-white'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
          )}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
