'use client'

import { AnimatePresence, motion } from 'framer-motion'

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
          className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {title ? (
            <h3 className="shrink-0 border-b border-slate-100 px-5 py-4 text-lg font-semibold">
              {title}
            </h3>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">{children}</div>
        </motion.aside>
      </motion.div>
    ) : null}
  </AnimatePresence>
)
