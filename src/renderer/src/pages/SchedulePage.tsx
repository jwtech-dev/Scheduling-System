import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import type { IpcResponse, ScheduleEntry, ConflictFlag, Room, Personnel, Section, ActiveTerm } from '@shared/types'
import { ACTIVITY_TYPE_LABELS, RECURRENCE_PATTERN_LABELS, ACTIVITY_TYPES } from '@shared/constants'
import type { ActivityType, RecurrencePattern, Modality, ExamType } from '@shared/types'

export default function SchedulePage(): JSX.Element {
  const { department } = useDepartment()
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

  const [form, setForm] = useState({
    activity_type: 'CLASS' as ActivityType,
    room_id: '', personnel_id: '', section_ids: [] as string[],
    subject: '', exam_title: '', exam_type: '' as string,
    modality: 'F2F' as Modality,
    start_time: '08:00', end_time: '09:00',
    recurrence_pattern: 'MWF' as RecurrencePattern,
    recurrence_start_date: '', recurrence_end_date: '',
    day_of_week: null as number | null,
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

    const payload = {
      ...form, department,
      academic_year_id: activeTerm.academicYear.id,
      semester_id: activeTerm.semester?.id ?? null,
      room_id: form.room_id || null,
      personnel_id: form.personnel_id || null,
      section_ids: form.section_ids,
      exam_type: form.exam_type || null,
      override_reason: form.override_reason || null,
      day_of_week: form.day_of_week
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
    setShowForm(false); setEditingId(null); load()
  }

  const handlePublish = async (ids: string[]) => {
    const result = (await window.electronAPI.publishEntries(ids)) as IpcResponse<{ published: string[]; blocked: Array<{ id: string; conflicts: ConflictFlag[] }> }>
    if (result.data) {
      if (result.data.blocked.length > 0) alert(`${result.data.blocked.length} entries blocked by conflicts.`)
      load()
    }
  }

  const handleUnpublish = async (ids: string[]) => {
    await window.electronAPI.unpublishEntries(ids); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    const result = (await window.electronAPI.deleteDraftEntry(id)) as IpcResponse
    if (result.error) alert(result.error.message)
    else load()
  }

  const startEdit = (entry: ScheduleEntry) => {
    setEditingId(entry.id)
    setForm({
      activity_type: entry.activity_type,
      room_id: entry.room_id ?? '', personnel_id: entry.personnel_id ?? '',
      section_ids: JSON.parse(entry.section_ids || '[]'),
      subject: entry.subject ?? '', exam_title: entry.exam_title ?? '',
      exam_type: entry.exam_type ?? '',
      modality: entry.modality,
      start_time: entry.start_time, end_time: entry.end_time,
      recurrence_pattern: entry.recurrence_pattern,
      recurrence_start_date: entry.recurrence_start_date,
      recurrence_end_date: entry.recurrence_end_date ?? '',
      day_of_week: entry.day_of_week, notes: entry.notes ?? '', override_reason: ''
    })
    setShowForm(true); setError(null); setConflicts([])
  }

  const resetForm = () => setForm({
    activity_type: 'CLASS', room_id: '', personnel_id: '', section_ids: [],
    subject: '', exam_title: '', exam_type: '', modality: 'F2F',
    start_time: '08:00', end_time: '09:00', recurrence_pattern: 'MWF',
    recurrence_start_date: activeTerm?.semester?.start_date ?? '',
    recurrence_end_date: activeTerm?.semester?.end_date ?? '',
    day_of_week: null, notes: '', override_reason: ''
  })

  const getRoomName = (id: string | null) => rooms.find(r => r.id === id)?.room_code ?? '—'
  const getPersonnelName = (id: string | null) => { const p = personnel.find(x => x.id === id); return p ? `${p.last_name}, ${p.first_name}` : '—' }

  const draftEntries = entries.filter(e => e.status === 'DRAFT')

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

          {/* Row 1: Activity Type, Modality */}
          <div className="grid grid-cols-6 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Activity Type</label>
              <select value={form.activity_type} onChange={(e) => setForm({ ...form, activity_type: e.target.value as ActivityType })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
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

          {/* Row 2: Subject, Sections */}
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">Sections</label>
              <select multiple value={form.section_ids} onChange={(e) => setForm({ ...form, section_ids: Array.from(e.target.selectedOptions).map(o => o.value) })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none h-20">
                {sections.map(s => <option key={s.id} value={s.id}>{s.section_code}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3: Time, Recurrence */}
          <div className="grid grid-cols-6 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Start Time</label><input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">End Time</label><input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Pattern</label>
              <select value={form.recurrence_pattern} onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value as RecurrencePattern })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                {Object.entries(RECURRENCE_PATTERN_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">From Date</label><input type="date" value={form.recurrence_start_date} onChange={(e) => setForm({ ...form, recurrence_start_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">To Date</label><input type="date" value={form.recurrence_end_date} onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Override</label><input type="text" value={form.override_reason} onChange={(e) => setForm({ ...form, override_reason: e.target.value })} placeholder="Reason" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">{editingId ? 'Update' : 'Create Draft'}</button>
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
                const flagCount = JSON.parse(e.conflict_flags || '[]').length
                return (
                  <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3 text-surface-600">{ACTIVITY_TYPE_LABELS[e.activity_type]}</td>
                    <td className="px-4 py-3 font-medium text-surface-900">{e.subject ?? e.exam_title ?? '—'}</td>
                    <td className="px-4 py-3 text-surface-600">{getRoomName(e.room_id)}</td>
                    <td className="px-4 py-3 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                    <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                    <td className="px-4 py-3 text-surface-500 text-xs">{RECURRENCE_PATTERN_LABELS[e.recurrence_pattern] ?? e.recurrence_pattern}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span>
                      {flagCount > 0 && <span className="ml-1 inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{flagCount}</span>}
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
