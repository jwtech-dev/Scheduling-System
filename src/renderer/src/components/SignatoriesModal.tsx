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

  // ── Input style class string (reusable) ─────────────────
  const inputCls = 'w-full px-3 py-2 border border-surface-300 rounded-lg text-sm text-surface-900 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-surface-400'

  return (
    <SignatoriesModalContext.Provider value={{ openSignatoriesModal }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[sig-overlay-in_0.2s_ease-out]"
          onClick={handleCancel}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sig-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[38rem] max-h-[80vh] overflow-y-auto animate-[sig-dialog-in_0.2s_ease-out]"
          >
            {/* ─── Header ─── */}
            <div className="px-6 pt-6 pb-4 border-b border-surface-100">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </div>
                <div>
                  <h2 id="sig-modal-title" className="text-lg font-bold text-surface-900">
                    Document Signatories
                  </h2>
                  <p className="text-xs text-surface-500">
                    Add signatories for the exported document footer. All fields are optional.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── Body ─── */}
            <div className="px-6 py-5 space-y-4">
              {groups.map((group, gi) => (
                <div
                  key={gi}
                  className="bg-surface-50 border border-surface-200 rounded-xl p-4 transition-all"
                >
                  {/* Group header: Label + Remove */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-[0.6875rem] uppercase tracking-wider text-surface-500 font-semibold mb-1">Label</label>
                      <input
                        type="text"
                        value={group.label}
                        onChange={(e) => updateGroupLabel(gi, e.target.value)}
                        placeholder="e.g. Prepared by, Received by, Noted by"
                        className={`${inputCls} font-semibold`}
                      />
                    </div>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGroup(gi)}
                        className="mt-5 p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove signatory group"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-1.5 px-0.5">
                    <span className="text-[0.6875rem] uppercase tracking-wider text-surface-500 font-semibold">Name</span>
                    <span className="text-[0.6875rem] uppercase tracking-wider text-surface-500 font-semibold">Position</span>
                    <span />
                  </div>

                  {/* Entries */}
                  <div className="space-y-2">
                    {group.entries.map((entry, ei) => (
                      <div key={ei} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-center">
                        <input
                          type="text"
                          value={entry.name}
                          onChange={(e) => updateEntry(gi, ei, 'name', e.target.value)}
                          placeholder="Full Name"
                          className={inputCls}
                        />
                        <input
                          type="text"
                          value={entry.position}
                          onChange={(e) => updateEntry(gi, ei, 'position', e.target.value)}
                          placeholder="Title / Position"
                          className={inputCls}
                        />
                        {group.entries.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeEntry(gi, ei)}
                            className="p-1.5 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                            title="Remove entry"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        ) : <div className="w-8" />}
                      </div>
                    ))}
                  </div>

                  {/* Add entry button */}
                  <button
                    type="button"
                    onClick={() => addEntry(gi)}
                    className="mt-3 px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    + Add Name / Position
                  </button>
                </div>
              ))}

              {/* Add Signatory Group */}
              <button
                type="button"
                onClick={addGroup}
                className="w-full py-2.5 border-2 border-dashed border-surface-300 hover:border-primary-400 text-sm font-medium text-surface-500 hover:text-primary-600 rounded-xl transition-colors hover:bg-primary-50/50"
              >
                + Add Signatory
              </button>
            </div>

            {/* ─── Footer ─── */}
            <div className="px-6 py-4 border-t border-surface-100 flex justify-end gap-2 bg-surface-50/50 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
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
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </SignatoriesModalContext.Provider>
  )
}
