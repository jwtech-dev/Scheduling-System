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

export interface SignatoryEntry {
  name: string
  position: string
}

export interface SignatoryGroup {
  label: string
  entries: SignatoryEntry[]
}

interface SignatoriesModalContextValue {
  openSignatoriesModal: () => Promise<SignatoryGroup[] | null>
}

const SignatoriesModalContext = createContext<SignatoriesModalContextValue | null>(null)

// ── Hook ─────────────────────────────────────────────────────

export function useSignatoriesModal(): SignatoriesModalContextValue {
  const ctx = useContext(SignatoriesModalContext)
  if (!ctx) throw new Error('useSignatoriesModal must be used within SignatoriesModalProvider')
  return ctx
}

// ── Helpers ──────────────────────────────────────────────────

function createEmptyEntry(): SignatoryEntry {
  return { name: '', position: '' }
}

function createEmptyGroup(): SignatoryGroup {
  return { label: '', entries: [createEmptyEntry()] }
}

/** Load defaults from Settings for pre-population */
async function loadDefaults(): Promise<SignatoryGroup[]> {
  try {
    const result = (await window.electronAPI.getAllSettings()) as {
      data?: Record<string, string>
    }
    const s = result.data ?? {}
    const groups: SignatoryGroup[] = []

    if (s.prepared_by_name || s.prepared_by_title) {
      groups.push({
        label: 'Prepared by',
        entries: [{ name: s.prepared_by_name ?? '', position: s.prepared_by_title ?? '' }]
      })
    }
    if (s.received_by_name || s.received_by_title) {
      groups.push({
        label: 'Received by',
        entries: [{ name: s.received_by_name ?? '', position: s.received_by_title ?? '' }]
      })
    }
    return groups
  } catch {
    return []
  }
}

// ── Provider ─────────────────────────────────────────────────

export function SignatoriesModalProvider({ children }: { children: ReactNode }): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [groups, setGroups] = useState<SignatoryGroup[]>([])
  const resolverRef = useRef<((value: SignatoryGroup[] | null) => void) | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const hasLoadedDefaults = useRef(false)

  const openSignatoriesModal = useCallback(async (): Promise<SignatoryGroup[] | null> => {
    // Pre-populate from settings on first open
    if (!hasLoadedDefaults.current) {
      const defaults = await loadDefaults()
      setGroups(defaults.length > 0 ? defaults : [createEmptyGroup()])
      hasLoadedDefaults.current = true
    } else if (groups.length === 0) {
      setGroups([createEmptyGroup()])
    }

    setIsOpen(true)
    return new Promise<SignatoryGroup[] | null>((resolve) => {
      resolverRef.current = resolve
    })
  }, [groups.length])

  const handleExport = useCallback(() => {
    // Filter out empty entries and groups
    const cleaned = groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => e.name.trim() || e.position.trim())
      }))
      .filter((g) => g.label.trim() && g.entries.length > 0)

    resolverRef.current?.(cleaned)
    resolverRef.current = null
    setIsOpen(false)
  }, [groups])

  const handleCancel = useCallback(() => {
    resolverRef.current?.(null)
    resolverRef.current = null
    setIsOpen(false)
  }, [])

  // Keyboard handling
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleCancel()
      }
      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])'
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

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, handleCancel])

  // ── Group / Entry mutators ──────────────────────────────

  const updateGroupLabel = (gi: number, label: string): void => {
    setGroups((prev) => prev.map((g, i) => (i === gi ? { ...g, label } : g)))
  }

  const removeGroup = (gi: number): void => {
    setGroups((prev) => {
      const next = prev.filter((_, i) => i !== gi)
      return next.length === 0 ? [createEmptyGroup()] : next
    })
  }

  const addGroup = (): void => {
    setGroups((prev) => [...prev, createEmptyGroup()])
  }

  const updateEntry = (gi: number, ei: number, field: 'name' | 'position', value: string): void => {
    setGroups((prev) =>
      prev.map((g, i) =>
        i === gi
          ? {
              ...g,
              entries: g.entries.map((e, j) => (j === ei ? { ...e, [field]: value } : e))
            }
          : g
      )
    )
  }

  const removeEntry = (gi: number, ei: number): void => {
    setGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gi) return g
        const next = g.entries.filter((_, j) => j !== ei)
        return { ...g, entries: next.length === 0 ? [createEmptyEntry()] : next }
      })
    )
  }

  const addEntry = (gi: number): void => {
    setGroups((prev) =>
      prev.map((g, i) => (i === gi ? { ...g, entries: [...g.entries, createEmptyEntry()] } : g))
    )
  }

  // ── Styles ──────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    background: 'rgba(148, 163, 184, 0.08)',
    color: '#e2e8f0',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    fontSize: '0.875rem',
    outline: 'none',
    transition: 'border-color 0.15s'
  }

  const btnSecondary: React.CSSProperties = {
    padding: '0.375rem 0.75rem',
    borderRadius: '0.375rem',
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    cursor: 'pointer',
    fontSize: '0.8125rem',
    fontWeight: 500,
    transition: 'all 0.15s'
  }

  const btnDanger: React.CSSProperties = {
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    background: 'transparent',
    color: '#f87171',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1,
    transition: 'color 0.15s'
  }

  return (
    <SignatoriesModalContext.Provider value={{ openSignatoriesModal }}>
      {children}
      {isOpen && (
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
            animation: 'sig-overlay-in 0.2s ease-out'
          }}
          onClick={handleCancel}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sig-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1e293b',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              maxWidth: '40rem',
              width: '90%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              animation: 'sig-dialog-in 0.2s ease-out',
              color: '#e2e8f0',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            {/* Header */}
            <h2
              id="sig-modal-title"
              style={{
                fontSize: '1.125rem',
                fontWeight: 700,
                marginBottom: '0.25rem',
                color: '#f1f5f9'
              }}
            >
              Document Signatories
            </h2>
            <p
              style={{
                color: '#64748b',
                fontSize: '0.8125rem',
                marginBottom: '1.25rem',
                lineHeight: 1.5
              }}
            >
              Add signatories for the exported document footer. All fields are optional.
            </p>

            {/* Signatory Groups */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {groups.map((group, gi) => (
                <div
                  key={gi}
                  style={{
                    background: 'rgba(148, 163, 184, 0.05)',
                    border: '1px solid rgba(148, 163, 184, 0.12)',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}
                >
                  {/* Group header: Label + Remove */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <input
                      type="text"
                      value={group.label}
                      onChange={(e) => updateGroupLabel(gi, e.target.value)}
                      placeholder="Label (e.g. Prepared by)"
                      style={{ ...inputStyle, fontWeight: 600 }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)')
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)')
                      }
                    />
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGroup(gi)}
                        style={btnDanger}
                        title="Remove signatory group"
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#f87171')}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Column headers */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 28px',
                      gap: '0.5rem',
                      marginBottom: '0.375rem',
                      padding: '0 0.125rem'
                    }}
                  >
                    <span
                      style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                    >
                      Name
                    </span>
                    <span
                      style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}
                    >
                      Position
                    </span>
                    <span />
                  </div>

                  {/* Entries */}
                  {group.entries.map((entry, ei) => (
                    <div
                      key={ei}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 28px',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}
                    >
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(gi, ei, 'name', e.target.value)}
                        placeholder="Full Name"
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)')
                        }
                      />
                      <input
                        type="text"
                        value={entry.position}
                        onChange={(e) => updateEntry(gi, ei, 'position', e.target.value)}
                        placeholder="Title / Position"
                        style={inputStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)')
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.2)')
                        }
                      />
                      {group.entries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEntry(gi, ei)}
                          style={{ ...btnDanger, padding: '0.25rem' }}
                          title="Remove entry"
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#f87171')}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Add entry button */}
                  <button
                    type="button"
                    onClick={() => addEntry(gi)}
                    style={{ ...btnSecondary, fontSize: '0.75rem', marginTop: '0.25rem' }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')
                    }
                  >
                    + Add Name / Position
                  </button>
                </div>
              ))}
            </div>

            {/* Add Signatory Group */}
            <button
              type="button"
              onClick={addGroup}
              style={{
                ...btnSecondary,
                width: '100%',
                marginTop: '0.75rem',
                padding: '0.5rem',
                textAlign: 'center',
                borderStyle: 'dashed'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')
              }
            >
              + Add Signatory
            </button>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                justifyContent: 'flex-end',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(148, 163, 184, 0.1)'
              }}
            >
              <button
                type="button"
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
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.2)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(148, 163, 184, 0.1)')
                }
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  background: '#4f46e5',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4338ca')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#4f46e5')}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes sig-overlay-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sig-dialog-in {
          from { opacity: 0; transform: scale(0.95) translateY(-10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </SignatoriesModalContext.Provider>
  )
}
