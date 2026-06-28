'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompareArrows, X } from 'lucide-react'
import { clearCompare, useCompareIds } from '@/hooks/use-compare'

export const CompareBar = () => {
  const pathname = usePathname()
  const ids = useCompareIds()

  // Hide on the compare screen itself or when nothing is selected
  const hidden = ids.length === 0 || pathname?.startsWith('/compare')

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 30 }}
          className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4"
        >
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/95 py-2 pl-4 pr-2 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <GitCompareArrows className="h-4 w-4" />
              {ids.length} to compare
            </span>
            <Link
              href={`/compare?ids=${ids.join(',')}`}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Compare
            </Link>
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              aria-label="Clear comparison"
              title="Clear comparison"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
