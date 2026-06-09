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
          className="absolute right-0 top-0 h-full w-full max-w-md bg-white p-5 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          {title ? <h3 className="mb-4 text-lg font-semibold">{title}</h3> : null}
          {children}
        </motion.aside>
      </motion.div>
    ) : null}
  </AnimatePresence>
)
