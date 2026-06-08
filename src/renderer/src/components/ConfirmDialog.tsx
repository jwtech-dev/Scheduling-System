import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode
} from 'react'

// ── Types ────────────────────────────────────────────────────

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  cascadeInfo?: string // e.g., "This will archive 47 schedule entries."
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null)

// ── Hook ─────────────────────────────────────────────────────

export function useConfirmDialog(): ConfirmDialogContextValue {
  const ctx = useContext(ConfirmDialogContext)
  if (!ctx) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')
  return ctx
}

// ── Provider ─────────────────────────────────────────────────

export function ConfirmDialogProvider({ children }: { children: ReactNode }): JSX.Element {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const handleCancel = useCallback(() => {
    resolverRef.current?.(false)
    resolverRef.current = null
    setOptions(null)
  }, [])

  // Focus trap and keyboard handling
  useEffect(() => {
    if (!options) return

    // Focus confirm button on open
    setTimeout(() => confirmBtnRef.current?.focus(), 50)

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleCancel()
      }
      // Focus trap within dialog
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [options, handleCancel])

  const variantColor = options?.variant === 'danger' ? '#ef4444' : '#f59e0b'
  const variantHover = options?.variant === 'danger' ? '#dc2626' : '#d97706'

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            animation: 'confirm-overlay-in 0.2s ease-out'
          }}
          onClick={handleCancel}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              animation: 'confirm-dialog-in 0.2s ease-out',
              color: '#e2e8f0',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            <h2
              id="confirm-title"
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                color: '#f1f5f9'
              }}
            >
              {options.title}
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.875rem', marginBottom: options.cascadeInfo ? '0.75rem' : '1.5rem' }}>
              {options.message}
            </p>
            {options.cascadeInfo && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '0.375rem',
                  padding: '0.625rem 0.75rem',
                  fontSize: '0.8125rem',
                  color: '#fca5a5',
                  marginBottom: '1.5rem',
                  lineHeight: 1.5
                }}
              >
                ⚠ {options.cascadeInfo}
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  background: 'rgba(148, 163, 184, 0.1)',
                  color: '#94a3b8',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')}
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={handleConfirm}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  background: variantColor,
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = variantHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = variantColor)}
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes confirm-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes confirm-dialog-in {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </ConfirmDialogContext.Provider>
  )
}
