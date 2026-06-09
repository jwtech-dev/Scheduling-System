import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Section } from '@shared/types'

export default function SectionsPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ section_code: '', section_name: '', strand_track: '', subject: '', course_program: '', year_level: '', student_count: 30, academic_year_id: '', semester_id: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listSections({ department, search: search || undefined })) as IpcResponse<Section[]>
    if (result.data) setSections(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    setIsSubmitting(true)
    try {
      const payload = { ...form, department, student_count: Number(form.student_count) }
      if (!payload.academic_year_id || !payload.semester_id) { setError('Academic year and semester are required. Set an active term first.'); return }
      const result = editingId
        ? (await window.electronAPI.updateSection({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createSection(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Section updated successfully' : 'Section created successfully')
      setShowForm(false); setEditingId(null); resetForm(); load()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirm({
      title: 'Delete Section',
      message: `Are you sure you want to delete "${code}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: 'Schedule entries referencing this section will be affected.'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteSection(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Section deleted'); load() }
  }

  // Auto-resolve active term for new entries
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.getActiveTerm(department)) as IpcResponse<{ academicYear: { id: string } | null; semester: { id: string } | null }>
      if (result.data?.academicYear && result.data?.semester) {
        setForm(f => ({ ...f, academic_year_id: result.data!.academicYear!.id, semester_id: result.data!.semester!.id }))
      }
    })()
  }, [department])

  const startEdit = (s: Section) => {
    setEditingId(s.id); setForm({ section_code: s.section_code, section_name: s.section_name ?? '', strand_track: s.strand_track ?? '', subject: s.subject ?? '', course_program: s.course_program ?? '', year_level: s.year_level ?? '', student_count: s.student_count, academic_year_id: s.academic_year_id, semester_id: s.semester_id })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm(f => ({ ...f, section_code: '', section_name: '', strand_track: '', subject: '', course_program: '', year_level: '', student_count: 30 }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Sections</h1>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Section</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Section</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section Code</label><input type="text" value={form.section_code} onChange={(e) => setForm({ ...form, section_code: e.target.value })} placeholder="e.g. BSIT-3A, STEM-1B" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section Name</label><input type="text" value={form.section_name} onChange={(e) => setForm({ ...form, section_name: e.target.value })} placeholder="e.g. Block A - Morning" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">{department === 'SHS' ? 'Strand/Track' : 'Course/Program'}</label><input type="text" value={department === 'SHS' ? form.strand_track : form.course_program} onChange={(e) => setForm({ ...form, [department === 'SHS' ? 'strand_track' : 'course_program']: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year Level</label><input type="text" value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })} placeholder="e.g. 1st Year, Grade 11" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">No. of Students</label><input type="number" value={form.student_count} onChange={(e) => setForm({ ...form, student_count: parseInt(e.target.value) || 0 })} placeholder="30" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={0} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : sections.length === 0 ? <div className="text-center py-12 text-surface-400">No sections yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Section Code</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Section Name</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">{department === 'SHS' ? 'Strand / Track' : 'Course / Program'}</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Year Level</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">No. of Students</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {sections.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{s.section_code}</td>
                  <td className="px-4 py-3 text-surface-600">{s.section_name ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{department === 'SHS' ? s.strand_track ?? '—' : s.course_program ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{s.year_level ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{s.student_count}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{s.status}</span></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(s)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(s.id, s.section_code)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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
