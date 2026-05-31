import { useDepartment } from '../contexts/DepartmentContext'
import type { Department } from '@shared/types'
import { DEPARTMENT_LABELS } from '@shared/constants'

const DEPTS: Department[] = ['SHS', 'COLLEGE']

export default function DepartmentSwitcher(): JSX.Element {
  const { department, setDepartment } = useDepartment()

  return (
    <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
      {DEPTS.map((dept) => (
        <button
          key={dept}
          onClick={() => setDepartment(dept)}
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
