import type { ScheduleEntry, Room, Personnel } from '@shared/types'
import { ACTIVITY_TYPE_LABELS, RECURRENCE_PATTERN_LABELS, CONFLICT_CODE_LABELS } from '@shared/constants'
import { parseConflictCounts } from '../../utils/conflict-utils'

interface ScheduleGridProps {
  entries: ScheduleEntry[]
  rooms: Room[]
  personnel: Personnel[]
  onEdit: (entry: ScheduleEntry) => void
  onDelete: (id: string) => void
  onPublish: (ids: string[]) => void
  onUnpublish: (ids: string[]) => void
  onViewConflict?: (entry: ScheduleEntry) => void
  loading: boolean
}

export default function ScheduleGrid({
  entries,
  rooms,
  personnel,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onViewConflict,
  loading
}: ScheduleGridProps): JSX.Element {
  const getRoomName = (id: string | null): string =>
    rooms.find((r) => r.id === id)?.room_code ?? '—'

  const getRoomDisplay = (id: string | null): string => {
    const r = rooms.find((r) => r.id === id)
    return r ? `${r.room_code} — ${r.room_name}` : '—'
  }

  const getPersonnelName = (id: string | null): string => {
    const p = personnel.find((x) => x.id === id)
    return p ? `${p.last_name}, ${p.first_name}` : '—'
  }

  if (loading) {
    return <div className="text-center py-12 text-surface-400">Loading...</div>
  }

  if (entries.length === 0) {
    return <div className="text-center py-12 text-surface-400">No schedule entries yet.</div>
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-50 border-b border-surface-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Activity Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject / Title</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Assigned Room</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Instructor</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Time Slot</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Recurrence</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {entries.map((e) => {
              const { hard, soft } = parseConflictCounts(e.conflict_flags)
              return (
                <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-surface-600">{ACTIVITY_TYPE_LABELS[e.activity_type]}</td>
                  <td className="px-4 py-3 font-medium text-surface-900">{e.subject ?? e.exam_title ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{getRoomDisplay(e.room_id)}</td>
                  <td className="px-4 py-3 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                  <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                  <td className="px-4 py-3 text-surface-500 text-xs">{RECURRENCE_PATTERN_LABELS[e.recurrence_pattern] ?? e.recurrence_pattern}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                        e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {e.status}
                    </span>
                    {hard > 0 && (
                      <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700" title={`${hard} conflict(s)`}>
                        {hard}
                      </span>
                    )}
                    {soft > 0 && (
                      <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600" title={`${soft} warning(s)`}>
                        ⚠ {soft}
                      </span>
                    )}
                    {(hard > 0 || soft > 0) && onViewConflict && (
                      <button
                        type="button"
                        onClick={() => onViewConflict(e)}
                        className="ml-1.5 text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
                      >
                        See Conflict
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    {e.status === 'DRAFT' && (
                      <>
                        <button onClick={() => onEdit(e)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                        <button onClick={() => onPublish([e.id])} className="text-green-600 hover:text-green-800 text-xs font-medium">Publish</button>
                        <button onClick={() => onDelete(e.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </>
                    )}
                    {e.status === 'PUBLISHED' && (
                      <button onClick={() => onUnpublish([e.id])} className="text-amber-600 hover:text-amber-800 text-xs font-medium">Unpublish</button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
