import { createContext, useContext, useState, type ReactNode } from 'react'
import type { GradeLevel } from '@shared/types'

interface GradeLevelFilterContextType {
  gradeLevel: GradeLevel
  setGradeLevel: (gl: GradeLevel) => void
}

const GradeLevelFilterContext = createContext<GradeLevelFilterContextType>({
  gradeLevel: 'GRADE_11',
  setGradeLevel: () => {}
})

export function GradeLevelFilterProvider({ children }: { children: ReactNode }): JSX.Element {
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('GRADE_11')
  return (
    <GradeLevelFilterContext.Provider value={{ gradeLevel, setGradeLevel }}>
      {children}
    </GradeLevelFilterContext.Provider>
  )
}

export function useGradeLevelFilter(): GradeLevelFilterContextType {
  return useContext(GradeLevelFilterContext)
}
