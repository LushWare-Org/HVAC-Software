import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  title: string
  message: string
  variant: ToastVariant
  durationMs: number
}

interface ToastInput {
  title?: string
  message: string
  variant?: ToastVariant
  durationMs?: number
}

interface ToastContextValue {
  showToast: (input: ToastInput) => void
  showSuccess: (message: string, title?: string) => void
  showError: (message: string, title?: string) => void
  showInfo: (message: string, title?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast
  onDismiss: (id: string) => void
}) {
  const [visible, setVisible] = useState(false)

  React.useEffect(() => {
    const open = window.setTimeout(() => setVisible(true), 10)
    const close = window.setTimeout(() => {
      setVisible(false)
      window.setTimeout(() => onDismiss(toast.id), 220)
    }, toast.durationMs)

    return () => {
      window.clearTimeout(open)
      window.clearTimeout(close)
    }
  }, [toast.durationMs, toast.id, onDismiss])

  const color =
    toast.variant === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : toast.variant === 'error'
        ? 'border-red-200 bg-red-50 text-red-900'
        : 'border-blue-200 bg-blue-50 text-blue-900'

  const icon =
    toast.variant === 'success' ? (
      <CheckCircle2 size={16} className="text-emerald-600" />
    ) : toast.variant === 'error' ? (
      <AlertCircle size={16} className="text-red-600" />
    ) : (
      <Info size={16} className="text-blue-600" />
    )

  return (
    <div
      className={`pointer-events-auto w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-200 ${color}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(28px)',
      }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3 p-3.5">
        <div className="mt-0.5">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5">{toast.title}</p>
          <p className="text-sm leading-5 opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="rounded-md p-1 text-slate-500 transition-colors hover:bg-black/5 hover:text-slate-700"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((input: ToastInput) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    setToasts((prev) => [
      {
        id,
        title:
          input.title ??
          (input.variant === 'success'
            ? 'Success'
            : input.variant === 'error'
              ? 'Action Failed'
              : 'Heads Up'),
        message: input.message,
        variant: input.variant ?? 'info',
        durationMs: input.durationMs ?? 3800,
      },
      ...prev,
    ])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (message, title = 'Success') =>
        showToast({ message, title, variant: 'success' }),
      showError: (message, title = 'Action Failed') =>
        showToast({ message, title, variant: 'error', durationMs: 4500 }),
      showInfo: (message, title = 'Notice') =>
        showToast({ message, title, variant: 'info' }),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="pointer-events-none fixed right-4 top-4 z-[120000] flex flex-col gap-2">
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside ToastProvider')
  }
  return ctx
}
