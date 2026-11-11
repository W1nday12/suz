import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface SheetProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  className?: string
  full?: boolean
}

export function Sheet({ open, onClose, title, children, className, full }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="sheet-root">
          <motion.button
            type="button"
            className="sheet-backdrop"
            aria-label="Закрыть"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.section
            className={clsx('sheet', full && 'sheet-full', className)}
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div className="sheet-grab" />
            {title && (
              <header className="sheet-head">
                <h2>{title}</h2>
                <button type="button" className="icon-btn" onClick={onClose} aria-label="Закрыть">
                  <X size={20} />
                </button>
              </header>
            )}
            <div className="sheet-body">{children}</div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
