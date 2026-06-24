'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

type DrawerProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
}

export const Drawer = ({ open, onClose, title, children }: DrawerProps) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-950"
          onClick={(event) => event.stopPropagation()}
        >
          {title ? (
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-800 sm:px-5">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="flex shrink-0 justify-end px-4 pt-4 sm:px-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-5 pt-4 sm:px-5">{children}</div>
        </motion.aside>
      </motion.div>
    ) : null}
  </AnimatePresence>
)
