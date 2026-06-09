import { cn } from '@/utils/cn'

type SkeletonProps = { className?: string }

export const Skeleton = ({ className }: SkeletonProps) => (
  <div className={cn('animate-pulse rounded-xl bg-slate-200/80', className)} />
)
