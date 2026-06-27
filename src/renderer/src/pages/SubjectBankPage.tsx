import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ExportDropdown from '../components/ExportDropdown'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, SubjectBankEntry } from '@shared/types'

// Color palette for course cards — cycles if more courses than colors
const CARD_COLORS = [
  { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-600', text: 'text-blue-700', icon: 'text-blue-500', hoverBorder: 'hover:border-blue-400', ring: 'ring-blue-200' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-600', text: 'text-emerald-700', icon: 'text-emerald-500', hoverBorder: 'hover:border-emerald-400', ring: 'ring-emerald-200' },
  { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'bg-violet-600', text: 'text-violet-700', icon: 'text-violet-500', hoverBorder: 'hover:border-violet-400', ring: 'ring-violet-200' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-600', text: 'text-amber-700', icon: 'text-amber-500', hoverBorder: 'hover:border-amber-400', ring: 'ring-amber-200' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-600', text: 'text-rose-700', icon: 'text-rose-500', hoverBorder: 'hover:border-rose-400', ring: 'ring-rose-200' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'bg-cyan-600', text: 'text-cyan-700', icon: 'text-cyan-500', hoverBorder: 'hover:border-cyan-400', ring: 'ring-cyan-200' },
  { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-600', text: 'text-orange-700', icon: 'text-orange-500', hoverBorder: 'hover:border-orange-400', ring: 'ring-orange-200' },
  { bg: 'bg-indigo-50', border: 'border-indigo-200', accent: 'bg-indigo-600', text: 'text-indigo-700', icon: 'text-indigo-500', hoverBorder: 'hover:border-indigo-400', ring: 'ring-indigo-200' },
]

interface CourseGroup {
  course_program: string
  subjectCount: number
  yearLevels: string[]
  totalUnits: number
}

export default function SubjectBankPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const navigate = useNavigate()
  const [allSubjects, setAllSubjects] = useState<SubjectBankEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Card / drill-down state
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null)
  const [courseSearch, setCourseSearch] = useState('')

  // Detail view state
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 5
  const [filterYear, setFilterYear] = useState('')
  const [filterSemester, setFilterSemester] = useState('')

  // Form
  const [form, setForm] = useState({
    subject_code: '', subject_name: '', course_program: '',
    year_level: '', semester_type: '1ST' as string, lec_units: 0, lab_units: 0,
    pre_requisites: ''
  })
  const [error, setError] = useState<React.ReactNode | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Import state
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listSubjectBank({ department })) as IpcResponse<SubjectBankEntry[]>
    if (result.data) setAllSubjects(result.data)
    setLoading(false)
  }, [department])

  useEffect(() => { load() }, [load])

  // Derive distinct program names from existing subjects for autocomplete
  const existingPrograms = useMemo(() => {
    return [...new Set(allSubjects.map(s => s.course_program))].sort()
  }, [allSubjects])

  // Reset drill-down when department changes
  useEffect(() => {
    setSelectedCourse(null)
    setCourseSearch('')
    setSearch('')
    setFilterYear('')
    setFilterSemester('')
    setPage(0)
  }, [department])

  // Group subjects by course_program for the card view
  const courseGroups = useMemo<CourseGroup[]>(() => {
    const map = new Map<string, SubjectBankEntry[]>()
    for (const s of allSubjects) {
      const list = map.get(s.course_program) ?? []
      list.push(s)
      map.set(s.course_program, list)
    }
    return Array.from(map.entries())
      .map(([course_program, subjects]) => ({
        course_program,
        subjectCount: subjects.length,
        yearLevels: [...new Set(subjects.map(s => s.year_level))].sort(),
        totalUnits: subjects.reduce((sum, s) => sum + s.lec_units + s.lab_units, 0),
      }))
      .sort((a, b) => a.course_program.localeCompare(b.course_program))
  }, [allSubjects])

  // Filter course cards by search
  const filteredCourseGroups = useMemo(() => {
    if (!courseSearch.trim()) return courseGroups
    const q = courseSearch.toLowerCase()
    return courseGroups.filter(g => g.course_program.toLowerCase().includes(q))
  }, [courseGroups, courseSearch])

  // Subjects for the selected course (with detail-level filters applied)
  const filteredSubjects = useMemo(() => {
    if (!selectedCourse) return []
    let list = allSubjects.filter(s => s.course_program === selectedCourse)
    if (filterYear) list = list.filter(s => s.year_level === filterYear)
    if (filterSemester) list = list.filter(s => s.semester_type === filterSemester)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.subject_code.toLowerCase().includes(q) ||
        s.subject_name.toLowerCase().includes(q) ||
        (s.pre_requisites ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [allSubjects, selectedCourse, filterYear, filterSemester, search])

  // Year-level options for the selected course
  const yearOptionsForCourse = useMemo(() => {
    if (!selectedCourse) return []
    return [...new Set(allSubjects.filter(s => s.course_program === selectedCourse).map(s => s.year_level))].sort()
  }, [allSubjects, selectedCourse])

  const totalPages = Math.ceil(filteredSubjects.length / pageSize)
  const paginated = filteredSubjects.slice(page * pageSize, (page + 1) * pageSize)

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
    // Fetch impact counts before showing confirmation
    const impactResult = (await window.electronAPI.getSubjectBankDeleteImpact(id)) as IpcResponse<{ sectionCount: number }>
    const impact = impactResult.data ?? { sectionCount: 0 }

    const warningText = impact.sectionCount > 0
      ? `\n\nThis will also delete ${impact.sectionCount} section${impact.sectionCount > 1 ? 's' : ''} referencing this subject.`
      : ''

    const confirmed = await confirm({
      title: 'Delete Subject',
      message: `Are you sure you want to delete "${code}"?${warningText}\n\nThis action cannot be undone.`,
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
      course_program: s.course_program,
      year_level: s.year_level, semester_type: s.semester_type,
      lec_units: s.lec_units, lab_units: s.lab_units,
      pre_requisites: s.pre_requisites ?? ''
    })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({
    subject_code: '', subject_name: '', course_program: '',
    year_level: '', semester_type: '1ST', lec_units: 0, lab_units: 0,
    pre_requisites: ''
  })

  const openNewSubjectForm = () => {
    resetForm()
    // Pre-fill course_program when inside a course view
    if (selectedCourse) {
      setForm(f => ({ ...f, course_program: selectedCourse }))
    }
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  // Import handlers

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

  const handleBackToCourses = () => {
    setSelectedCourse(null)
    setSearch('')
    setFilterYear('')
    setFilterSemester('')
    setPage(0)
  }

  // ===================== RENDER =====================

  // --- Course cards view (default) ---
  if (!selectedCourse) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-end sticky top-0 z-10 bg-surface-50 pb-4 -mx-6 px-6 pt-4">
          <div className="flex gap-3">
            <input type="text" value={courseSearch} onChange={(e) => setCourseSearch(e.target.value)} placeholder="Search curriculum..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
            <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 transition-colors">
              {importLoading ? 'Processing...' : '📥 Import File'}
            </button>
            <ExportDropdown target="subjects" department={department} />
            <button onClick={openNewSubjectForm} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">+ New Subject</button>
          </div>
        </div>

        {/* Import feedback (same as before) */}
        {importError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        )}
        {importPreview && renderImportPreview()}
        {importResult && renderImportResult()}

        {/* Course cards grid */}
        {loading ? (
          <div className="text-center py-16 text-surface-400">Loading...</div>
        ) : filteredCourseGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
            </div>
            <p className="text-surface-500 font-medium">
              {courseSearch ? 'No matching curriculum found.' : 'No subjects yet.'}
            </p>
            <p className="text-surface-400 text-sm mt-1">
              {courseSearch ? 'Try a different search term.' : 'Click "+ New Subject" or import a file to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCourseGroups.map((group, idx) => {
              const color = CARD_COLORS[idx % CARD_COLORS.length]
              return (
                <button
                  key={group.course_program}
                  onClick={() => { setSelectedCourse(group.course_program); setPage(0) }}
                  className={`${color.bg} ${color.border} ${color.hoverBorder} border-2 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-md hover:ring-2 ${color.ring} hover:-translate-y-0.5 group focus:outline-none focus:ring-2 ${color.ring}`}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${color.accent} flex items-center justify-center shadow-sm`}>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    </div>
                    <svg className={`w-5 h-5 ${color.icon} opacity-0 group-hover:opacity-100 transition-opacity`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>

                  {/* Course name */}
                  <h3 className={`text-lg font-bold ${color.text} mb-1`}>{group.course_program}</h3>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <svg className={`w-4 h-4 ${color.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="text-sm font-semibold text-surface-700">{group.subjectCount}</span>
                      <span className="text-xs text-surface-500">subject{group.subjectCount !== 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-surface-300">·</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-surface-700">{group.totalUnits}</span>
                      <span className="text-xs text-surface-500">{department === 'SHS' ? 'hours' : 'units'}</span>
                    </div>
                  </div>

                  {/* Year levels */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.yearLevels.map(y => (
                      <span key={y} className="text-xs px-2 py-0.5 rounded-full bg-white/70 text-surface-600 font-medium border border-white/50">{y}</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Form modal (also accessible from card view) */}
        {showForm && renderFormModal()}
      </div>
    )
  }

  // --- Subjects detail view (selected course) ---
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToCourses}
            className="w-9 h-9 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-600 transition-colors"
            title="Back to all curriculum"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-surface-900">{selectedCourse}</h1>
        </div>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search subjects..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={openNewSubjectForm} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">+ New Subject</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <label className="text-sm font-medium text-surface-600">Filters:</label>
        <select value={filterYear} onChange={(e) => { setFilterYear(e.target.value); setPage(0) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Year Levels</option>
          {yearOptionsForCourse.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterSemester} onChange={(e) => { setFilterSemester(e.target.value); setPage(0) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Semesters</option>
          <option value="1ST">1st Semester</option>
          <option value="2ND">2nd Semester</option>
          {department === 'SHS' && <option value="3RD">3rd Semester</option>}
          <option value="SUMMER">Summer</option>
        </select>
        {(filterYear || filterSemester) && (
          <button onClick={() => { setFilterYear(''); setFilterSemester(''); setPage(0) }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">✕ Clear Filters</button>
        )}
      </div>

      {/* Import feedback */}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex justify-between items-center">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold">✕</button>
        </div>
      )}
      {importPreview && renderImportPreview()}
      {importResult && renderImportResult()}

      {/* Table */}
      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-400">No subjects found{(search || filterYear || filterSemester) ? ' matching filters.' : '.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Year</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Semester</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">{department === 'SHS' ? 'LEC Hrs' : 'LEC'}</th>
                <th className="text-center px-4 py-3 font-semibold text-surface-600">{department === 'SHS' ? 'LAB Hrs' : 'LAB'}</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Pre-req</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{s.subject_code}</td>
                  <td className="px-4 py-3 text-surface-600">{s.subject_name}</td>
                  <td className="px-4 py-3 text-surface-600">{s.year_level}</td>
                  <td className="px-4 py-3 text-surface-600">{s.semester_type === '1ST' ? '1st Sem' : s.semester_type === '2ND' ? '2nd Sem' : s.semester_type === '3RD' ? '3rd Sem' : 'Summer'}</td>
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
              <span className="text-sm text-surface-500">Page {page + 1} of {totalPages} · {filteredSubjects.length} total</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}

      {/* Form modal */}
      {showForm && renderFormModal()}
    </div>
  )

  // ===================== SHARED RENDER HELPERS =====================

  function renderFormModal() {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]" onClick={() => { setShowForm(false); setError(null) }}>
        <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[48rem] max-h-[85vh] overflow-y-auto animate-[modal-dialog-in_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-surface-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900">{editingId ? 'Edit' : 'New'} Subject</h2>
                <p className="text-xs text-surface-500">{editingId ? 'Update subject details below.' : 'Fill in the details to add a new subject.'}</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Subject Code <span className="text-surface-400 font-normal">(Optional)</span></label><input type="text" value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. CS101" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Subject Name</label><input type="text" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="e.g. Introduction to Computing" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Program</label><input type="text" list="program-suggestions" value={form.course_program} onChange={(e) => setForm({ ...form, course_program: e.target.value })} placeholder="e.g. BSIT, STEM" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /><datalist id="program-suggestions">{existingPrograms.map(p => <option key={p} value={p} />)}</datalist></div>
            </div>
            <div className="grid grid-cols-5 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Year Level</label><select value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none bg-white" required><option value="">Select year level</option>{(department === 'SHS' ? ['Grade 11', 'Grade 12'] : ['1st Year', '2nd Year', '3rd Year', '4th Year']).map(y => <option key={y} value={y}>{y}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Semester</label>
                <select value={form.semester_type} onChange={(e) => setForm({ ...form, semester_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="1ST">1st Semester</option>
                  <option value="2ND">2nd Semester</option>
                  <option value="SUMMER">Summer</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">{department === 'SHS' ? 'LEC Hours' : 'LEC Units'}</label><input type="number" value={form.lec_units} onChange={(e) => setForm({ ...form, lec_units: parseInt(e.target.value) || 0 })} min={0} max={20} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">{department === 'SHS' ? 'LAB Hours' : 'LAB Units'}</label><input type="number" value={form.lab_units} onChange={(e) => setForm({ ...form, lab_units: parseInt(e.target.value) || 0 })} min={0} max={20} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Pre-requisites</label><input type="text" value={form.pre_requisites} onChange={(e) => setForm({ ...form, pre_requisites: e.target.value })} placeholder="e.g. CS100, MATH101" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
              <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm transition-colors">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  function renderImportPreview() {
    if (!importPreview) return null
    return (
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
    )
  }

  function renderImportResult() {
    if (!importResult) return null
    return (
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
    )
  }
}
