import { cn } from '@/utils/cn'

type BadgeProps = {
  children: React.ReactNode
  className?: string
}

export const Badge = ({ children, className }: BadgeProps) => (
  <span className={cn('inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700', className)}>
    {children}
  </span>
)
