import { useDepartment, type Quarter } from '../contexts/DepartmentContext'

const QUARTERS: Quarter[] = ['Q1', 'Q2', 'Q3', 'Q4']

export default function QuarterSwitcher(): JSX.Element {
  const { quarter, setQuarter } = useDepartment()

  return (
    <div className="flex items-center bg-surface-100 rounded-lg p-0.5">
      {QUARTERS.map((q) => (
        <button
          key={q}
          onClick={() => setQuarter(q)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
            quarter === q
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          {q}
        </button>
      ))}
    </div>
  )
}
