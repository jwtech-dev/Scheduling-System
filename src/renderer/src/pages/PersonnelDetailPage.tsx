import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type {
  IpcResponse, Personnel, ScheduleEntry, Room, Section, ActiveTerm, ConflictFlag, Semester
} from '@shared/types'
import type { PatternMode } from '@shared/types'
import {
  DAY_LABELS, DAYS_IN_ORDER, recurrenceToPatternMode, patternModeToRecurrence,
  ACTIVITY_TYPE_LABELS, CONFLICT_CODE_LABELS
} from '@shared/constants'

import { HARD_CONFLICT_CODES, parseConflictCounts } from '../utils/conflict-utils'

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
  const [conflictDetailEntry, setConflictDetailEntry] = useState<ScheduleEntry | null>(null)
  const [blockedPublishConflicts, setBlockedPublishConflicts] = useState<Array<{ id: string; conflicts: ConflictFlag[] }>>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedScheduleSemId, setSelectedScheduleSemId] = useState<string>('')
  const [form, setForm] = useState({
    section_code: '',
    section_id: '',
    room_id: '',
    subject: '',
    start_time: '',
    end_time: '',
    selected_days: [] as number[],
    override_reason: ''
  })

  // Build lookup maps
  const roomMap = new Map(rooms.map(r => [r.id, r]))
  const sectionMap = new Map(sections.map(s => [s.id, s]))

  // Filter sections to current active academic term + semester
  const termSections = activeTerm?.academicYear
    ? sections.filter(s => {
        if (s.academic_year_id !== activeTerm.academicYear!.id) return false
        if (!activeTerm.semester) return true
        // Match by semester_id (older records) or semester_type (global sections)
        if (s.semester_id) return s.semester_id === activeTerm.semester.id
        if (s.semester_type) {
          const mapped = s.semester_type === '1ST' ? '1ST_SEMESTER'
            : s.semester_type === '2ND' ? '2ND_SEMESTER'
            : s.semester_type
          return mapped === activeTerm.semester.semester_type
        }
        return true
      })
    : []

  // Unique section codes for dropdown
  const uniqueSectionCodes = [...new Set(termSections.map(s => s.section_code))].sort()

  // Subjects available for the currently selected section code
  const subjectsForSection = form.section_code
    ? termSections.filter(s => s.section_code === form.section_code && s.subject)
    : []

  const load = useCallback(async () => {
    setLoading(true)
    const [persRes, roomsRes, secRes, termRes] = await Promise.all([
      window.electronAPI.getPersonnelByEmployeeId(decoded) as Promise<IpcResponse<Personnel | null>>,
      window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
      window.electronAPI.listSections({ department }) as Promise<IpcResponse<Section[]>>,
      window.electronAPI.getActiveTerm(department) as Promise<IpcResponse<ActiveTerm>>
    ])

    if (roomsRes.data) setRooms(roomsRes.data)
    if (secRes.data) setSections(secRes.data)
    // getActiveTerm may return error when no active AY/semester exists — that's expected
    if (termRes.data) {
      setActiveTerm(termRes.data)
    } else {
      setActiveTerm(null)
    }

    const found = persRes.data ?? null
    setPerson(found)

    if (found) {
      const schedFilters: Record<string, string> = {}
      if (selectedScheduleSemId) schedFilters.semester_id = selectedScheduleSemId
      const schedRes = (await window.electronAPI.getPersonnelSchedule(found.id, schedFilters)) as IpcResponse<ScheduleEntry[]>
      if (schedRes.data) setScheduleEntries(schedRes.data)
    }

    setLoading(false)
  }, [department, decoded, selectedScheduleSemId])

  useEffect(() => { load() }, [load])

  // Load semesters for the schedule picker and default to active semester
  useEffect(() => {
    if (!activeTerm?.academicYear) return
    ;(async () => {
      const semRes = (await window.electronAPI.getAcademicYearSemesters(activeTerm.academicYear!.id)) as IpcResponse<Semester[]>
      if (semRes.data) setSemesters(semRes.data)
      if (activeTerm.semester?.id) {
        setSelectedScheduleSemId(prev => prev || activeTerm.semester!.id)
      }
    })()
  }, [activeTerm?.academicYear?.id, activeTerm?.semester?.id])

  // When section code changes, reset subject
  const handleSectionCodeChange = (code: string) => {
    setForm(f => ({ ...f, section_code: code, section_id: '', subject: '' }))
  }

  // When subject is selected, set section_id to the matching row
  const handleSubjectChange = (sectionId: string) => {
    const sec = sections.find(s => s.id === sectionId)
    setForm(f => ({ ...f, section_id: sectionId, subject: sec?.subject ?? '' }))
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
      section_code: '', section_id: '', room_id: '', subject: '',
      start_time: '', end_time: '',
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
          setError(result.error.message)
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

  const handlePublish = async (ids: string[]) => {
    const result = (await window.electronAPI.publishEntries(ids)) as IpcResponse<{ published: string[]; blocked: Array<{ id: string; conflicts: ConflictFlag[] }> }>
    if (result.data) {
      if (result.data.blocked.length > 0) {
        const blocked = result.data.blocked
        setBlockedPublishConflicts(blocked)
        toast.error(`${blocked.length} entries blocked by conflicts.`, {
          duration: 10000,
          action: { label: 'See Conflicts', onClick: () => setBlockedPublishConflicts(blocked) }
        })
      } else {
        toast.success(`${result.data.published.length} entries published.`)
      }
      load()
    }
  }

  const handleUnpublish = async (ids: string[]) => {
    const result = (await window.electronAPI.unpublishEntries(ids)) as IpcResponse
    if (result.error) {
      toast.error(result.error.message)
      return
    }
    toast.success('Entry unpublished')
    load()
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

  const draftEntries = scheduleEntries.filter(e => e.status === 'DRAFT')

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
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-surface-800">Schedule Assignments</h2>
          {semesters.length > 0 && (
            <select
              value={selectedScheduleSemId}
              onChange={(e) => setSelectedScheduleSemId(e.target.value)}
              className="px-2 py-1.5 border border-surface-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">All Semesters</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.semester_type === '1ST_SEMESTER' ? '1st Semester' : s.semester_type === '2ND_SEMESTER' ? '2nd Semester' : s.semester_type === 'SUMMER' ? 'Summer' : s.semester_type}
                  {activeTerm?.semester?.id === s.id ? ' (active)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="flex gap-3">
          {draftEntries.length > 0 && (
            <button
              onClick={() => handlePublish(draftEntries.map(e => e.id))}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Publish All Drafts ({draftEntries.length})
            </button>
          )}
          {!showForm && (
            <button
              onClick={() => { setShowForm(true); resetForm() }}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
            >
              + Assign Schedule
            </button>
          )}
        </div>
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
                value={form.section_code}
                onChange={(e) => handleSectionCodeChange(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">— Select Section —</option>
                {uniqueSectionCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
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
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject *</label>
              <select
                value={form.section_id}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
                disabled={!form.section_code}
              >
                <option value="">{form.section_code ? '— Select Subject —' : '— Select section first —'}</option>
                {subjectsForSection.map(s => (
                  <option key={s.id} value={s.id}>{s.subject}</option>
                ))}
              </select>
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
                      {(() => {
                        const { hard, soft } = parseConflictCounts(entry.conflict_flags)
                        return (
                          <>
                            {hard > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{hard}</span>}
                            {soft > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">⚠ {soft}</span>}
                            {(hard > 0 || soft > 0) && (
                              <button
                                type="button"
                                onClick={() => setConflictDetailEntry(entry)}
                                className="ml-1.5 text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
                              >
                                See Conflict
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      {entry.status === 'DRAFT' && (
                        <>
                          <button
                            onClick={() => handlePublish([entry.id])}
                            className="text-green-600 hover:text-green-800 text-xs font-medium"
                          >
                            Publish
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {entry.status === 'PUBLISHED' && (
                        <button
                          onClick={() => handleUnpublish([entry.id])}
                          className="text-amber-600 hover:text-amber-800 text-xs font-medium"
                        >
                          Unpublish
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

      {/* Conflict Detail Modal */}
      {conflictDetailEntry && (() => {
        let flags: string[] = []
        try { flags = JSON.parse(conflictDetailEntry.conflict_flags || '[]') } catch { /* ignore */ }
        const hardFlags = flags.filter(f => HARD_CONFLICT_CODES.has(f))
        const softFlags = flags.filter(f => !HARD_CONFLICT_CODES.has(f))
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-4 text-white">
                <h3 className="text-lg font-bold">Conflict Details</h3>
                <p className="text-red-100 text-sm mt-0.5">{conflictDetailEntry.subject ?? conflictDetailEntry.exam_title ?? 'Schedule Entry'} · {conflictDetailEntry.start_time}–{conflictDetailEntry.end_time}</p>
              </div>
              <div className="px-6 py-5 space-y-4 max-h-80 overflow-y-auto">
                {hardFlags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      {hardFlags.length} Hard Conflict{hardFlags.length > 1 ? 's' : ''} — Blocks publishing
                    </h4>
                    <ul className="space-y-1.5">
                      {hardFlags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <span className="text-red-400 mt-0.5">•</span>
                          <span>{CONFLICT_CODE_LABELS[f] ?? f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {softFlags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {softFlags.length} Warning{softFlags.length > 1 ? 's' : ''}
                    </h4>
                    <ul className="space-y-1.5">
                      {softFlags.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-amber-400 mt-0.5">•</span>
                          <span>{CONFLICT_CODE_LABELS[f] ?? f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {flags.length === 0 && (
                  <p className="text-sm text-surface-500">No conflicts found for this entry.</p>
                )}
              </div>
              <div className="px-6 pb-5">
                <button
                  type="button"
                  onClick={() => setConflictDetailEntry(null)}
                  className="w-full px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Blocked Publish Conflicts Modal */}
      {blockedPublishConflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-gradient-to-br from-red-500 to-rose-600 px-6 py-4 text-white">
              <h3 className="text-lg font-bold">Publish Blocked</h3>
              <p className="text-red-100 text-sm mt-0.5">{blockedPublishConflicts.length} {blockedPublishConflicts.length === 1 ? 'entry has' : 'entries have'} conflicts that prevent publishing</p>
            </div>
            <div className="px-6 py-5 space-y-4 max-h-96 overflow-y-auto">
              {blockedPublishConflicts.map((blocked, idx) => {
                const entry = scheduleEntries.find(e => e.id === blocked.id)
                return (
                  <div key={blocked.id} className="border border-surface-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">#{idx + 1}</span>
                      <span className="text-sm font-semibold text-surface-800">
                        {entry?.subject ?? entry?.exam_title ?? 'Unknown Entry'}
                      </span>
                      {entry && <span className="text-xs text-surface-500 ml-auto">{entry.start_time}–{entry.end_time}</span>}
                    </div>
                    <ul className="space-y-1">
                      {blocked.conflicts.map((c, i) => (
                        <li key={i} className={`flex items-start gap-2 text-sm rounded-lg px-3 py-1.5 ${c.severity === 'HARD' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          <span className={`mt-0.5 ${c.severity === 'HARD' ? 'text-red-400' : 'text-amber-400'}`}>•</span>
                          <span>{c.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
            <div className="px-6 pb-5">
              <button
                type="button"
                onClick={() => setBlockedPublishConflicts([])}
                className="w-full px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
