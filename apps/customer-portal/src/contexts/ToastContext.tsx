import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItemData {
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
  toast: ToastItemData
  onDismiss: (id: string) => void
}) {
  const [isVisible, setIsVisible] = useState(false)

  React.useEffect(() => {
    const openTimer = window.setTimeout(() => setIsVisible(true), 10)
    const closeTimer = window.setTimeout(() => {
      setIsVisible(false)
      window.setTimeout(() => onDismiss(toast.id), 220)
    }, toast.durationMs)

    return () => {
      window.clearTimeout(openTimer)
      window.clearTimeout(closeTimer)
    }
  }, [onDismiss, toast.durationMs, toast.id])

  const variantStyles: Record<ToastVariant, React.CSSProperties> = {
    success: {
      border: '1px solid #A7F3D0',
      background: '#ECFDF5',
      color: '#065F46',
    },
    error: {
      border: '1px solid #FECACA',
      background: '#FEF2F2',
      color: '#991B1B',
    },
    info: {
      border: '1px solid #BFDBFE',
      background: '#EFF6FF',
      color: '#1E40AF',
    },
  }

  const icon =
    toast.variant === 'success' ? (
      <CheckCircle2 size={16} color="#10B981" />
    ) : toast.variant === 'error' ? (
      <AlertCircle size={16} color="#DC2626" />
    ) : (
      <Info size={16} color="#2563EB" />
    )

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        pointerEvents: 'auto',
        width: 360,
        maxWidth: 'calc(100vw - 1.5rem)',
        borderRadius: 12,
        boxShadow: '0 10px 24px rgba(15, 23, 42, 0.18)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(24px)',
        ...variantStyles[toast.variant],
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 12px' }}>
        <div style={{ marginTop: 2 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}>{toast.title}</div>
          <div style={{ fontSize: 12, opacity: 0.95, lineHeight: 1.5 }}>{toast.message}</div>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          style={{
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            borderRadius: 6,
            width: 24,
            height: 24,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.75,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showToast = useCallback((input: ToastInput) => {
    const id =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`

    const variant = input.variant ?? 'info'
    setToasts(prev => [
      {
        id,
        title:
          input.title ??
          (variant === 'success' ? 'Success' : variant === 'error' ? 'Action Failed' : 'Notice'),
        message: input.message,
        variant,
        durationMs: input.durationMs ?? (variant === 'error' ? 4500 : 3500),
      },
      ...prev,
    ])
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      showSuccess: (message, title = 'Success') => showToast({ message, title, variant: 'success' }),
      showError: (message, title = 'Action Failed') => showToast({ message, title, variant: 'error' }),
      showInfo: (message, title = 'Notice') => showToast({ message, title, variant: 'info' }),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: 14,
              right: 14,
              zIndex: 120000,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              pointerEvents: 'none',
            }}
          >
            {toasts.map(toast => (
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
