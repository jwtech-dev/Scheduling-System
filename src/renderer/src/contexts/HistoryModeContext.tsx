// ============================================================
// HistoryModeContext — View a completed academic year across all pages
// ============================================================
// When a user enters history mode from the AcademicYearHistoryPage,
// all pages that consume this context can scope their data to the
// historical AY instead of the active one.
//
// State is persisted to sessionStorage so it survives in-app navigation
// but clears automatically when the window/tab is closed or on logout.
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AcademicYear } from '@shared/types'

const SESSION_KEY = 'historyMode:ay'

// ── Helpers ──────────────────────────────────────────────────────────────────

function loadFromSession(): AcademicYear | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AcademicYear
  } catch {
    return null
  }
}

function saveToSession(ay: AcademicYear | null): void {
  try {
    if (ay) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(ay))
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
  } catch {
    // sessionStorage may be unavailable in some contexts — fail silently
  }
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface HistoryModeState {
  /** The academic year being viewed in history mode, or null if not in history mode */
  historyAy: AcademicYear | null
  /** True when the user is browsing a completed academic year */
  isHistoryMode: boolean
  /** Enter history mode for a specific completed AY */
  enterHistoryMode: (ay: AcademicYear) => void
  /** Exit history mode and return to the active term */
  exitHistoryMode: () => void
}

const HistoryModeContext = createContext<HistoryModeState | null>(null)

// ── Provider ─────────────────────────────────────────────────────────────────

export function HistoryModeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [historyAy, setHistoryAy] = useState<AcademicYear | null>(() => loadFromSession())

  const enterHistoryMode = useCallback((ay: AcademicYear) => {
    saveToSession(ay)
    setHistoryAy(ay)
  }, [])

  const exitHistoryMode = useCallback(() => {
    saveToSession(null)
    setHistoryAy(null)
  }, [])

  return (
    <HistoryModeContext.Provider
      value={{
        historyAy,
        isHistoryMode: historyAy !== null,
        enterHistoryMode,
        exitHistoryMode,
      }}
    >
      {children}
    </HistoryModeContext.Provider>
  )
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useHistoryMode(): HistoryModeState {
  const ctx = useContext(HistoryModeContext)
  if (!ctx) throw new Error('useHistoryMode must be used within HistoryModeProvider')
  return ctx
}
