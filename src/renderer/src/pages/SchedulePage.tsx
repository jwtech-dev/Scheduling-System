import { useState, useEffect, useCallback } from 'react'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, ScheduleEntry, ConflictFlag, Room, Personnel, Section, ActiveTerm } from '@shared/types'
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, SHS_EXAM_TYPES, COLLEGE_EXAM_TYPES, CONFLICT_CODES, PATTERN_MODE_LABELS, DAY_LABELS, DAYS_IN_ORDER, patternModeToRecurrence, recurrenceToPatternMode } from '@shared/constants'
import { useSignatoriesModal } from '../components/SignatoriesModal'

// Build a set of HARD conflict code strings for fast lookup
const HARD_CONFLICT_CODES = new Set(
  Object.values(CONFLICT_CODES)
    .filter((c) => c.severity === 'HARD')
    .map((c) => c.code)
)
import type { ActivityType, Modality, PatternMode } from '@shared/types'

/** Get the full day name for a date string (YYYY-MM-DD) */
function getDayName(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/** Ordinal suffix for a number (1st, 2nd, 3rd, etc.) */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** Format a recurrence pattern into a human-readable label for the table */
function formatPatternDisplay(entry: ScheduleEntry): string {
  const mapped = recurrenceToPatternMode(
    entry.recurrence_pattern,
    entry.custom_days,
    entry.day_of_week,
    entry.day_of_month
  )
  switch (mapped.mode) {
    case 'ONCE':
      return 'Once'
    case 'MONTHLY':
      return mapped.dayOfMonth ? `Monthly (${ordinal(mapped.dayOfMonth)})` : 'Monthly'
    case 'WEEKLY': {
      if (mapped.selectedDays.length === 0) return 'Weekly'
      // Sort days in Mon-Sun order for display
      const ordered = DAYS_IN_ORDER.filter(d => mapped.selectedDays.includes(d))
      return ordered.map(d => DAY_LABELS[d]).join(', ')
    }
    default:
      return entry.recurrence_pattern
  }
}

export default function SchedulePage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const { openSignatoriesModal } = useSignatoriesModal()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [form, setForm] = useState({
    activity_type: 'CLASS' as ActivityType,
    room_id: '', personnel_id: '', section_ids: [] as string[],
    subject: '', exam_title: '', exam_type: '' as string,
    modality: 'F2F' as Modality,
    start_time: '08:00', end_time: '09:00',
    pattern_mode: 'WEEKLY' as PatternMode,
    selected_days: [1, 3, 5] as number[],
    day_of_month: null as number | null,
    recurrence_start_date: '', recurrence_end_date: '',
    notes: '', override_reason: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [termRes, entriesRes, roomsRes, persRes, secRes] = await Promise.all([
      window.electronAPI.getActiveTerm(department) as Promise<IpcResponse<ActiveTerm>>,
      window.electronAPI.listScheduleEntries({ department, status: statusFilter || undefined }) as Promise<IpcResponse<ScheduleEntry[]>>,
      window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
      window.electronAPI.listPersonnel({ department, is_shared: true }) as Promise<IpcResponse<Personnel[]>>,
      window.electronAPI.listSections({ department }) as Promise<IpcResponse<Section[]>>
    ])
    if (termRes.data) setActiveTerm(termRes.data)
    if (entriesRes.data) setEntries(entriesRes.data)
    if (roomsRes.data) setRooms(roomsRes.data)
    if (persRes.data) setPersonnel(persRes.data)
    if (secRes.data) setSections(secRes.data)

    // Set default dates from active term
    if (termRes.data?.semester) {
      setForm(f => ({
        ...f,
        recurrence_start_date: f.recurrence_start_date || termRes.data!.semester!.start_date,
        recurrence_end_date: f.recurrence_end_date || termRes.data!.semester!.end_date
      }))
    }
    setLoading(false)
  }, [department, statusFilter])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setConflicts([])
    if (!activeTerm?.academicYear) { setError('No active term set.'); return }

    setIsSubmitting(true)
    try {
      // Convert simplified UI pattern to backend recurrence fields
      const recurrence = patternModeToRecurrence(form.pattern_mode, form.selected_days, form.day_of_month)

      const payload = {
        activity_type: form.activity_type,
        modality: form.modality,
        room_id: form.room_id || null,
        personnel_id: form.personnel_id || null,
        section_ids: form.section_ids,
        subject: form.subject || null,
        exam_title: form.exam_title || null,
        exam_type: form.exam_type || null,
        start_time: form.start_time,
        end_time: form.end_time,
        recurrence_pattern: recurrence.recurrence_pattern,
        custom_days: recurrence.custom_days,
        day_of_month: recurrence.day_of_month,
        day_of_week: null as number | null,
        recurrence_start_date: form.recurrence_start_date,
        recurrence_end_date: form.pattern_mode === 'ONCE' ? null : (form.recurrence_end_date || null),
        notes: form.notes || null,
        override_reason: form.override_reason || null,
        department,
        academic_year_id: activeTerm.academicYear.id,
        semester_id: activeTerm.semester?.id ?? null
      }

      const result = editingId
        ? (await window.electronAPI.updateDraftEntry({ id: editingId, ...payload })) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>
        : (await window.electronAPI.createDraftEntry(payload)) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>

      if (result.error) {
        if (result.error.code === 'HARD_CONFLICT') {
          setError(result.error.message)
        } else {
          setError(result.error.message)
        }
        return
      }
      if (result.data?.conflicts) setConflicts(result.data.conflicts)
      toast.success(editingId ? 'Entry updated' : 'Draft entry created')
      setShowForm(false); setEditingId(null); load()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async (ids: string[]) => {
    const result = (await window.electronAPI.publishEntries(ids)) as IpcResponse<{ published: string[]; blocked: Array<{ id: string; conflicts: ConflictFlag[] }> }>
    if (result.data) {
      if (result.data.blocked.length > 0) {
        toast.error(`${result.data.blocked.length} entries blocked by conflicts.`)
      } else {
        toast.success(`${result.data.published.length} entries published.`)
      }
      load()
    }
  }

  const handleUnpublish = async (ids: string[]) => {
    await window.electronAPI.unpublishEntries(ids)
    toast.success('Entry unpublished')
    load()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Schedule Entry',
      message: 'Are you sure you want to delete this draft entry?',
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteDraftEntry(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Entry deleted'); load() }
  }

  const startEdit = (entry: ScheduleEntry) => {
    // Reverse-map backend recurrence to simplified UI pattern
    const mapped = recurrenceToPatternMode(
      entry.recurrence_pattern,
      entry.custom_days,
      entry.day_of_week,
      entry.day_of_month
    )

    setEditingId(entry.id)
    setForm({
      activity_type: entry.activity_type,
      room_id: entry.room_id ?? '', personnel_id: entry.personnel_id ?? '',
      section_ids: JSON.parse(entry.section_ids || '[]'),
      subject: entry.subject ?? '', exam_title: entry.exam_title ?? '',
      exam_type: entry.exam_type ?? '',
      modality: entry.modality,
      start_time: entry.start_time, end_time: entry.end_time,
      pattern_mode: mapped.mode,
      selected_days: mapped.selectedDays,
      day_of_month: mapped.dayOfMonth,
      recurrence_start_date: entry.recurrence_start_date,
      recurrence_end_date: entry.recurrence_end_date ?? '',
      notes: entry.notes ?? '', override_reason: ''
    })
    setShowForm(true); setError(null); setConflicts([])
  }

  const resetForm = () => setForm({
    activity_type: 'CLASS', room_id: '', personnel_id: '', section_ids: [],
    subject: '', exam_title: '', exam_type: '', modality: 'F2F',
    start_time: '08:00', end_time: '09:00',
    pattern_mode: 'WEEKLY', selected_days: [1, 3, 5], day_of_month: null,
    recurrence_start_date: activeTerm?.semester?.start_date ?? '',
    recurrence_end_date: activeTerm?.semester?.end_date ?? '',
    notes: '', override_reason: ''
  })

  const toggleDay = (day: number) => {
    setForm(prev => {
      const days = prev.selected_days.includes(day)
        ? prev.selected_days.filter(d => d !== day)
        : [...prev.selected_days, day]
      return { ...prev, selected_days: days }
    })
  }

  const getRoomName = (id: string | null) => rooms.find(r => r.id === id)?.room_code ?? '—'
  const getPersonnelName = (id: string | null) => { const p = personnel.find(x => x.id === id); return p ? `${p.last_name}, ${p.first_name}` : '—' }

  const draftEntries = entries.filter(e => e.status === 'DRAFT')

  const handleExportSchedule = async (): Promise<void> => {
    const signatories = await openSignatoriesModal()
    if (signatories === null) return // User cancelled
    const result = (await window.electronAPI.exportSchedule({
      department,
      semester_id: activeTerm?.semester?.id,
      status: statusFilter || undefined,
      signatories
    })) as IpcResponse<{ success: boolean; path?: string }>
    if (result.data?.success) toast.success(`Exported to: ${result.data.path}`)
    else if (result.error) toast.error(result.error.message)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Schedule Builder</h1>
          {activeTerm?.academicYear && <p className="text-sm text-surface-500">{activeTerm.academicYear.label}{activeTerm.semester ? ` · ${activeTerm.semester.semester_type.replace('_', ' ')}` : ''}</p>}
        </div>
        <div className="flex gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">All Status</option><option value="DRAFT">Drafts</option><option value="PUBLISHED">Published</option>
          </select>
          {draftEntries.length > 0 && (
            <button onClick={() => handlePublish(draftEntries.map(e => e.id))} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              Publish All Drafts ({draftEntries.length})
            </button>
          )}
          <button onClick={handleExportSchedule} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Export CSV</button>
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null); setConflicts([]) }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            + New Entry
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Schedule Entry</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          {conflicts.length > 0 && (
            <div className="space-y-1">
              {conflicts.map((c, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${c.severity === 'HARD' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <span className="font-semibold">{c.severity}:</span> {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Exam period requirement info */}
          {form.activity_type === 'EXAM' && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <span>Exam entries require an <strong>Exam Period</strong> to be set on the <strong>Calendar</strong> for the selected dates. If no exam period exists, this entry will be blocked.</span>
            </div>
          )}

          {/* Row 1: Activity Type, Modality */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Activity Type</label>
              <select value={form.activity_type} onChange={(e) => { const at = e.target.value as ActivityType; setForm({ ...form, activity_type: at, ...(at === 'EXAM' ? { pattern_mode: 'ONCE' as PatternMode, selected_days: [], day_of_month: null } : {}) }) }} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Modality</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as Modality })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="F2F">Face-to-Face</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Room</label>
              <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">— None —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code} ({r.capacity})</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Personnel</label>
              <select value={form.personnel_id} onChange={(e) => setForm({ ...form, personnel_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">— None —</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Subject OR Exam fields + Sections */}
          <div className="grid grid-cols-4 gap-4">
            {form.activity_type === 'EXAM' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Exam Title *</label>
                  <input type="text" value={form.exam_title} onChange={(e) => setForm({ ...form, exam_title: e.target.value })} placeholder="e.g. Midterm Exam" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type *</label>
                  <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                    <option value="">— Select —</option>
                    {(department === 'SHS' ? SHS_EXAM_TYPES : COLLEGE_EXAM_TYPES).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            )}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Sections</label>
              <MultiSelectDropdown
                options={sections.map(s => ({ value: s.id, label: s.section_code }))}
                selected={form.section_ids}
                onChange={(ids) => setForm({ ...form, section_ids: ids })}
                placeholder="— Select Sections —"
              />
            </div>
          </div>

          {/* Row 3: Time, Pattern, Dates */}
          <div className="grid grid-cols-6 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Start Time</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">End Time</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Pattern</label>
              <select
                value={form.pattern_mode}
                onChange={(e) => {
                  const mode = e.target.value as PatternMode
                  setForm({
                    ...form,
                    pattern_mode: mode,
                    selected_days: mode === 'WEEKLY' ? [1, 3, 5] : [],
                    day_of_month: mode === 'MONTHLY' ? 1 : null
                  })
                }}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {(Object.entries(PATTERN_MODE_LABELS) as [PatternMode, string][]).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">From Date</label><input type="date" value={form.recurrence_start_date} onChange={(e) => setForm({ ...form, recurrence_start_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            {form.pattern_mode !== 'ONCE' && (
              <div><label className="block text-sm font-medium text-surface-700 mb-1">To Date</label><input type="date" value={form.recurrence_end_date} onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            )}
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Override</label><input type="text" value={form.override_reason} onChange={(e) => setForm({ ...form, override_reason: e.target.value })} placeholder="Reason" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          </div>

          {/* Pattern sub-controls */}
          {form.pattern_mode === 'WEEKLY' && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-2">Schedule Days</label>
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
          )}

          {form.pattern_mode === 'ONCE' && form.recurrence_start_date && (
            <div className="flex items-center gap-2 text-sm text-surface-600">
              <span className="font-medium">Falls on:</span>
              <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">
                {getDayName(form.recurrence_start_date)}
              </span>
            </div>
          )}

          {form.pattern_mode === 'MONTHLY' && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Day of Month</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.day_of_month ?? 1}
                  onChange={(e) => setForm({ ...form, day_of_month: parseInt(e.target.value, 10) || 1 })}
                  className="w-20 px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
                <span className="text-sm text-surface-500">
                  Every {ordinal(form.day_of_month ?? 1)} of the month
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting || (form.pattern_mode === 'WEEKLY' && form.selected_days.length === 0)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create Draft'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : entries.length === 0 ? <div className="text-center py-12 text-surface-400">No schedule entries yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Room</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Personnel</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Pattern</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {entries.map((e) => {
                let hardCount = 0
                let softCount = 0
                try {
                  const flags: string[] = JSON.parse(e.conflict_flags || '[]')
                  hardCount = flags.filter(f => HARD_CONFLICT_CODES.has(f)).length
                  softCount = flags.length - hardCount
                } catch { /* ignore */ }
                return (
                  <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{ACTIVITY_TYPE_LABELS[e.activity_type]}</td>
                    <td className="px-4 py-3 font-medium text-surface-900">{e.subject ?? e.exam_title ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-600">{getRoomName(e.room_id)}</td>
                    <td className="px-4 py-3 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                    <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{formatPatternDisplay(e)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                      {hardCount > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{hardCount}</span>}
                      {softCount > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">⚠ {softCount}</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      {e.status === 'DRAFT' && <>
                        <button onClick={() => startEdit(e)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                        <button onClick={() => handlePublish([e.id])} className="text-green-600 hover:text-green-800 text-xs font-medium">Publish</button>
                        <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                      </>}
                      {e.status === 'PUBLISHED' && <button onClick={() => handleUnpublish([e.id])} className="text-amber-600 hover:text-amber-800 text-xs font-medium">Unpublish</button>}
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
