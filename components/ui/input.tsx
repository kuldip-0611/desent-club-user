import * as React from 'react'
import { cn } from '@/utils/cn'

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-200 transition focus:border-slate-900 focus:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-white dark:focus:ring-slate-600',
      className,
    )}
    {...props}
  />
))

Input.displayName = 'Input'
