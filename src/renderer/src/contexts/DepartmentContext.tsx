import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Department, QuarterLabel } from '@shared/types'

export type Quarter = QuarterLabel

interface DepartmentState {
  department: Department
  setDepartment: (dept: Department) => void
  quarter: Quarter
  setQuarter: (q: Quarter) => void
}

const DepartmentContext = createContext<DepartmentState | null>(null)

const VALID_QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

export function DepartmentProvider({ children }: { children: ReactNode }): JSX.Element {
  const [department, setDeptState] = useState<Department>(() => {
    // Persist last selection in localStorage
    const saved = localStorage.getItem('activeDepartment')
    return saved === 'COLLEGE' ? 'COLLEGE' : 'SHS'
  })

  const [quarter, setQuarterState] = useState<Quarter>(() => {
    const saved = localStorage.getItem('activeQuarter')
    return VALID_QUARTERS.includes(saved as Quarter) ? (saved as Quarter) : 'Q1'
  })

  const setDepartment = useCallback((dept: Department) => {
    setDeptState(dept)
    localStorage.setItem('activeDepartment', dept)
  }, [])

  const setQuarter = useCallback((q: Quarter) => {
    setQuarterState(q)
    localStorage.setItem('activeQuarter', q)
  }, [])

  return (
    <DepartmentContext.Provider value={{ department, setDepartment, quarter, setQuarter }}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment(): DepartmentState {
  const ctx = useContext(DepartmentContext)
  if (!ctx) throw new Error('useDepartment must be used within DepartmentProvider')
  return ctx
}
