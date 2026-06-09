'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/utils/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
}

export const Modal = ({ open, onClose, children, className }: ModalProps) => (
  <AnimatePresence>
    {open ? (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={cn('w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl', className)}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    ) : null}
  </AnimatePresence>
)
