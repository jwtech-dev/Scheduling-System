import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

// ── Types ────────────────────────────────────────────────────

type ToastVariant = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  duration: number
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant, duration?: number) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ── Hook ─────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

// ── Provider ─────────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981', icon: '✓' },
  error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444', icon: '✕' },
  warning: { bg: 'rgba(245, 158, 11, 0.95)', border: '#f59e0b', icon: '⚠' },
  info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6', icon: 'ℹ' }
}

export function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const counterRef = useRef(0)

  const removeToast = useCallback((id: string) => {
    setExiting((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      setExiting((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300) // match animation duration
  }, [])

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info', duration = 5000) => {
      const id = `toast-${++counterRef.current}`
      setToasts((prev) => [...prev, { id, message, variant, duration }])
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration)
      }
    },
    [removeToast]
  )

  const value: ToastContextValue = {
    toast: addToast,
    success: useCallback((msg: string) => addToast(msg, 'success'), [addToast]),
    error: useCallback((msg: string) => addToast(msg, 'error', 8000), [addToast]),
    warning: useCallback((msg: string) => addToast(msg, 'warning', 6000), [addToast]),
    info: useCallback((msg: string) => addToast(msg, 'info'), [addToast])
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — bottom-right fixed */}
      <div
        style={{
          position: 'fixed',
          bottom: '1rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '0.5rem',
          maxWidth: '24rem',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          const style = VARIANT_STYLES[t.variant]
          const isExiting = exiting.has(t.id)
          return (
            <div
              key={t.id}
              role="alert"
              style={{
                background: style.bg,
                borderLeft: `4px solid ${style.border}`,
                color: '#fff',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                pointerEvents: 'auto',
                cursor: 'pointer',
                animation: isExiting ? 'toast-exit 0.3s ease-in forwards' : 'toast-enter 0.3s ease-out',
                backdropFilter: 'blur(8px)',
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.4
              }}
              onClick={() => removeToast(t.id)}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{style.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes toast-enter {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes toast-exit {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(100%); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
