// ============================================================
// DepartmentContext — Per-route department selection
// ============================================================
// Each route gets its own department, persisted to localStorage.
// Pages can register "dirty" state (open forms) so that switching
// department triggers a confirmation modal instead of switching immediately.
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import type { Department, QuarterLabel } from '@shared/types'

export type Quarter = QuarterLabel

// ── Helpers ────────────────────────────────────────────────────────────────

/** Strip dynamic segments so /academic-years/abc123 → /academic-years */
function baseRoute(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  // Keep only the first segment (the feature root)
  return segments.length === 0 ? '/' : `/${segments[0]}`
}

function lsKey(route: string): string {
  return `dept:${route}`
}

function readDeptForRoute(route: string): Department {
  const saved = localStorage.getItem(lsKey(route))
  return saved === 'COLLEGE' ? 'COLLEGE' : 'SHS'
}

function writeDeptForRoute(route: string, dept: Department): void {
  localStorage.setItem(lsKey(route), dept)
}

const VALID_QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

// ── Context shape ───────────────────────────────────────────────────────────

interface DepartmentState {
  /** The current page's department */
  department: Department
  /** Internal: set department directly (skip dirty check) */
  setDepartment: (dept: Department) => void
  /** Call this from DepartmentSwitcher — runs dirty check first */
  requestDepartmentChange: (dept: Department) => void
  /** Quarter (global override, not per-route) */
  quarter: Quarter
  setQuarter: (q: Quarter) => void
  /** Pages register their dirty state here */
  registerDirty: (isDirty: boolean) => void
  /** Pending switch details (non-null when confirmation modal is needed) */
  pendingDept: Department | null
  /** Confirm the pending switch */
  confirmDeptChange: () => void
  /** Cancel the pending switch */
  cancelDeptChange: () => void
}

const DepartmentContext = createContext<DepartmentState | null>(null)

// ── Provider ────────────────────────────────────────────────────────────────

export function DepartmentProvider({ children }: { children: ReactNode }): JSX.Element {
  const location = useLocation()
  const route = baseRoute(location.pathname)

  // Per-route department — re-reads from localStorage whenever route changes
  const [department, setDeptState] = useState<Department>(() => readDeptForRoute(route))

  // Track current route in a ref to avoid stale-closure issues
  const routeRef = useRef(route)
  routeRef.current = route

  // When route changes, load that route's saved department
  useEffect(() => {
    setDeptState(readDeptForRoute(route))
  }, [route])

  // Global quarter override (unchanged from before)
  const [quarter, setQuarterState] = useState<Quarter>(() => {
    const saved = localStorage.getItem('activeQuarter')
    return VALID_QUARTERS.includes(saved as Quarter) ? (saved as Quarter) : 'Q1'
  })

  // Dirty flag — pages register whether they have unsaved changes
  const isDirtyRef = useRef(false)

  // Pending department change (waiting for user confirmation)
  const [pendingDept, setPendingDept] = useState<Department | null>(null)

  const setDepartment = useCallback((dept: Department) => {
    setDeptState(dept)
    writeDeptForRoute(routeRef.current, dept)
  }, [])

  const setQuarter = useCallback((q: Quarter) => {
    setQuarterState(q)
    localStorage.setItem('activeQuarter', q)
  }, [])

  const registerDirty = useCallback((isDirty: boolean) => {
    isDirtyRef.current = isDirty
  }, [])

  const requestDepartmentChange = useCallback((dept: Department) => {
    if (isDirtyRef.current) {
      // Page has unsaved changes — ask for confirmation
      setPendingDept(dept)
    } else {
      setDeptState(dept)
      writeDeptForRoute(routeRef.current, dept)
    }
  }, [])

  const confirmDeptChange = useCallback(() => {
    if (pendingDept) {
      setDeptState(pendingDept)
      writeDeptForRoute(routeRef.current, pendingDept)
      isDirtyRef.current = false
    }
    setPendingDept(null)
  }, [pendingDept])

  const cancelDeptChange = useCallback(() => {
    setPendingDept(null)
  }, [])

  return (
    <DepartmentContext.Provider
      value={{
        department,
        setDepartment,
        requestDepartmentChange,
        quarter,
        setQuarter,
        registerDirty,
        pendingDept,
        confirmDeptChange,
        cancelDeptChange,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  )
}

// ── Hooks ───────────────────────────────────────────────────────────────────

export function useDepartment(): DepartmentState {
  const ctx = useContext(DepartmentContext)
  if (!ctx) throw new Error('useDepartment must be used within DepartmentProvider')
  return ctx
}

/**
 * Call this in any page that has unsaved form state.
 * Pass `true` when a form is open/dirty, `false` when clean.
 */
export function useRegisterDirty(isDirty: boolean): void {
  const { registerDirty } = useDepartment()
  useEffect(() => {
    registerDirty(isDirty)
    // Always clean up when unmounting
    return () => registerDirty(false)
  }, [isDirty, registerDirty])
}
