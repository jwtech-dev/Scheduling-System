import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Department } from '@shared/types'

interface DepartmentState {
  department: Department
  setDepartment: (dept: Department) => void
}

const DepartmentContext = createContext<DepartmentState | null>(null)

export function DepartmentProvider({ children }: { children: ReactNode }): JSX.Element {
  const [department, setDeptState] = useState<Department>(() => {
    // Persist last selection in localStorage
    const saved = localStorage.getItem('activeDepartment')
    return saved === 'COLLEGE' ? 'COLLEGE' : 'SHS'
  })

  const setDepartment = useCallback((dept: Department) => {
    setDeptState(dept)
    localStorage.setItem('activeDepartment', dept)
  }, [])

  return (
    <DepartmentContext.Provider value={{ department, setDepartment }}>
      {children}
    </DepartmentContext.Provider>
  )
}

export function useDepartment(): DepartmentState {
  const ctx = useContext(DepartmentContext)
  if (!ctx) throw new Error('useDepartment must be used within DepartmentProvider')
  return ctx
}
