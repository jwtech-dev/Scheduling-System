import type { ActiveTerm, ScheduleEntry, ConflictFlag, Room, Personnel, Section } from '@shared/types'
import type { IpcResponse, Department } from '@shared/types'
import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../../contexts/DepartmentContext'
import type { ActivityType, RecurrencePattern, Modality, PatternMode } from '@shared/types'
import { patternModeToRecurrence, recurrenceToPatternMode } from '@shared/constants'

// ── Types ────────────────────────────────────────────────────

export interface ScheduleFormData {
  activity_type: ActivityType
  room_id: string
  personnel_id: string
  section_ids: string[]
  subject: string
  exam_title: string
  exam_type: string
  modality: Modality
  start_time: string
  end_time: string
  pattern_mode: PatternMode
  selected_days: number[]
  day_of_month: number | null
  recurrence_start_date: string
  recurrence_end_date: string
  notes: string
  override_reason: string
}

const INITIAL_FORM: ScheduleFormData = {
  activity_type: 'CLASS',
  room_id: '',
  personnel_id: '',
  section_ids: [],
  subject: '',
  exam_title: '',
  exam_type: '',
  modality: 'F2F',
  start_time: '08:00',
  end_time: '09:00',
  pattern_mode: 'WEEKLY',
  selected_days: [1, 3, 5],
  day_of_month: null,
  recurrence_start_date: '',
  recurrence_end_date: '',
  notes: '',
  override_reason: ''
}

// ── Hook ─────────────────────────────────────────────────────

export function useScheduleData() {
  const { department } = useDepartment()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ScheduleFormData>({ ...INITIAL_FORM })

  const load = useCallback(async () => {
    setLoading(true)
    try {
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

      if (termRes.data?.semester) {
        setForm((f) => ({
          ...f,
          recurrence_start_date: f.recurrence_start_date || termRes.data!.semester!.start_date,
          recurrence_end_date: f.recurrence_end_date || termRes.data!.semester!.end_date
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [department, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = useCallback(async () => {
    setError(null)
    setConflicts([])
    if (!activeTerm?.academicYear) {
      setError('No active term set.')
      return false
    }

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
      ? ((await window.electronAPI.updateDraftEntry({ id: editingId, ...payload })) as IpcResponse<{
          entry: ScheduleEntry
          conflicts: ConflictFlag[]
        }>)
      : ((await window.electronAPI.createDraftEntry(payload)) as IpcResponse<{
          entry: ScheduleEntry
          conflicts: ConflictFlag[]
        }>)

    if (result.error) {
      if (result.error.code === 'HARD_CONFLICT') {
        setError(result.error.message + ' Add an override reason to save anyway.')
      } else {
        setError(result.error.message)
      }
      return false
    }
    if (result.data?.conflicts) setConflicts(result.data.conflicts)
    setShowForm(false)
    setEditingId(null)
    load()
    return true
  }, [form, editingId, activeTerm, department, load])

  const handleDelete = useCallback(
    async (id: string) => {
      const result = (await window.electronAPI.deleteDraftEntry(id)) as IpcResponse
      if (result.error) {
        setError(result.error.message)
        return false
      }
      load()
      return true
    },
    [load]
  )

  const handlePublish = useCallback(
    async (ids: string[]) => {
      const result = (await window.electronAPI.publishEntries(ids)) as IpcResponse<{
        published: string[]
        blocked: Array<{ id: string; conflicts: ConflictFlag[] }>
      }>
      if (result.data) {
        load()
        return result.data.blocked.length
      }
      return 0
    },
    [load]
  )

  const handleUnpublish = useCallback(
    async (ids: string[]) => {
      await window.electronAPI.unpublishEntries(ids)
      load()
    },
    [load]
  )

  const startEdit = useCallback((entry: ScheduleEntry) => {
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
      room_id: entry.room_id ?? '',
      personnel_id: entry.personnel_id ?? '',
      section_ids: JSON.parse(entry.section_ids || '[]'),
      subject: entry.subject ?? '',
      exam_title: entry.exam_title ?? '',
      exam_type: entry.exam_type ?? '',
      modality: entry.modality,
      start_time: entry.start_time,
      end_time: entry.end_time,
      pattern_mode: mapped.mode,
      selected_days: mapped.selectedDays,
      day_of_month: mapped.dayOfMonth,
      recurrence_start_date: entry.recurrence_start_date,
      recurrence_end_date: entry.recurrence_end_date ?? '',
      notes: entry.notes ?? '',
      override_reason: ''
    })
    setShowForm(true)
    setError(null)
    setConflicts([])
  }, [])

  const resetForm = useCallback(() => {
    setForm({
      ...INITIAL_FORM,
      recurrence_start_date: activeTerm?.semester?.start_date ?? '',
      recurrence_end_date: activeTerm?.semester?.end_date ?? ''
    })
  }, [activeTerm])

  const openNewForm = useCallback(() => {
    setShowForm(true)
    setEditingId(null)
    resetForm()
    setError(null)
    setConflicts([])
  }, [resetForm])

  return {
    // Data
    entries,
    rooms,
    personnel,
    sections,
    activeTerm,
    loading,
    conflicts,
    error,
    // Form
    form,
    setForm,
    showForm,
    setShowForm,
    editingId,
    // Filters
    statusFilter,
    setStatusFilter,
    // Actions
    handleSubmit,
    handleDelete,
    handlePublish,
    handleUnpublish,
    startEdit,
    openNewForm,
    load
  }
}
