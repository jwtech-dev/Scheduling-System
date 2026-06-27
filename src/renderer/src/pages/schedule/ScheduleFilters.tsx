import type { ScheduleFormData } from '../../hooks/useScheduleData'

interface ScheduleFiltersProps {
  statusFilter: string
  onStatusChange: (value: string) => void
  draftCount: number
  onPublishAll: () => void
  onNewEntry: () => void
  activeTerm: { academicYear?: { label: string }; semester?: { semester_type: string } } | null
}

export default function ScheduleFilters({
  statusFilter,
  onStatusChange,
  draftCount,
  onPublishAll,
  onNewEntry,
  activeTerm
}: ScheduleFiltersProps): JSX.Element {
  return (
    <div className="flex items-center justify-between sticky top-0 z-10 bg-surface-50 pb-4 -mx-6 px-6 pt-4">
      <div>
        {activeTerm?.academicYear && (
          <p className="text-sm text-surface-500">
            {activeTerm.academicYear.label}
            {activeTerm.semester ? ` · ${activeTerm.semester.semester_type.replace('_', ' ')}` : ''}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">All Status</option>
          <option value="DRAFT">Drafts</option>
          <option value="PUBLISHED">Published</option>
        </select>
        {draftCount > 0 && (
          <button
            onClick={onPublishAll}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            Publish All Drafts ({draftCount})
          </button>
        )}
        <button
          onClick={onNewEntry}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
        >
          + New Entry
        </button>
      </div>
    </div>
  )
}
