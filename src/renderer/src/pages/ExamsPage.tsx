import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, ScheduleEntry, ConflictFlag, Room, Personnel, Section, ActiveTerm, SubjectBankEntry, CalendarEvent } from '@shared/types'
import { SHS_EXAM_TYPES, COLLEGE_EXAM_TYPES, CONFLICT_CODES, CONFLICT_CODE_LABELS } from '@shared/constants'
import { useSignatoriesModal } from '../components/SignatoriesModal'
import type { Modality, ExamType } from '@shared/types'

// Build a set of HARD conflict code strings for fast lookup
const HARD_CONFLICT_CODES = new Set(
  Object.values(CONFLICT_CODES)
    .filter((c) => c.severity === 'HARD')
    .map((c) => c.code)
)

function parseConflictCounts(raw: string | null): { hard: number; soft: number } {
  if (!raw) return { hard: 0, soft: 0 }
  try {
    const flags: string[] = JSON.parse(raw)
    const hard = flags.filter((f) => HARD_CONFLICT_CODES.has(f)).length
    return { hard, soft: flags.length - hard }
  } catch {
    return { hard: 0, soft: 0 }
  }
}

// === Per-subject row for batch creation ===
interface SubjectExamRow {
  subjectBankId: string
  subject_name: string
  subject_code: string
  lec_units: number
  lab_units: number
  room_id: string
  personnel_id: string
  modality: Modality
  start_time: string
  end_time: string
  exam_date: string
  enabled: boolean
}

export default function ExamsPage(): JSX.Element {
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
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictDetailEntry, setConflictDetailEntry] = useState<ScheduleEntry | null>(null)
  const [blockedPublishConflicts, setBlockedPublishConflicts] = useState<Array<{ id: string; conflicts: ConflictFlag[] }>>([])

  // Subject Bank
  const [subjectBankItems, setSubjectBankItems] = useState<SubjectBankEntry[]>([])

  // === Batch creation state ===
  const [examType, setExamType] = useState<string>('')
  const [selectedSectionId, setSelectedSectionId] = useState<string>('')
  const [subjectRows, setSubjectRows] = useState<SubjectExamRow[]>([])
  const [batchNotes, setBatchNotes] = useState('')
  const [batchOverrideReason, setBatchOverrideReason] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [rangeInput, setRangeInput] = useState('')
  const [examPeriods, setExamPeriods] = useState<CalendarEvent[]>([])

  // "Set All" convenience values
  const [setAllRoom, setSetAllRoom] = useState('')
  const [setAllDate, setSetAllDate] = useState('')
  const [setAllStartTime, setSetAllStartTime] = useState('')
  const [setAllDuration, setSetAllDuration] = useState('') // minutes per subject
  const [setAllProctor, setSetAllProctor] = useState('')
  const [setAllModality, setSetAllModality] = useState<string>('')

  const DURATION_OPTIONS = [
    { value: '30', label: '30 minutes' },
    { value: '60', label: '1 hour' },
    { value: '90', label: '1 hour 30 min' },
    { value: '120', label: '2 hours' },
    { value: '150', label: '2 hours 30 min' },
    { value: '180', label: '3 hours' }
  ]

  // === Single-entry edit state ===
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    exam_type: '' as string,
    room_id: '',
    personnel_id: '',
    subject: '',
    subject_code: '',
    lec_units: 0,
    lab_units: 0,
    modality: 'F2F' as Modality,
    start_time: '08:00',
    end_time: '10:00',
    recurrence_start_date: '',
    notes: '',
    override_reason: ''
  })

  const load = useCallback(async () => {
    setLoading(true)
    // Fetch active term first so we can scope entries and sections to it
    const termRes = await (window.electronAPI.getActiveTerm(department) as Promise<IpcResponse<ActiveTerm>>)
    if (termRes.data) setActiveTerm(termRes.data)

    const semId = termRes.data?.semester?.id
    const ayId = termRes.data?.academicYear?.id

    const [entriesRes, roomsRes, persRes, secRes] = await Promise.all([
      window.electronAPI.listExamEntries({
        department,
        ...(semId ? { semester_id: semId } : {}),
        ...(ayId ? { academic_year_id: ayId } : {})
      }) as Promise<IpcResponse<ScheduleEntry[]>>,
      window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
      window.electronAPI.listPersonnel({ department, is_shared: true }) as Promise<IpcResponse<Personnel[]>>,
      window.electronAPI.listSections({
        department,
        ...(semId ? { semester_id: semId } : {}),
        ...(ayId ? { academic_year_id: ayId } : {})
      }) as Promise<IpcResponse<Section[]>>
    ])
    if (entriesRes.data) setEntries(entriesRes.data)
    if (roomsRes.data) setRooms(roomsRes.data)
    if (persRes.data) setPersonnel(persRes.data)
    if (secRes.data) setSections(secRes.data)

    // Load exam period calendar events for date constraints
    if (termRes.data?.academicYear) {
      const calFilters: Record<string, string> = {}
      if (termRes.data.academicYear.id) calFilters.academic_year_id = termRes.data.academicYear.id
      if (termRes.data.semester?.id) calFilters.semester_id = termRes.data.semester.id
      const calResult = (await window.electronAPI.listCalendarEvents(calFilters)) as IpcResponse<CalendarEvent[]>
      const periods = (calResult.data ?? []).filter((ev) => ev.event_type === 'EXAM_PERIOD' && ev.is_active)
      setExamPeriods(periods)
    }

    // Don't auto-fill date from semester — user should set it explicitly
    setLoading(false)
  }, [department])

  useEffect(() => { load() }, [load])

  // Load subject bank
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.listSubjectBank({ department })) as IpcResponse<SubjectBankEntry[]>
      if (result.data) setSubjectBankItems(result.data)
    })()
  }, [department])

  const examTypes = department === 'SHS' ? SHS_EXAM_TYPES : COLLEGE_EXAM_TYPES

  // Compute allowed exam dates from matching exam period calendar events
  const matchingPeriod = examPeriods.find(ep => ep.exam_type === examType)
  const examDateMin = matchingPeriod ? matchingPeriod.start_datetime.slice(0, 10) : ''
  const examDateMax = matchingPeriod ? matchingPeriod.end_datetime.slice(0, 10) : ''

  // === Auto-populate subjects when section changes ===
  useEffect(() => {
    if (!selectedSectionId) {
      setSubjectRows([])
      return
    }
    const section = sections.find(s => s.id === selectedSectionId)
    if (!section) { setSubjectRows([]); return }

    if (!section.course_program || !section.year_level) {
      setSubjectRows([])
      return
    }

    const semType = activeTerm?.semester?.semester_type?.replace('_SEMESTER', '') ?? ''
    const matched = subjectBankItems.filter(s =>
      s.course_program === section.course_program &&
      s.year_level === section.year_level &&
      (!semType || s.semester_type === semType)
    )

    setSubjectRows(matched.map(s => ({
      subjectBankId: s.id,
      subject_name: s.subject_name,
      subject_code: s.subject_code,
      lec_units: s.lec_units,
      lab_units: s.lab_units,
      room_id: '',
      personnel_id: '',
      modality: '' as Modality,
      start_time: '',
      end_time: '',
      exam_date: '',
      enabled: true
    })))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSectionId, sections, subjectBankItems, activeTerm])

  // === Apply "Set All" to all rows ===
  // Helper: add minutes to a time string "HH:MM"
  const addMinutes = (time: string, mins: number): string => {
    const [h, m] = time.split(':').map(Number)
    const total = h * 60 + m + mins
    const nh = Math.floor(total / 60) % 24
    const nm = total % 60
    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
  }

  const applySetAll = () => {
    const duration = parseInt(setAllDuration) || 0
    let currentStart = setAllStartTime
    const selectedCount = subjectRows.filter(r => r.enabled).length

    setSubjectRows(rows => rows.map(r => {
      if (!r.enabled) return r

      const updated = { ...r, enabled: false } // uncheck after applying
      if (setAllRoom) updated.room_id = setAllRoom
      if (setAllDate) updated.exam_date = setAllDate
      if (setAllProctor) updated.personnel_id = setAllProctor
      if (setAllModality) updated.modality = setAllModality as Modality

      if (currentStart && duration > 0) {
        updated.start_time = currentStart
        updated.end_time = addMinutes(currentStart, duration)
        currentStart = addMinutes(currentStart, duration)
      }

      return updated
    }))

    toast.success(`Applied to ${selectedCount} selected subject${selectedCount !== 1 ? 's' : ''}`)
  }

  // === Update a single subject row ===
  const updateRow = (index: number, updates: Partial<SubjectExamRow>) => {
    setSubjectRows(rows => rows.map((r, i) => i === index ? { ...r, ...updates } : r))
  }

  // === Parse range input e.g. "1-5", "3", "all" and check those subjects ===
  const applyRangeInput = (value: string) => {
    const v = value.trim().toLowerCase()
    if (!v) return
    const total = subjectRows.length
    let from = 0
    let to = total - 1

    if (v === 'all') {
      from = 0; to = total - 1
    } else if (v.includes('-')) {
      const parts = v.split('-').map(p => parseInt(p.trim()) - 1)
      if (!isNaN(parts[0])) from = Math.max(0, parts[0])
      if (!isNaN(parts[1])) to = Math.min(total - 1, parts[1])
    } else {
      const n = parseInt(v) - 1
      if (!isNaN(n)) { from = n; to = n }
    }

    setSubjectRows(rows => rows.map((r, i) => ({ ...r, enabled: i >= from && i <= to })))
    setRangeInput('')
  }

  // === Complete — validate, show modal ===
  const handleOpenComplete = () => {
    setError(null); setConflicts([])
    if (!activeTerm?.academicYear) { setError('No active term set.'); return }
    if (!examType) { setError('Please select an exam type.'); return }
    if (!selectedSectionId) { setError('Please select a section.'); return }
    const enabledRows = subjectRows.filter(r => r.enabled)
    if (enabledRows.length === 0) { setError('No subjects selected.'); return }
    for (const r of enabledRows) {
      if (!r.room_id) { setError(`"${r.subject_name}" is missing a Room.`); return }
      if (!r.exam_date) { setError(`"${r.subject_name}" is missing an Exam Date.`); return }
      if (!r.start_time || !r.end_time) { setError(`"${r.subject_name}" is missing Start/End Time.`); return }
      if (!r.modality) { setError(`"${r.subject_name}" is missing a Modality.`); return }
    }
    setShowCompleteModal(true)
  }

  // === Complete confirm — create all entries then optionally publish ===
  const handleComplete = async (action: 'draft' | 'publish') => {
    setShowCompleteModal(false)
    setError(null)
    if (!activeTerm?.academicYear) return

    const enabledRows = subjectRows.filter(r => r.enabled)
    setIsSubmitting(true)

    try {
      let created = 0
      const errors: string[] = []
      const createdIds: string[] = []
      const allConflicts: ConflictFlag[] = []

      for (const row of enabledRows) {
        const payload = {
          department,
          activity_type: 'EXAM' as const,
          room_id: row.room_id || null,
          personnel_id: row.personnel_id || null,
          section_ids: [selectedSectionId],
          subject: row.subject_name || null,
          subject_code: row.subject_code || null,
          lec_units: row.lec_units,
          lab_units: row.lab_units,
          exam_title: null,
          exam_type: examType as ExamType,
          modality: row.modality,
          start_time: row.start_time,
          end_time: row.end_time,
          recurrence_pattern: 'ONCE' as const,
          recurrence_start_date: row.exam_date,
          recurrence_end_date: null,
          day_of_week: null,
          academic_year_id: activeTerm.academicYear.id,
          semester_id: activeTerm.semester?.id ?? null,
          notes: batchNotes || null,
          override_reason: batchOverrideReason || null
        }
        const result = (await window.electronAPI.createDraftEntry(payload)) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>
        if (result.error) {
          errors.push(`${row.subject_code || row.subject_name}: ${result.error.message}`)
        } else {
          created++
          if (result.data?.entry?.id) createdIds.push(result.data.entry.id)
          if (result.data?.conflicts?.length) allConflicts.push(...result.data.conflicts)
        }
      }

      if (allConflicts.length > 0) setConflicts(allConflicts)

      if (errors.length > 0 && created === 0) {
        // All failed — stay in form and show errors
        setError(`All ${errors.length} subjects failed:\n${errors.join('\n')}`)
        setIsSubmitting(false)
        setShowCompleteModal(false)
        return
      }

      // Publish if requested
      if (action === 'publish' && createdIds.length > 0) {
        const pubResult = (await window.electronAPI.publishEntries(createdIds)) as IpcResponse<{ published: string[]; blocked: Array<{ id: string; conflicts: ConflictFlag[] }> }>
        if (pubResult.data?.blocked?.length) {
          const blocked = pubResult.data.blocked
          setBlockedPublishConflicts(blocked)
          toast.error(`${blocked.length} entries blocked by hard conflicts — saved as drafts instead.`, {
            duration: 10000,
            action: { label: 'See Conflicts', onClick: () => setBlockedPublishConflicts(blocked) }
          })
        }
      }

      const partialWarn = errors.length > 0 ? ` (${errors.length} failed)` : ''
      toast.success(action === 'publish'
        ? `${created} exam${created !== 1 ? 's' : ''} published${partialWarn}.`
        : `${created} exam draft${created !== 1 ? 's' : ''} created${partialWarn}.`
      )

      // Close and reset BEFORE load to avoid stale state
      setShowForm(false)
      resetBatchForm()
      await load()
    } catch (err) {
      setError(`Unexpected error: ${(err as Error).message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetBatchForm = () => {
    setExamType('')
    setSelectedSectionId('')
    setSubjectRows([])
    setBatchNotes('')
    setBatchOverrideReason('')
    setSetAllRoom('')
    setSetAllDate('')
    setSetAllStartTime('')
    setSetAllDuration('')
    setSetAllProctor('')
    setSetAllModality('')
    setShowCompleteModal(false)
    setExamPeriods([])
  }

  // === Single-entry edit submit ===
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setConflicts([])
    if (!activeTerm?.academicYear || !editingId) return

    setIsSubmitting(true)
    try {
      const payload = {
        id: editingId,
        department,
        activity_type: 'EXAM' as const,
        room_id: editForm.room_id || null,
        personnel_id: editForm.personnel_id || null,
        section_ids: [] as string[], // preserve existing
        subject: editForm.subject || null,
        subject_code: editForm.subject_code || null,
        lec_units: editForm.lec_units,
        lab_units: editForm.lab_units,
        exam_title: null,
        exam_type: editForm.exam_type as ExamType,
        modality: editForm.modality,
        start_time: editForm.start_time,
        end_time: editForm.end_time,
        recurrence_pattern: 'ONCE' as const,
        recurrence_start_date: editForm.recurrence_start_date,
        recurrence_end_date: null,
        day_of_week: null,
        academic_year_id: activeTerm.academicYear.id,
        semester_id: activeTerm.semester?.id ?? null,
        notes: editForm.notes || null,
        override_reason: editForm.override_reason || null
      }

      const result = (await window.electronAPI.updateDraftEntry(payload)) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>
      if (result.error) {
        if (result.error.code === 'HARD_CONFLICT') {
          setError(result.error.message + ' Add an override reason to save anyway.')
        } else {
          setError(result.error.message)
        }
        return
      }
      if (result.data?.conflicts) setConflicts(result.data.conflicts)
      toast.success('Exam entry updated')
      setEditingId(null); load()
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
    await window.electronAPI.unpublishEntries(ids)
    toast.success('Entry unpublished')
    load()
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Exam Entry',
      message: 'Are you sure you want to delete this draft exam entry?',
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteDraftEntry(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Exam entry deleted'); load() }
  }

  const startEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id)
    setEditForm({
      exam_type: entry.exam_type ?? '',
      room_id: entry.room_id ?? '',
      personnel_id: entry.personnel_id ?? '',
      subject: entry.subject ?? '',
      subject_code: entry.subject_code ?? '',
      lec_units: entry.lec_units ?? 0,
      lab_units: entry.lab_units ?? 0,
      modality: entry.modality,
      start_time: entry.start_time,
      end_time: entry.end_time,
      recurrence_start_date: entry.recurrence_start_date,
      notes: entry.notes ?? '',
      override_reason: ''
    })
    setShowForm(false)
    setError(null); setConflicts([])
  }

  const getRoomName = (id: string | null) => rooms.find(r => r.id === id)?.room_code ?? '—'
  const getPersonnelName = (id: string | null) => { const p = personnel.find(x => x.id === id); return p ? `${p.last_name}, ${p.first_name}` : '—' }

  // Check for exam period before opening the new exam form
  const handleNewExam = async () => {
    if (!activeTerm?.academicYear || !activeTerm?.semester) {
      toast.error('No active term set. Please activate an academic year and semester first.')
      return
    }

    // Query calendar for EXAM_PERIOD events in the active semester
    const filters: Record<string, string> = {}
    if (activeTerm.academicYear?.id) filters.academic_year_id = activeTerm.academicYear.id
    if (activeTerm.semester?.id) filters.semester_id = activeTerm.semester.id
    const calResult = (await window.electronAPI.listCalendarEvents(filters)) as IpcResponse<CalendarEvent[]>
    const periods = (calResult.data ?? []).filter((ev) => ev.event_type === 'EXAM_PERIOD' && ev.is_active)

    if (periods.length === 0) {
      await confirm({
        title: 'No Exam Period Scheduled',
        message: 'There is no exam period assigned on the calendar for the current active semester. You must create an Exam Period event on the Calendar page before you can schedule exams.',
        variant: 'warning',
        confirmLabel: 'OK',
      })
      return
    }

    // Exam period exists — store them and open the form
    setShowForm(true); setEditingId(null); resetBatchForm(); setExamPeriods(periods); setError(null); setConflicts([])
  }

  const handleExportExams = async () => {
    const signatories = await openSignatoriesModal()
    if (signatories === null) return // User cancelled
    const result = (await window.electronAPI.exportExamSchedule({ department, signatories })) as IpcResponse<{ success: boolean; path?: string }>
    if (result.data?.path) toast.success(`Exported to: ${result.data.path}`)
    else if (result.error) toast.error(result.error.message)
  }

  const draftEntries = entries.filter(e => e.status === 'DRAFT')
  const selectedSection = sections.find(s => s.id === selectedSectionId)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  const toggleSection = (sectionCode: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      next.has(sectionCode) ? next.delete(sectionCode) : next.add(sectionCode)
      return next
    })
  }

  // Group entries by section_code (parsed from section_ids JSON)
  const getSectionCode = (e: ScheduleEntry): string => {
    try {
      const ids: string[] = typeof e.section_ids === 'string' ? JSON.parse(e.section_ids) : (e.section_ids ?? [])
      const sec = sections.find(s => ids.includes(s.id))
      return sec?.section_code ?? 'Unknown Section'
    } catch { return 'Unknown Section' }
  }

  const getSectionMeta = (e: ScheduleEntry) => {
    try {
      const ids: string[] = typeof e.section_ids === 'string' ? JSON.parse(e.section_ids) : (e.section_ids ?? [])
      return sections.find(s => ids.includes(s.id))
    } catch { return undefined }
  }

  const groupedBySection = entries.reduce<Record<string, ScheduleEntry[]>>((acc, e) => {
    const key = getSectionCode(e)
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  // Compact input classes
  const inputCls = 'w-full px-2 py-1.5 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm'
  const selectCls = inputCls

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Exam Schedule</h1>
          {activeTerm?.academicYear && <p className="text-sm text-surface-500">{activeTerm.academicYear.label}{activeTerm.semester ? ` · ${activeTerm.semester.semester_type.replace('_', ' ')}` : ''}</p>}
        </div>
        <div className="flex gap-3">
          {draftEntries.length > 0 && (
            <button onClick={() => handlePublish(draftEntries.map(e => e.id))} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
              Publish All Drafts ({draftEntries.length})
            </button>
          )}
          <button onClick={handleExportExams} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Export Excel</button>
          <button onClick={handleNewExam}
            disabled={!activeTerm?.semester}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-sm font-medium">
            + New Exam
          </button>
        </div>
      </div>

      {/* No active semester warning */}
      {!loading && !activeTerm?.semester && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <div>
            <p className="font-semibold">No active semester set</p>
            <p className="mt-0.5">Please activate a semester in <strong>Academic Years</strong> to schedule exams. All exam data is scoped to the active semester.</p>
          </div>
        </div>
      )}

      {/* Exam Period Requirement Banner */}
      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm flex items-start gap-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
        <span>Exam entries require an <strong>Exam Period</strong> to be set on the <strong>Calendar</strong> for the selected dates. If no exam period exists, exam scheduling will be blocked.</span>
      </div>
      {/* ============ BATCH CREATION FORM ============ */}
      {showForm && !editingId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetBatchForm() } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <form className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">New Exam Schedule</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm whitespace-pre-line">{error}</div>}
          {conflicts.length > 0 && (
            <div className="space-y-1">
              {conflicts.map((c, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${c.severity === 'HARD' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <span className="font-semibold">{c.severity}:</span> {c.message}
                </div>
              ))}
            </div>
          )}

          {/* Top row: Exam Type + Section */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type *</label>
              <select value={examType} onChange={(e) => setExamType(e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select —</option>
                {examTypes.map(t => {
                  const hasPeriod = examPeriods.some(ep => ep.exam_type === t)
                  return <option key={t} value={t} disabled={!hasPeriod}>{t.replace(/_/g, ' ')}{!hasPeriod ? ' (no period scheduled)' : ''}</option>
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Section *</label>
              <select value={selectedSectionId} onChange={(e) => setSelectedSectionId(e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select Section —</option>
                {(() => {
                  // Collect section IDs that already have entries for the selected exam type
                  const assignedSectionIds = new Set<string>()
                  if (examType) {
                    for (const entry of entries) {
                      if (entry.exam_type === examType) {
                        try {
                          const ids = JSON.parse(entry.section_ids || '[]') as string[]
                          ids.forEach(id => assignedSectionIds.add(id))
                        } catch { /* ignore parse errors */ }
                      }
                    }
                  }
                  return sections
                    .filter((s, i, arr) => arr.findIndex(x => x.section_code === s.section_code) === i)
                    .filter(s => !assignedSectionIds.has(s.id))
                    .map(s => <option key={s.id} value={s.id}>{s.section_code}{s.course_program ? ` (${s.course_program} - ${s.year_level})` : ''}</option>)
                })()}
              </select>
            </div>
            <div className="flex items-end">
              {selectedSection && (
                <div className="text-sm text-surface-500">
                  <span className="font-medium text-surface-700">{selectedSection.course_program}</span> · {selectedSection.year_level} · {selectedSection.student_count} students
                </div>
              )}
            </div>
          </div>

          {/* Warning if no curriculum */}
          {selectedSectionId && selectedSection && (!selectedSection.course_program || !selectedSection.year_level) && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
              This section has no curriculum/year level set. Cannot auto-populate subjects.
            </div>
          )}

          {/* Exam period date range info */}
          {examType && matchingPeriod && (
            <div className="p-3 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg text-sm flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
              <span>Exam dates must fall within the <strong>{matchingPeriod.title}</strong> period: <strong>{new Date(examDateMin).toLocaleDateString()}</strong> — <strong>{new Date(examDateMax).toLocaleDateString()}</strong></span>
            </div>
          )}

          {/* Subject rows table */}
          {selectedSectionId && subjectRows.length > 0 && (
            <div className="space-y-3">
              {/* Set All convenience row */}
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary-800">Set Selected Subjects</span>
                  <button type="button" onClick={applySetAll} className="px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-xs font-medium">
                    Apply to Selected
                  </button>
                </div>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Room</label>
                    <select value={setAllRoom} onChange={(e) => setSetAllRoom(e.target.value)} className={selectCls}>
                      <option value="">—</option>
                      {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Date</label>
                    <input type="date" value={setAllDate} onChange={(e) => setSetAllDate(e.target.value)} min={examDateMin} max={examDateMax} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Start Time</label>
                    <input type="time" value={setAllStartTime} onChange={(e) => setSetAllStartTime(e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Duration / Subject</label>
                    <select value={setAllDuration} onChange={(e) => setSetAllDuration(e.target.value)} className={selectCls}>
                      <option value="">—</option>
                      {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Proctor</label>
                    <select value={setAllProctor} onChange={(e) => setSetAllProctor(e.target.value)} className={selectCls}>
                      <option value="">— None —</option>
                      {personnel.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-primary-700 mb-0.5">Modality</label>
                    <select value={setAllModality} onChange={(e) => setSetAllModality(e.target.value)} className={selectCls}>
                      <option value="">—</option>
                      <option value="F2F">F2F</option>
                      <option value="ONLINE">Online</option>
                      <option value="HYBRID">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Subjects list */}
              <div className="space-y-2">
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 bg-surface-50 rounded-lg border border-surface-200">
                  <input type="checkbox"
                    checked={subjectRows.length > 0 && subjectRows.every(r => r.enabled)}
                    onChange={(e) => setSubjectRows(rows => rows.map(r => ({ ...r, enabled: e.target.checked })))}
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 flex-shrink-0" />
                  <span className="text-xs font-semibold text-surface-600 uppercase tracking-wide flex-shrink-0">
                    {subjectRows.filter(r => r.enabled).length} of {subjectRows.length} subjects selected
                  </span>
                  <div className="flex items-center gap-1 ml-auto">
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyRangeInput(rangeInput) } }}
                      placeholder={`e.g. 1-5 or all ${subjectRows.length}`}
                      className="text-xs px-2 py-1 border border-surface-300 rounded-md outline-none focus:ring-1 focus:ring-primary-400 w-36"
                    />
                    <button type="button" onClick={() => applyRangeInput(rangeInput)} className="text-xs px-2 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700">
                      Select
                    </button>
                  </div>
                </div>

                {subjectRows.map((row, idx) => (
                  <div key={row.subjectBankId} className={`border rounded-lg transition-colors ${row.enabled ? 'border-surface-200 bg-white' : 'border-surface-100 bg-surface-50 opacity-50'}`}>
                    <div className="flex items-start gap-3 p-3">
                      {/* Checkbox */}
                      <div className="pt-1">
                        <input type="checkbox" checked={row.enabled} onChange={(e) => updateRow(idx, { enabled: e.target.checked })} className="w-4 h-4 rounded border-surface-300 text-primary-600" />
                      </div>

                      {/* Subject info */}
                      <div className="flex-shrink-0 w-48 min-w-0">
                        <div className="font-medium text-sm text-surface-900 truncate" title={row.subject_name}>{row.subject_name}</div>
                        <div className="text-xs text-surface-500 mt-0.5">
                          {row.subject_code || '—'} · LEC: {row.lec_units} · LAB: {row.lab_units}
                        </div>
                      </div>

                      {/* Editable fields grid */}
                      <div className="flex-1 grid grid-cols-12 gap-2 min-w-0">
                        <div className="col-span-2">
                          <select value={row.room_id} onChange={(e) => updateRow(idx, { room_id: e.target.value })} className={selectCls} disabled={!row.enabled}>
                            <option value="">Room</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input type="date" value={row.exam_date} onChange={(e) => updateRow(idx, { exam_date: e.target.value })} min={examDateMin} max={examDateMax} className={inputCls} disabled={!row.enabled} />
                        </div>
                        <div className="col-span-2">
                          <input type="time" value={row.start_time} onChange={(e) => updateRow(idx, { start_time: e.target.value })} className={inputCls} disabled={!row.enabled} />
                        </div>
                        <div className="col-span-2">
                          <input type="time" value={row.end_time} onChange={(e) => updateRow(idx, { end_time: e.target.value })} className={inputCls} disabled={!row.enabled} />
                        </div>
                        <div className="col-span-2">
                          <select value={row.personnel_id} onChange={(e) => updateRow(idx, { personnel_id: e.target.value })} className={selectCls} disabled={!row.enabled}>
                            <option value="">Proctor</option>
                            {personnel.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <select value={row.modality} onChange={(e) => updateRow(idx, { modality: e.target.value as Modality })} className={selectCls} disabled={!row.enabled}>
                            <option value="">Modality</option>
                            <option value="F2F">F2F</option>
                            <option value="ONLINE">Online</option>
                            <option value="HYBRID">Hybrid</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No subjects found */}
          {selectedSectionId && selectedSection?.course_program && selectedSection?.year_level && subjectRows.length === 0 && (
            <div className="p-4 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-500 text-center">
              No subjects found in the Subject Bank for <span className="font-medium">{selectedSection.course_program} — {selectedSection.year_level}</span>.
              <br />Check if subjects are added to the Subject Bank for this curriculum and semester.
            </div>
          )}

          {/* Notes / Override */}
          {subjectRows.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
                <input type="text" value={batchNotes} onChange={(e) => setBatchNotes(e.target.value)} placeholder="Optional notes (applied to all entries)" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
                <input type="text" value={batchOverrideReason} onChange={(e) => setBatchOverrideReason(e.target.value)} placeholder="Reason (if overriding conflicts)" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {subjectRows.length > 0 && (
              <button type="button" onClick={handleOpenComplete} disabled={isSubmitting} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 text-sm font-semibold">
                {isSubmitting ? 'Saving...' : 'Complete'}
              </button>
            )}
            <button type="button" onClick={() => { setShowForm(false); resetBatchForm() }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
          </div>
        </div>
      )}

      {/* ============ COMPLETE MODAL ============ */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 px-6 py-5 text-white">
              <div className="text-2xl font-bold mb-1">🎉 Schedule Complete!</div>
              <div className="text-green-100 text-sm">{subjectRows.filter(r => r.enabled).length > 0 ? `${subjectRows.filter(r => r.enabled).length} subjects` : 'All subjects'} for <span className="font-semibold">{selectedSection?.section_code}</span> are ready to be saved.</div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-surface-600">How would you like to save this exam schedule?</p>

              <button
                onClick={() => handleComplete('draft')}
                className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-surface-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left group"
              >
                <span className="text-2xl mt-0.5">📋</span>
                <div>
                  <div className="font-semibold text-surface-800 group-hover:text-primary-700">Save as Draft</div>
                  <div className="text-xs text-surface-500 mt-0.5">Keep entries as drafts. You can review and publish them later from the exam schedule list.</div>
                </div>
              </button>

              <button
                onClick={() => handleComplete('publish')}
                className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors text-left group"
              >
                <span className="text-2xl mt-0.5">✅</span>
                <div>
                  <div className="font-semibold text-surface-800 group-hover:text-green-700">Publish Now</div>
                  <div className="text-xs text-surface-500 mt-0.5">Immediately publish all {subjectRows.filter(r => r.enabled).length} exam entries. They will be visible and locked for editing.</div>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="w-full px-4 py-2 bg-surface-100 text-surface-600 rounded-lg hover:bg-surface-200 text-sm font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={(e) => { if (e.target === e.currentTarget) { setEditingId(null); setError(null); setConflicts([]) } }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
          <h2 className="text-lg font-semibold">Edit Exam Entry</h2>
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

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
              <input type="text" value={editForm.subject} readOnly className="w-full px-3 py-2 border border-surface-200 rounded-lg bg-surface-50 text-surface-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject Code</label>
              <input type="text" value={editForm.subject_code} readOnly className="w-full px-3 py-2 border border-surface-200 rounded-lg bg-surface-50 text-surface-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type *</label>
              <select value={editForm.exam_type} onChange={(e) => setEditForm({ ...editForm, exam_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select —</option>
                {examTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Room *</label>
              <select value={editForm.room_id} onChange={(e) => setEditForm({ ...editForm, room_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code} ({r.capacity})</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">LEC</label>
              <input type="number" value={editForm.lec_units} readOnly className="w-full px-3 py-2 border border-surface-200 rounded-lg bg-surface-50 text-surface-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">LAB</label>
              <input type="number" value={editForm.lab_units} readOnly className="w-full px-3 py-2 border border-surface-200 rounded-lg bg-surface-50 text-surface-600 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Date *</label>
              <input type="date" value={editForm.recurrence_start_date} onChange={(e) => setEditForm({ ...editForm, recurrence_start_date: e.target.value })} min={(() => { const ep = examPeriods.find(p => p.exam_type === editForm.exam_type); return ep ? ep.start_datetime.slice(0, 10) : '' })()} max={(() => { const ep = examPeriods.find(p => p.exam_type === editForm.exam_type); return ep ? ep.end_datetime.slice(0, 10) : '' })()} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Time *</label>
              <input type="time" value={editForm.start_time} onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Time *</label>
              <input type="time" value={editForm.end_time} onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Modality</label>
              <select value={editForm.modality} onChange={(e) => setEditForm({ ...editForm, modality: e.target.value as Modality })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="F2F">Face-to-Face</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Proctor</label>
              <select value={editForm.personnel_id} onChange={(e) => setEditForm({ ...editForm, personnel_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">— None —</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
              <input type="text" value={editForm.override_reason} onChange={(e) => setEditForm({ ...editForm, override_reason: e.target.value })} placeholder="Reason" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
              <input type="text" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Optional" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : 'Update'}</button>
            <button type="button" onClick={() => { setEditingId(null); setError(null); setConflicts([]) }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
          </div>
        </div>
      )}

      {/* ============ ENTRIES — GROUPED BY SECTION ============ */}
      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading...</div>
      ) : Object.keys(groupedBySection).length === 0 ? (
        <div className="text-center py-12 text-surface-400">No exam entries found.</div>
      ) : (
        <div className="space-y-2">
          {Object.entries(groupedBySection).sort(([a], [b]) => a.localeCompare(b)).map(([sectionCode, sectionEntries]) => {
            const isOpen = expandedSections.has(sectionCode)
            const meta = getSectionMeta(sectionEntries[0])
            const drafts = sectionEntries.filter(e => e.status === 'DRAFT').length
            const published = sectionEntries.filter(e => e.status === 'PUBLISHED').length
            const examType = sectionEntries[0]?.exam_type ?? ''

            return (
              <div key={sectionCode} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
                {/* Section header — clickable */}
                <button
                  type="button"
                  onClick={() => toggleSection(sectionCode)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-50 transition-colors"
                >
                  {/* Chevron */}
                  <span className={`text-surface-400 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
                    ▶
                  </span>

                  {/* Section info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-surface-900">{sectionCode}</div>
                    {meta && (
                      <div className="text-xs text-surface-500 mt-0.5">
                        {meta.course_program} · {meta.year_level}{meta.student_count ? ` · ${meta.student_count} students` : ''}
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {examType && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{examType}</span>
                    )}
                    <span className="text-xs text-surface-500">{sectionEntries.length} subject{sectionEntries.length !== 1 ? 's' : ''}</span>
                    {drafts > 0 && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{drafts} draft</span>}
                    {published > 0 && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{published} published</span>}
                    {drafts > 0 && (
                      <button
                        type="button"
                        onClick={(ev) => { ev.stopPropagation(); handlePublish(sectionEntries.filter(e => e.status === 'DRAFT').map(e => e.id)) }}
                        className="ml-2 text-xs px-2 py-0.5 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        Publish All
                      </button>
                    )}
                  </div>
                </button>

                {/* Expanded entries table */}
                {isOpen && (
                  <div className="border-t border-surface-100">
                    <table className="w-full text-sm">
                      <thead className="bg-surface-50">
                        <tr>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Code</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Subject</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Room</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Proctor</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Date</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Time</th>
                          <th className="text-left px-4 py-2 font-semibold text-surface-500 text-xs">Status</th>
                          <th className="text-right px-4 py-2 font-semibold text-surface-500 text-xs">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {sectionEntries.map((e) => (
                          <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                            <td className="px-4 py-2.5 font-medium text-surface-800 text-xs">{e.subject_code ?? '—'}</td>
                            <td className="px-4 py-2.5 text-surface-700">{e.subject ?? '—'}</td>
                            <td className="px-4 py-2.5 text-surface-600">{getRoomName(e.room_id)}</td>
                            <td className="px-4 py-2.5 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                            <td className="px-4 py-2.5 text-surface-600 text-xs">{e.recurrence_start_date}</td>
                            <td className="px-4 py-2.5 text-surface-600 whitespace-nowrap text-xs">{e.start_time}–{e.end_time}</td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {e.status}
                              </span>
                              {(() => {
                                const { hard, soft } = parseConflictCounts(e.conflict_flags)
                                return (
                                  <>
                                    {hard > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{hard}</span>}
                                    {soft > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-600">⚠ {soft}</span>}
                                    {(hard > 0 || soft > 0) && (
                                      <button
                                        type="button"
                                        onClick={() => setConflictDetailEntry(e)}
                                        className="ml-1.5 text-xs font-medium text-red-600 hover:text-red-800 underline underline-offset-2"
                                      >
                                        See Conflict
                                      </button>
                                    )}
                                  </>
                                )
                              })()}
                            </td>
                            <td className="px-4 py-2.5 text-right space-x-2">
                              {e.status === 'DRAFT' && <>
                                <button onClick={() => startEdit(e)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                                <button onClick={() => handlePublish([e.id])} className="text-green-600 hover:text-green-800 text-xs font-medium">Publish</button>
                                <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                              </>}
                              {e.status === 'PUBLISHED' && <button onClick={() => handleUnpublish([e.id])} className="text-amber-600 hover:text-amber-800 text-xs font-medium">Unpublish</button>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
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
                <p className="text-red-100 text-sm mt-0.5">{conflictDetailEntry.subject ?? conflictDetailEntry.exam_title ?? 'Exam Entry'} · {conflictDetailEntry.start_time}–{conflictDetailEntry.end_time}</p>
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
                const entry = entries.find(e => e.id === blocked.id)
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
