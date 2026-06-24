export const ProductCardSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
    {/* Image area */}
    <div className="aspect-[4/5] animate-pulse bg-slate-200 dark:bg-slate-800" />

    {/* Content */}
    <div className="space-y-3 p-4">
      {/* Category pill */}
      <div className="h-4 w-20 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />

      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-7 w-7 flex-shrink-0 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Description lines */}
      <div className="space-y-1.5">
        <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Price */}
      <div className="h-5 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />

      {/* Buttons */}
      <div className="space-y-2 pt-1">
        <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
        <div className="flex gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
          <div className="h-9 w-10 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  </div>
)
