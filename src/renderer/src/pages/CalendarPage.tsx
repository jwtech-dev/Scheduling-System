import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, CalendarEvent, AcademicYear, Semester } from '@shared/types'
import { CALENDAR_EVENT_TYPES, SHS_EXAM_TYPES, COLLEGE_EXAM_TYPES } from '@shared/constants'
import CalendarView from '../components/CalendarView'

/** Event types that always block regular schedules (auto-blocking) */
const AUTO_BLOCKING_TYPES = ['HOLIDAY', 'EXAM_PERIOD', 'BREAK']

/** Event types that require an override reason in the description */
const REASON_REQUIRED_TYPES = ['BREAK', 'INSTITUTIONAL_EVENT', 'CUSTOM']

const TYPE_LABELS: Record<string, string> = {
  HOLIDAY: 'Holiday',
  EXAM_PERIOD: 'Exam Period',
  BREAK: 'Break',
  INSTITUTIONAL_EVENT: 'Institutional Event',
  CUSTOM: 'Custom'
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  Q1_EXAM: 'Q1 Exam',
  Q2_EXAM: 'Q2 Exam',
  Q3_EXAM: 'Q3 Exam',
  Q4_EXAM: 'Q4 Exam',
  PRELIM: 'Prelim',
  MIDTERM: 'Midterm',
  PRE_FINALS: 'Pre-Finals',
  FINALS: 'Finals'
}

export default function CalendarPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()

  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  // Academic year / semester state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [filterAyId, setFilterAyId] = useState<string>('')
  const [filterSemId, setFilterSemId] = useState<string>('')

  // Form state
  const [form, setForm] = useState({
    title: '',
    event_type: '' as string,
    exam_type: '' as string,
    is_blocking: false,
    is_all_day: false,
    start_datetime: '',
    end_datetime: '',
    description: '',
    academic_year_id: '',
    semester_id: ''
  })
  const [customTypeName, setCustomTypeName] = useState('')

  const isAutoBlocking = AUTO_BLOCKING_TYPES.includes(form.event_type)
  const requiresReason = REASON_REQUIRED_TYPES.includes(form.event_type)
  const isExamPeriod = form.event_type === 'EXAM_PERIOD'
  const examTypes = department === 'SHS' ? SHS_EXAM_TYPES : COLLEGE_EXAM_TYPES

  // Load academic years for current department
  const loadAcademicYears = useCallback(async () => {
    const result = (await window.electronAPI.listAcademicYears(department)) as IpcResponse<AcademicYear[]>
    if (result.data) {
      setAcademicYears(result.data)
      // Auto-select active academic year
      const active = result.data.find((ay) => ay.is_active)
      if (active && !filterAyId) {
        setFilterAyId(active.id)
      }
    }
  }, [department, filterAyId])

  // Load semesters for selected academic year
  const loadSemesters = useCallback(async () => {
    if (!filterAyId) { setSemesters([]); return }
    const result = (await window.electronAPI.getAcademicYearSemesters(filterAyId)) as IpcResponse<Semester[]>
    if (result.data) {
      setSemesters(result.data)
      // Auto-select active semester
      const active = result.data.find((s) => s.is_active)
      if (active && !filterSemId) {
        setFilterSemId(active.id)
      }
    }
  }, [filterAyId, filterSemId])

  // Load calendar events with filters
  const loadEvents = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, string> = { department }
    if (filterAyId) filters.academic_year_id = filterAyId
    if (filterSemId) filters.semester_id = filterSemId
    const result = (await window.electronAPI.listCalendarEvents(filters)) as IpcResponse<CalendarEvent[]>
    if (result.data) setEvents(result.data)
    setLoading(false)
  }, [department, filterAyId, filterSemId])

  useEffect(() => { loadAcademicYears() }, [loadAcademicYears])
  useEffect(() => { loadSemesters() }, [loadSemesters])
  useEffect(() => { loadEvents() }, [loadEvents])

  // When academic year changes, reset semester filter
  const handleAyChange = (ayId: string) => {
    setFilterAyId(ayId)
    setFilterSemId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)

    // Validate dates
    if (!form.is_all_day) {
      if (!form.start_datetime || !form.end_datetime) {
        setError('Start and end date/time are required.'); return
      }
      if (form.start_datetime >= form.end_datetime) {
        setError('End date/time must be after start date/time.'); return
      }
    }

    const effectiveType = form.event_type === 'CUSTOM' ? (customTypeName.trim() || 'CUSTOM') : form.event_type
    const payload = {
      ...form,
      event_type: effectiveType,
      exam_type: effectiveType === 'EXAM_PERIOD' ? (form.exam_type || null) : null,
      is_blocking: isAutoBlocking ? true : form.is_blocking,
      is_all_day: form.is_all_day,
      department,
      academic_year_id: form.academic_year_id || null,
      semester_id: form.semester_id || null
    }
    const result = editingId
      ? (await window.electronAPI.updateCalendarEvent({ id: editingId, ...payload })) as IpcResponse
      : (await window.electronAPI.createCalendarEvent(payload)) as IpcResponse
    if (result.error) { setError(result.error.message); return }
    toast.success(editingId ? 'Event updated' : 'Event created')
    setShowForm(false); setEditingId(null); resetForm(); setCustomTypeName(''); loadEvents()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Calendar Event',
      message: 'Are you sure you want to delete this event?',
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteCalendarEvent(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Event deleted'); loadEvents() }
  }

  const startEdit = (ev: CalendarEvent) => {
    const isKnownType = (CALENDAR_EVENT_TYPES as readonly string[]).includes(ev.event_type)
    setEditingId(ev.id)
    setForm({
      title: ev.title,
      event_type: isKnownType ? ev.event_type : 'CUSTOM',
      exam_type: ev.exam_type ?? '',
      is_blocking: !!ev.is_blocking,
      is_all_day: !!ev.is_all_day,
      start_datetime: ev.start_datetime.slice(0, 16),
      end_datetime: ev.end_datetime.slice(0, 16),
      description: ev.description ?? '',
      academic_year_id: ev.academic_year_id ?? '',
      semester_id: ev.semester_id ?? ''
    })
    setCustomTypeName(isKnownType ? '' : ev.event_type)
    setShowForm(true); setError(null)
  }

  const resetForm = () => {
    // Only pre-select AY and semester from filters; all other fields start empty
    const activeAy = academicYears.find((ay) => ay.is_active)
    const activeSem = semesters.find((s) => s.is_active)
    setForm({
      title: '', event_type: '', exam_type: '', is_blocking: false, is_all_day: false,
      start_datetime: '', end_datetime: '', description: '',
      academic_year_id: activeAy?.id ?? filterAyId ?? '',
      semester_id: activeSem?.id ?? filterSemId ?? ''
    })
    setCustomTypeName('')
  }

  // Semesters available for the form (based on selected AY in form)
  const formAyId = form.academic_year_id || filterAyId
  const formSemesters = semesters.filter((s) => s.academic_year_id === formAyId)
  // Only active semesters are selectable for new events
  const selectableSemesters = editingId ? formSemesters : formSemesters.filter((s) => s.is_active)

  // Handle event type change — auto-set blocking for auto-blocking types
  const handleEventTypeChange = (newType: string) => {
    const blocking = AUTO_BLOCKING_TYPES.includes(newType) ? true : form.is_blocking
    const examType = newType === 'EXAM_PERIOD' ? form.exam_type : ''
    setForm({ ...form, event_type: newType, exam_type: examType, is_blocking: blocking })
    if (newType !== 'CUSTOM') setCustomTypeName('')
  }

  const handleExportPdf = async () => {
    if (!filterAyId) return
    setExporting(true)
    try {
      const result = (await window.electronAPI.exportCalendarPdf({
        department,
        academic_year_id: filterAyId,
        semester_id: filterSemId || undefined
      })) as IpcResponse<{ success: boolean; path?: string }>
      if (result.error) {
        toast.error(result.error.message)
      } else if (result.data?.success) {
        toast.success('Calendar PDF exported successfully')
      }
    } catch {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const typeColors: Record<string, string> = {
    HOLIDAY: 'bg-red-100 text-red-700',
    EXAM_PERIOD: 'bg-purple-100 text-purple-700',
    BREAK: 'bg-blue-100 text-blue-700',
    INSTITUTIONAL_EVENT: 'bg-green-100 text-green-700',
    CUSTOM: 'bg-surface-100 text-surface-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Calendar Events</h1>
        <div className="flex items-center gap-3">
          {/* Filter dropdowns */}
          <select
            value={filterAyId}
            onChange={(e) => handleAyChange(e.target.value)}
            className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Academic Years</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.label} {ay.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <select
            value={filterSemId}
            onChange={(e) => setFilterSemId(e.target.value)}
            className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">All Semesters</option>
            {semesters.map((s) => (
              <option key={s.id} value={s.id}>
                {s.semester_type.replace(/_/g, ' ')} {s.is_active ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportPdf}
            disabled={!filterAyId || exporting}
            title={!filterAyId ? 'Select an academic year to export' : 'Export calendar as PDF'}
            className="px-4 py-2 border border-surface-300 text-surface-700 rounded-lg hover:bg-surface-50 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            {exporting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" /><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
                Exporting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                Export PDF
              </>
            )}
          </button>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
          >
            + New Event
          </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]" onClick={() => { setShowForm(false); setError(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[48rem] max-h-[85vh] overflow-y-auto animate-[modal-dialog-in_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900">{editingId ? 'Edit' : 'New'} Calendar Event</h2>
                  <p className="text-xs text-surface-500">{editingId ? 'Update event details below.' : 'Fill in the details to add a new calendar event.'}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

              {/* Row 1: Title, Type, Blocking/AllDay */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Title</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Type</label>
                  <select value={form.event_type} onChange={(e) => handleEventTypeChange(e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                    <option value="" disabled>Select type</option>
                    {CALENDAR_EVENT_TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t.replace(/_/g, ' ')}</option>)}
                  </select>
                  {form.event_type === 'CUSTOM' && (
                    <input type="text" value={customTypeName} onChange={(e) => setCustomTypeName(e.target.value)} placeholder="Enter custom event type" className="w-full mt-2 px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" required />
                  )}
                  {isExamPeriod && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type <span className="text-red-500">*</span></label>
                      <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                        <option value="" disabled>Select exam type</option>
                        {examTypes.map(t => <option key={t} value={t}>{EXAM_TYPE_LABELS[t] ?? t.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-4 pb-2">
                  <label className="flex items-center gap-1 text-sm" title={isAutoBlocking ? 'This event type always overrides regular schedules' : ''}>
                    <input
                      type="checkbox"
                      checked={isAutoBlocking ? true : form.is_blocking}
                      onChange={(e) => setForm({ ...form, is_blocking: e.target.checked })}
                      disabled={isAutoBlocking}
                      className="rounded border-surface-300"
                    />
                    Blocking
                    {isAutoBlocking && <span className="text-xs text-amber-600 ml-1">(auto)</span>}
                  </label>
                  <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm({ ...form, is_all_day: e.target.checked })} className="rounded border-surface-300" /> All Day</label>
                </div>
              </div>

              {/* Row 2: Academic Year, Semester */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Academic Year</label>
                  <select
                    value={form.academic_year_id}
                    onChange={(e) => setForm({ ...form, academic_year_id: e.target.value, semester_id: '' })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">— None —</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.label} {ay.is_active ? '(Active)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Semester</label>
                  <select
                    value={form.semester_id}
                    onChange={(e) => setForm({ ...form, semester_id: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">— None —</option>
                    {selectableSemesters.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.semester_type.replace(/_/g, ' ')} {s.is_active ? '(Active)' : '(Inactive)'}
                      </option>
                    ))}
                  </select>
                  {!editingId && formSemesters.length > 0 && selectableSemesters.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">No active semesters available. Activate a semester first.</p>
                  )}
                </div>
              </div>

              {/* Row 3: Start, End */}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Start</label><input type={form.is_all_day ? 'date' : 'datetime-local'} value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">End</label><input type={form.is_all_day ? 'date' : 'datetime-local'} value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              </div>

              {/* Auto-blocking info banner */}
              {isAutoBlocking && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  <span>{TYPE_LABELS[form.event_type] ?? form.event_type} events automatically override all regular schedules on the assigned dates.</span>
                </div>
              )}

              {/* Description / Override Reason */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  {requiresReason ? (
                    <span>Override Reason <span className="text-red-500">*</span> <span className="text-xs text-surface-400 font-normal">(required for this event type)</span></span>
                  ) : (
                    'Description'
                  )}
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none ${requiresReason && !form.description.trim() ? 'border-red-300 bg-red-50' : 'border-surface-300'}`}
                  required={requiresReason}
                  placeholder={requiresReason ? 'Provide a reason for this schedule override...' : 'Optional description'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calendar View — on top */}
      {!loading && (
        <CalendarView events={events} semesters={semesters} activeSemesterId={filterSemId} academicYear={academicYears.find(ay => ay.id === filterAyId) ?? null} />
      )}

      {/* Events Table — below */}
      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : events.length === 0 ? <div className="text-center py-12 text-surface-400">No calendar events yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Exam Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Start</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">End</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Blocking</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Semester</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {events.map((ev) => {
                const sem = semesters.find((s) => s.id === ev.semester_id)
                return (
                  <tr key={ev.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-surface-900">{ev.title}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[ev.event_type] ?? ''}`}>{TYPE_LABELS[ev.event_type] ?? ev.event_type.replace(/_/g, ' ')}</span></td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{ev.exam_type ? (EXAM_TYPE_LABELS[ev.exam_type] ?? ev.exam_type.replace(/_/g, ' ')) : '—'}</td>
                    <td className="px-4 py-3 text-surface-600 text-xs">{new Date(ev.start_datetime).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-surface-600 text-xs">{new Date(ev.end_datetime).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{ev.is_blocking ? <span className="text-red-500 text-xs font-semibold">Yes</span> : <span className="text-surface-400 text-xs">No</span>}</td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{sem ? sem.semester_type.replace(/_/g, ' ') : '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => startEdit(ev)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                      <button onClick={() => handleDelete(ev.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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
