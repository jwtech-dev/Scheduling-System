import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, ScheduleEntry, ConflictFlag, Room, Personnel, Section, ActiveTerm, SubjectBankEntry } from '@shared/types'
import { SHS_EXAM_TYPES, COLLEGE_EXAM_TYPES } from '@shared/constants'
import { useSignatoriesModal } from '../components/SignatoriesModal'
import type { Modality, ExamType } from '@shared/types'

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
  const [editingId, setEditingId] = useState<string | null>(null)
  const [conflicts, setConflicts] = useState<ConflictFlag[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Subject Bank integration
  const [subjectBankItems, setSubjectBankItems] = useState<SubjectBankEntry[]>([])
  const [subjFilterCourse, setSubjFilterCourse] = useState('')
  const [subjFilterYear, setSubjFilterYear] = useState('')
  const [subjSearch, setSubjSearch] = useState('')
  const [showSubjDropdown, setShowSubjDropdown] = useState(false)

  const [form, setForm] = useState({
    exam_title: '',
    exam_type: '' as string,
    room_id: '',
    personnel_id: '',
    section_ids: [] as string[],
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
    const [termRes, entriesRes, roomsRes, persRes, secRes] = await Promise.all([
      window.electronAPI.getActiveTerm(department) as Promise<IpcResponse<ActiveTerm>>,
      window.electronAPI.listExamEntries({ department }) as Promise<IpcResponse<ScheduleEntry[]>>,
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
      setForm(f => ({
        ...f,
        recurrence_start_date: f.recurrence_start_date || termRes.data!.semester!.start_date
      }))
    }
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

  const resetForm = () => setForm({
    exam_title: '', exam_type: '', room_id: '', personnel_id: '',
    section_ids: [], subject: '', subject_code: '', lec_units: 0, lab_units: 0, modality: 'F2F',
    start_time: '08:00', end_time: '10:00',
    recurrence_start_date: activeTerm?.semester?.start_date ?? '',
    notes: '', override_reason: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setConflicts([])
    if (!activeTerm?.academicYear) { setError('No active term set. Please configure an active academic year first.'); return }

    setIsSubmitting(true)
    try {
      const payload = {
        department,
        activity_type: 'EXAM' as const,
        room_id: form.room_id || null,
        personnel_id: form.personnel_id || null,
        section_ids: form.section_ids,
        subject: form.subject || null,
        subject_code: form.subject_code || null,
        lec_units: form.lec_units,
        lab_units: form.lab_units,
        exam_title: form.exam_title,
        exam_type: form.exam_type as ExamType,
        modality: form.modality,
        start_time: form.start_time,
        end_time: form.end_time,
        recurrence_pattern: 'ONCE' as const,
        recurrence_start_date: form.recurrence_start_date,
        recurrence_end_date: null,
        day_of_week: null,
        academic_year_id: activeTerm.academicYear.id,
        semester_id: activeTerm.semester?.id ?? null,
        notes: form.notes || null,
        override_reason: form.override_reason || null
      }

      const result = editingId
        ? (await window.electronAPI.updateDraftEntry({ id: editingId, ...payload })) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>
        : (await window.electronAPI.createDraftEntry(payload)) as IpcResponse<{ entry: ScheduleEntry; conflicts: ConflictFlag[] }>

      if (result.error) {
        if (result.error.code === 'HARD_CONFLICT') {
          setError(result.error.message + ' Add an override reason to save anyway.')
        } else {
          setError(result.error.message)
        }
        return
      }
      if (result.data?.conflicts) setConflicts(result.data.conflicts)
      toast.success(editingId ? 'Exam entry updated' : 'Exam draft created')
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
    setForm({
      exam_title: entry.exam_title ?? '',
      exam_type: entry.exam_type ?? '',
      room_id: entry.room_id ?? '',
      personnel_id: entry.personnel_id ?? '',
      section_ids: JSON.parse(entry.section_ids || '[]'),
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
    setShowForm(true); setError(null); setConflicts([])
  }

  const getRoomName = (id: string | null) => rooms.find(r => r.id === id)?.room_code ?? '—'
  const getPersonnelName = (id: string | null) => { const p = personnel.find(x => x.id === id); return p ? `${p.last_name}, ${p.first_name}` : '—' }

  const handleExportExams = async () => {
    const signatories = await openSignatoriesModal()
    if (signatories === null) return // User cancelled
    const result = (await window.electronAPI.exportExamSchedule({ department, signatories })) as IpcResponse<{ success: boolean; path?: string }>
    if (result.data?.path) toast.success(`Exported to: ${result.data.path}`)
    else if (result.error) toast.error(result.error.message)
  }

  const draftEntries = entries.filter(e => e.status === 'DRAFT')

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
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null); setConflicts([]) }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
            + New Exam
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Exam Entry</h2>
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

          {/* Row 1: Exam Title, Exam Type, Room */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Title *</label>
              <input type="text" value={form.exam_title} onChange={(e) => setForm({ ...form, exam_title: e.target.value })} placeholder="e.g. Midterm Exam — Mathematics" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type *</label>
              <select value={form.exam_type} onChange={(e) => setForm({ ...form, exam_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select —</option>
                {examTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Room *</label>
              <select value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required>
                <option value="">— Select —</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.room_code} ({r.capacity})</option>)}
              </select>
            </div>
          </div>

          {/* Row 2: Course/Year filter + Subject dropdown */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Curriculum</label>
              <select value={subjFilterCourse} onChange={(e) => setSubjFilterCourse(e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">All</option>
                {[...new Set(subjectBankItems.map(s => s.course_program))].sort().map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Year Level</label>
              <select value={subjFilterYear} onChange={(e) => setSubjFilterYear(e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">All</option>
                {[...new Set(subjectBankItems.map(s => s.year_level))].sort().map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="col-span-2 relative">
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject (from Subject Bank)</label>
              <div className="flex gap-1">
                <input type="text" value={subjSearch || form.subject} onChange={(e) => { setSubjSearch(e.target.value); setForm({ ...form, subject: e.target.value }); setShowSubjDropdown(true) }} onFocus={() => setShowSubjDropdown(true)} onBlur={() => setTimeout(() => setShowSubjDropdown(false), 200)} placeholder="Search subject..." className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                {form.subject_code && <span className="self-center text-xs text-surface-400 whitespace-nowrap">{form.subject_code}</span>}
              </div>
              {showSubjDropdown && (() => {
                const semType = activeTerm?.semester?.semester_type?.replace('_SEMESTER', '') ?? ''
                const q = (subjSearch || '').toLowerCase()
                const filtered = subjectBankItems.filter(s => {
                  if (subjFilterCourse && s.course_program !== subjFilterCourse) return false
                  if (subjFilterYear && s.year_level !== subjFilterYear) return false
                  if (semType && s.semester_type !== semType) return false
                  if (q && !s.subject_name.toLowerCase().includes(q) && !s.subject_code.toLowerCase().includes(q)) return false
                  return true
                }).slice(0, 15)
                return filtered.length > 0 ? (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-56 overflow-auto">
                    {filtered.map(s => (
                      <button key={s.id} type="button" onMouseDown={() => { setForm({ ...form, subject: s.subject_name, subject_code: s.subject_code, lec_units: s.lec_units, lab_units: s.lab_units }); setSubjSearch(''); setShowSubjDropdown(false) }} className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm flex justify-between items-center">
                        <span className="text-surface-800">{s.subject_name}</span>
                        <span className="text-xs text-surface-400">{s.subject_code ? s.subject_code + ' · ' : ''}{s.year_level} · {s.semester_type} · LEC:{s.lec_units} LAB:{s.lab_units}</span>
                      </button>
                    ))}
                  </div>
                ) : null
              })()}
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Sections *</label>
              <select multiple value={form.section_ids} onChange={(e) => setForm({ ...form, section_ids: Array.from(e.target.selectedOptions).map(o => o.value) })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-20" required>
                {sections.map(s => <option key={s.id} value={s.id}>{s.section_code}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: LEC, LAB, Proctor */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">LEC Units</label>
              <input type="number" value={form.lec_units} onChange={(e) => setForm({ ...form, lec_units: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={0} />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">LAB Units</label>
              <input type="number" value={form.lab_units} onChange={(e) => setForm({ ...form, lab_units: parseInt(e.target.value) || 0 })} placeholder="0" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={0} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Proctor</label>
              <select value={form.personnel_id} onChange={(e) => setForm({ ...form, personnel_id: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="">— None —</option>
                {personnel.map(p => <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Date, Time, Modality */}
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Date *</label>
              <input type="date" value={form.recurrence_start_date} onChange={(e) => setForm({ ...form, recurrence_start_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Time *</label>
              <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Time *</label>
              <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Modality</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as Modality })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="F2F">Face-to-Face</option><option value="ONLINE">Online</option><option value="HYBRID">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
              <input type="text" value={form.override_reason} onChange={(e) => setForm({ ...form, override_reason: e.target.value })} placeholder="Reason" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Notes</label>
            <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create Draft'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : entries.length === 0 ? <div className="text-center py-12 text-surface-400">No exam entries found.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Code</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
              <th className="text-center px-4 py-3 font-semibold text-surface-600">LEC</th>
              <th className="text-center px-4 py-3 font-semibold text-surface-600">LAB</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Room</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Proctor</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{e.subject_code ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{e.subject ?? e.exam_title ?? '—'}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{e.exam_type ?? '—'}</span></td>
                  <td className="px-4 py-3 text-center text-surface-600">{e.lec_units || '—'}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{e.lab_units || '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{getRoomName(e.room_id)}</td>
                  <td className="px-4 py-3 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{e.recurrence_start_date}</td>
                  <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span></td>
                  <td className="px-4 py-3 text-right space-x-1">
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
}
