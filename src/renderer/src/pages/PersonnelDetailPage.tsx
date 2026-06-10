import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type {
  IpcResponse, Personnel, ScheduleEntry, Room, Section, ActiveTerm, ConflictFlag
} from '@shared/types'
import type { PatternMode } from '@shared/types'
import {
  DAY_LABELS, DAYS_IN_ORDER, recurrenceToPatternMode, patternModeToRecurrence,
  ACTIVITY_TYPE_LABELS
} from '@shared/constants'

export default function PersonnelDetailPage(): JSX.Element {
  const { employeeId } = useParams<{ employeeId: string }>()
  const navigate = useNavigate()
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()

  const decoded = employeeId ? decodeURIComponent(employeeId) : ''

  // Data state
  const [person, setPerson] = useState<Personnel | null>(null)
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    section_id: '',
    room_id: '',
    subject: '',
    start_time: '08:00',
    end_time: '09:00',
    selected_days: [] as number[],
    override_reason: ''
  })

  // Build lookup maps
  const roomMap = new Map(rooms.map(r => [r.id, r]))
  const sectionMap = new Map(sections.map(s => [s.id, s]))

  const load = useCallback(async () => {
    setLoading(true)
    const [persRes, roomsRes, secRes, termRes] = await Promise.all([
      window.electronAPI.listPersonnel({ department, is_shared: true }) as Promise<IpcResponse<Personnel[]>>,
      window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
      window.electronAPI.listSections({ department }) as Promise<IpcResponse<Section[]>>,
      window.electronAPI.getActiveTerm(department) as Promise<IpcResponse<ActiveTerm>>
    ])

    if (roomsRes.data) setRooms(roomsRes.data)
    if (secRes.data) setSections(secRes.data)
    if (termRes.data) setActiveTerm(termRes.data)

    const found = persRes.data?.find(p => p.employee_id === decoded) ?? null
    setPerson(found)

    if (found) {
      const schedRes = (await window.electronAPI.getPersonnelSchedule(found.id)) as IpcResponse<ScheduleEntry[]>
      if (schedRes.data) setScheduleEntries(schedRes.data)
    }

    setLoading(false)
  }, [department, decoded])

  useEffect(() => { load() }, [load])

  // Auto-fill subject when section changes
  const handleSectionChange = (sectionId: string) => {
    const sec = sections.find(s => s.id === sectionId)
    setForm(f => ({
      ...f,
      section_id: sectionId,
      subject: sec?.subject ?? f.subject
    }))
  }

  const toggleDay = (day: number) => {
    setForm(prev => {
      const days = prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
      return { ...prev, selected_days: days }
    })
  }

  const resetForm = () => {
    setForm({
      section_id: '', room_id: '', subject: '',
      start_time: '08:00', end_time: '09:00',
      selected_days: [], override_reason: ''
    })
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!activeTerm?.academicYear) {
      setError('No active academic term set. Configure one in Academic Years.')
      return
    }
    if (!person) return
    if (form.selected_days.length === 0) {
      setError('Select at least one day.')
      return
    }

    setIsSubmitting(true)
    try {
      const recurrence = patternModeToRecurrence('WEEKLY' as PatternMode, form.selected_days, null)

      const payload = {
        department,
        activity_type: 'CLASS',
        room_id: form.room_id || null,
        personnel_id: person.id,
        section_ids: form.section_id ? [form.section_id] : [],
        subject: form.subject || null,
        subject_code: null,
        modality: 'F2F',
        start_time: form.start_time,
        end_time: form.end_time,
        recurrence_pattern: recurrence.recurrence_pattern,
        custom_days: recurrence.custom_days,
        day_of_week: null,
        day_of_month: null,
        recurrence_start_date: activeTerm.semester?.start_date ?? activeTerm.academicYear.start_date,
        recurrence_end_date: activeTerm.semester?.end_date ?? activeTerm.academicYear.end_date,
        academic_year_id: activeTerm.academicYear.id,
        semester_id: activeTerm.semester?.id ?? null,
        notes: null,
        override_reason: form.override_reason || null
      }

      const result = (await window.electronAPI.createDraftEntry(payload)) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>

      if (result.error) {
        if (result.error.code === 'HARD_CONFLICT') {
          setError(result.error.message + ' Add an override reason to save anyway.')
        } else {
          setError(result.error.message)
        }
        return
      }

      toast.success('Schedule assigned successfully')
      setShowForm(false)
      resetForm()
      load()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEntry = async (entry: ScheduleEntry) => {
    const confirmed = await confirm({
      title: 'Delete Schedule Entry',
      message: `Delete this ${entry.subject ?? 'schedule'} entry?`,
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return

    const result = (await window.electronAPI.deleteDraftEntry(entry.id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Entry deleted'); load() }
  }

  /** Format days pattern for display */
  function formatDays(entry: ScheduleEntry): string {
    const mapped = recurrenceToPatternMode(
      entry.recurrence_pattern, entry.custom_days, entry.day_of_week, entry.day_of_month
    )
    if (mapped.mode === 'ONCE') return 'Once'
    if (mapped.selectedDays.length === 0) return entry.recurrence_pattern
    const ordered = DAYS_IN_ORDER.filter(d => mapped.selectedDays.includes(d))
    return ordered.map(d => DAY_LABELS[d]).join(', ')
  }

  /** Resolve section codes from JSON section_ids */
  function getSectionCodes(entry: ScheduleEntry): string {
    try {
      const ids: string[] = JSON.parse(entry.section_ids || '[]')
      return ids.map(id => sectionMap.get(id)?.section_code ?? '?').join(', ') || '—'
    } catch { return '—' }
  }

  if (loading) return <div className="p-8 text-center text-surface-400">Loading...</div>

  if (!person) return (
    <div className="p-8 text-center">
      <p className="text-surface-400 mb-4">Personnel "{decoded}" not found.</p>
      <button onClick={() => navigate('/personnel')} className="text-primary-600 hover:text-primary-800 font-medium">← Back to Personnel</button>
    </div>
  )

  const specs: string[] = (() => { try { return JSON.parse(person.specializations || '[]') } catch { return [] } })()

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/personnel')} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors">
          <span>←</span> Back to Personnel
        </button>
      </div>

      {/* Personnel Info Card */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-4 mb-1">
          <span className="text-2xl">👤</span>
          <div>
            <h1 className="text-xl font-bold text-surface-900">
              {person.honorific ? `${person.honorific} ` : ''}{person.first_name} {person.last_name}{person.credentials ? `, ${person.credentials}` : ''}
            </h1>
            <p className="text-surface-500 text-sm">{person.employee_id} · {person.email}</p>
          </div>
          <span className={`ml-auto inline-flex px-3 py-1 rounded-full text-xs font-semibold ${person.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{person.status}</span>
        </div>
        <div className="flex items-center gap-6 mt-3 text-sm text-surface-500 flex-wrap">
          <span><strong className="text-surface-700">Type:</strong> {person.personnel_type}</span>
          <span><strong className="text-surface-700">Department:</strong> {person.department}{person.is_shared ? ' (shared)' : ''}</span>
          <span><strong className="text-surface-700">Max Weekly Hours:</strong> {person.max_weekly_hours}h</span>
          {specs.length > 0 && (
            <span className="flex items-center gap-1.5 flex-wrap">
              <strong className="text-surface-700">Specializations:</strong>
              {specs.map(s => (
                <span key={s} className="inline-flex px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">{s}</span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* Schedule Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-surface-800">Schedule Assignments</h2>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); resetForm() }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            + Assign Schedule
          </button>
        )}
      </div>

      {/* Assignment Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h3 className="text-base font-semibold text-surface-800">New Schedule Assignment</h3>
          {!activeTerm?.academicYear && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
              No active academic term set. Configure one in Academic Years before assigning schedules.
            </div>
          )}
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

          {/* Row 1: Section, Room, Subject */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Section *</label>
              <select
                value={form.section_id}
                onChange={(e) => handleSectionChange(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">— Select Section —</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.section_code}{s.subject ? ` — ${s.subject}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Room</label>
              <select
                value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">— None —</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.room_code} ({r.capacity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Auto-filled from section"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Time */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Time *</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Time *</label>
              <input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
              <input
                type="text"
                value={form.override_reason}
                onChange={(e) => setForm({ ...form, override_reason: e.target.value })}
                placeholder="Required if conflicts exist"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Row 3: Day toggles */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Schedule Days *</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_IN_ORDER.map((day) => {
                const isSelected = form.selected_days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'bg-white text-surface-600 border-surface-300 hover:border-primary-400 hover:text-primary-600'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                )
              })}
            </div>
            {form.selected_days.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">Select at least one day</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !activeTerm?.academicYear || form.selected_days.length === 0}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Assign Schedule'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm() }}
              className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Schedule Entries Table */}
      {scheduleEntries.length === 0 ? (
        <div className="text-center py-12 text-surface-400">No schedules assigned yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Section(s)</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Room</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Time</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Days</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {scheduleEntries.map((entry) => {
                const room = roomMap.get(entry.room_id ?? '')
                return (
                  <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{ACTIVITY_TYPE_LABELS[entry.activity_type]}</td>
                    <td className="px-4 py-3 font-medium text-surface-900">{entry.subject ?? entry.exam_title ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-600">{getSectionCodes(entry)}</td>
                    <td className="px-4 py-3 text-surface-600">{room?.room_code ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{entry.start_time}–{entry.end_time}</td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{formatDays(entry)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${entry.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.status === 'DRAFT' && (
                        <button
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
