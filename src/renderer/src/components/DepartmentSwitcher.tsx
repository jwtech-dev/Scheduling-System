import { useDepartment } from '../contexts/DepartmentContext'
import type { Department } from '@shared/types'
import { DEPARTMENT_LABELS } from '@shared/constants'
import { useNavigate, useLocation } from 'react-router-dom'

const DEPTS: Department[] = ['SHS', 'COLLEGE']

export default function DepartmentSwitcher(): JSX.Element {
  const { department, requestDepartmentChange } = useDepartment()
  const navigate = useNavigate()
  const location = useLocation()

  function handleSwitch(dept: Department): void {
    if (dept === department) return
    const switched = requestDepartmentChange(dept)
    // switched=true  → clean path, navigate immediately to base route
    // switched=false → dirty path, modal shown; AppShell navigates after confirm
    if (switched) {
      const segments = location.pathname.split('/').filter(Boolean)
      const base = segments.length === 0 ? '/' : `/${segments[0]}`
      navigate(base)
    }
  }

  return (
    <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
      {DEPTS.map((dept) => (
        <button
          key={dept}
          onClick={() => handleSwitch(dept)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
            department === dept
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          {DEPARTMENT_LABELS[dept]}
        </button>
      ))}
    </div>
  )
}
