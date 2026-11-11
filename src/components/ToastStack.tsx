import { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Sparkles, X } from 'lucide-react'
import { useUiStore } from '../store/useUiStore'

function ToastItem({ id, title, body }: { id: string; title: string; body?: string }) {
  const dismiss = useUiStore((state) => state.dismissToast)
  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(id), 4200)
    return () => window.clearTimeout(timer)
  }, [dismiss, id])

  return (
    <motion.div
      className="toast"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
    >
      <span className="toast-icon">
        <Sparkles size={18} />
      </span>
      <div className="toast-copy">
        <strong>{title}</strong>
        {body && <span>{body}</span>}
      </div>
      <button type="button" className="icon-btn" onClick={() => dismiss(id)} aria-label="Закрыть">
        <X size={16} />
      </button>
    </motion.div>
  )
}

export function ToastStack() {
  const toasts = useUiStore((state) => state.toasts)
  return (
    <div className="toast-stack" aria-live="polite">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
