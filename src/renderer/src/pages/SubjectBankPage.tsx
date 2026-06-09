import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, SubjectBankEntry } from '@shared/types'

export default function SubjectBankPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [subjects, setSubjects] = useState<SubjectBankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 25

  // Filters
  const [filterCourse, setFilterCourse] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterSemester, setFilterSemester] = useState('')

  // Form
  const [form, setForm] = useState({
    subject_code: '', subject_name: '', description: '', course_program: '',
    year_level: '', semester_type: '1ST' as string, lec_units: 0, lab_units: 0,
    pre_requisites: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Import state
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, string> = { department }
    if (filterCourse) filters.course_program = filterCourse
    if (filterYear) filters.year_level = filterYear
    if (filterSemester) filters.semester_type = filterSemester
    if (search) filters.search = search
    const result = (await window.electronAPI.listSubjectBank(filters)) as IpcResponse<SubjectBankEntry[]>
    if (result.data) setSubjects(result.data)
    setLoading(false)
  }, [department, filterCourse, filterYear, filterSemester, search])

  useEffect(() => { load(); setPage(0) }, [load])

  // Derive unique filter options from loaded data
  const allSubjects = subjects
  const courseOptions = [...new Set(allSubjects.map(s => s.course_program))].sort()
  const yearOptions = [...new Set(allSubjects.map(s => s.year_level))].sort()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    setIsSubmitting(true)
    try {
      const payload = { ...form, department, lec_units: Number(form.lec_units), lab_units: Number(form.lab_units) }
      const result = editingId
        ? (await window.electronAPI.updateSubjectBank({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createSubjectBank(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Subject updated' : 'Subject created')
      setShowForm(false); setEditingId(null); resetForm(); load()
    } finally { setIsSubmitting(false) }
  }

  const handleDelete = async (id: string, code: string) => {
    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${code}"?`,
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteSubjectBank(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Subject deleted'); load() }
  }

  const startEdit = (s: SubjectBankEntry) => {
    setEditingId(s.id)
    setForm({
      subject_code: s.subject_code, subject_name: s.subject_name,
      description: s.description ?? '', course_program: s.course_program,
      year_level: s.year_level, semester_type: s.semester_type,
      lec_units: s.lec_units, lab_units: s.lab_units,
      pre_requisites: s.pre_requisites ?? ''
    })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({
    subject_code: '', subject_name: '', description: '', course_program: '',
    year_level: '', semester_type: '1ST', lec_units: 0, lab_units: 0,
    pre_requisites: ''
  })

  // Import handlers
  const handleDownloadTemplate = async () => {
    const res = (await window.electronAPI.downloadImportTemplate('SUBJECT_BANK')) as IpcResponse
    if (res.data) toast.success('Template saved')
  }

  const handleImportUpload = async () => {
    setImportLoading(true); setImportError(null); setImportResult(null)
    try {
      const res = (await window.electronAPI.uploadImport({ target: 'SUBJECT_BANK', department })) as IpcResponse<Record<string, unknown>>
      if (res.error) { setImportError(res.error.message); setImportLoading(false); return }
      if (!res.data) { setImportLoading(false); return }
      const d = res.data as Record<string, unknown>
      if (!(d as Record<string, unknown>).success) { setImportLoading(false); return }
      setImportPreview({
        headers: (d.headers as string[]) ?? [],
        rows: ((d.preview ?? d.rows) as Record<string, string>[]) ?? [],
        total: (d.total_rows ?? d.total) as number ?? 0,
        file_name: (d.file_name as string) ?? '',
        parsed: (d.parsed as Record<string, string>[]) ?? []
      })
    } catch (err) { setImportError((err as Error).message) }
    finally { setImportLoading(false) }
  }

  const handleImportCommit = async () => {
    if (!importPreview) return
    setImportLoading(true)
    try {
      const res = (await window.electronAPI.commitImport({ target: 'SUBJECT_BANK', parsed: importPreview.parsed, file_name: importPreview.file_name, department })) as IpcResponse<Record<string, unknown>>
      if (res.error) { setImportError(res.error.message); return }
      const d = res.data as Record<string, unknown>
      setImportResult({ created: (d.created as number) ?? 0, updated: (d.updated as number) ?? 0, skipped: (d.skipped as number) ?? 0, errors: (d.errors as string[]) ?? [] })
      setImportPreview(null); load()
    } catch (err) { setImportError((err as Error).message) }
    finally { setImportLoading(false) }
  }

  const handleCancelImport = () => { setImportPreview(null); setImportResult(null); setImportError(null) }

  const totalPages = Math.ceil(subjects.length / pageSize)
  const paginated = subjects.slice(page * pageSize, (page + 1) * pageSize)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Subject Bank</h1>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search subjects..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium" title="Download template">📄 Template</button>
          <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
            {importLoading ? 'Processing...' : '📥 Import File'}
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Subject</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium text-surface-600">Filters:</label>
        <select value={filterCourse} onChange={(e) => { setFilterCourse(e.target.value); setPage(0) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Courses/Programs</option>
          {courseOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(0) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Year Levels</option>
          {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterSemester} onChange={(e) => { setFilterSemester(e.target.value); setPage(0) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Semesters</option>
          <option value="1ST">1st Semester</option>
          <option value="2ND">2nd Semester</option>
          <option value="SUMMER">Summer</option>
        </select>
        {(filterCourse || filterYear || filterSemester) && (
          <button onClick={() => { setFilterCourse(''); setFilterYear(''); setFilterSemester(''); setPage(0) }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">✕ Clear Filters</button>
        )}
      </div>

      {/* Import error */}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}

      {/* Import preview */}
      {importPreview && (
        <div className="bg-white p-4 rounded-xl border-2 border-amber-400 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-surface-900">📋 Import Preview — {importPreview.file_name} ({importPreview.total} rows)</h3>
            <div className="flex gap-2">
              <button onClick={handleCancelImport} className="px-3 py-1.5 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button onClick={handleImportCommit} disabled={importLoading} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">{importLoading ? 'Importing...' : '✓ Import'}</button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-amber-50"><tr>{importPreview.headers.map(h => <th key={h} className="text-left px-2 py-1 font-semibold text-amber-800">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-surface-100">
                {importPreview.rows.map((row, i) => (
                  <tr key={i}>{importPreview.headers.map(h => <td key={h} className="px-2 py-1 text-surface-600">{row[h] ?? ''}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-green-800">✅ Import Complete</h3>
            <button onClick={() => setImportResult(null)} className="text-green-600 hover:text-green-800 font-bold">✕</button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="text-green-700">Created: <strong>{importResult.created}</strong></span>
            <span className="text-blue-700">Updated: <strong>{importResult.updated}</strong></span>
            <span className="text-surface-500">Skipped: <strong>{importResult.skipped}</strong></span>
          </div>
          {importResult.errors.length > 0 && (
            <div className="text-sm text-red-600">{importResult.errors.map((e, i) => <div key={i}>• {e}</div>)}</div>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Subject</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Subject Code</label><input type="text" value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. CS101" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Subject Name</label><input type="text" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="e.g. Introduction to Computing" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Course/Program</label><input type="text" value={form.course_program} onChange={(e) => setForm({ ...form, course_program: e.target.value })} placeholder="e.g. BSIT, STEM" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
          </div>
          <div className="grid grid-cols-5 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year Level</label><input type="text" value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })} placeholder="e.g. 1st Year" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Semester</label>
              <select value={form.semester_type} onChange={(e) => setForm({ ...form, semester_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="1ST">1st Semester</option>
                <option value="2ND">2nd Semester</option>
                <option value="SUMMER">Summer</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">LEC Units</label><input type="number" value={form.lec_units} onChange={(e) => setForm({ ...form, lec_units: parseInt(e.target.value) || 0 })} min={0} max={20} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">LAB Units</label><input type="number" value={form.lab_units} onChange={(e) => setForm({ ...form, lab_units: parseInt(e.target.value) || 0 })} min={0} max={20} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Pre-requisites</label><input type="text" value={form.pre_requisites} onChange={(e) => setForm({ ...form, pre_requisites: e.target.value })} placeholder="e.g. CS100, MATH101" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Description</label><input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : subjects.length === 0 ? <div className="text-center py-12 text-surface-400">No subjects yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Course/Program</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Year</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Semester</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">LEC</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">LAB</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Pre-req</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{s.subject_code}</td>
                  <td className="px-4 py-3 text-surface-600">{s.subject_name}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">{s.course_program}</span></td>
                  <td className="px-4 py-3 text-surface-600">{s.year_level}</td>
                  <td className="px-4 py-3 text-surface-600">{s.semester_type === '1ST' ? '1st Sem' : s.semester_type === '2ND' ? '2nd Sem' : 'Summer'}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{s.lec_units}</td>
                  <td className="px-4 py-3 text-center text-surface-600">{s.lab_units}</td>
                  <td className="px-4 py-3 text-surface-500 text-xs">{s.pre_requisites ?? '—'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(s)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(s.id, s.subject_code)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Previous</button>
              <span className="text-sm text-surface-500">Page {page + 1} of {totalPages} · {subjects.length} total</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
