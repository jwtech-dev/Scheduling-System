import { useState, useEffect, useCallback, useMemo } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Section, SubjectBankEntry } from '@shared/types'

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

  // Subject Bank integration
  const [subjectBankItems, setSubjectBankItems] = useState<SubjectBankEntry[]>([])
  const [subjectSearch, setSubjectSearch] = useState('')
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Import state
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listSections({ department, search: search || undefined })) as IpcResponse<Section[]>
    if (result.error) console.error('[SectionsPage] listSections error:', result.error)
    if (result.data) setSections(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { load() }, [load])

  // Load subject bank for dropdown and preview
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.listSubjectBank({ department })) as IpcResponse<SubjectBankEntry[]>
      if (result.data) setSubjectBankItems(result.data)
    })()
  }, [department])

  // Auto-matched subjects from Subject Bank (for create mode only)
  const matchedSubjects = useMemo(() => {
    if (editingId) return []
    const programKey = department === 'SHS' ? form.strand_track : form.course_program
    if (!programKey || !form.year_level) return []
    return subjectBankItems.filter(
      s => s.course_program === programKey && s.year_level === form.year_level
    )
  }, [subjectBankItems, department, form.course_program, form.strand_track, form.year_level, editingId])

  // Group matched subjects by semester type
  const subjectsBySemester = useMemo(() => {
    const groups: Record<string, SubjectBankEntry[]> = {}
    for (const s of matchedSubjects) {
      if (!groups[s.semester_type]) groups[s.semester_type] = []
      groups[s.semester_type].push(s)
    }
    return groups
  }, [matchedSubjects])

  const totalMatchedCount = matchedSubjects.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    setIsSubmitting(true)
    try {
      if (editingId) {
        // Edit mode — single section update (keeps subject dropdown)
        const payload = { id: editingId, ...form, department, student_count: Number(form.student_count) }
        const result = (await window.electronAPI.updateSection(payload)) as IpcResponse
        if (result.error) { setError(result.error.message); return }
        toast.success('Section updated successfully')
      } else {
        // Create mode — batch create with auto-populated subjects
        if (!form.academic_year_id) { setError('No active academic year. Set an active term first.'); return }
        if (totalMatchedCount === 0) { setError(`No subjects found in Subject Bank for ${department === 'SHS' ? form.strand_track : form.course_program} / ${form.year_level}. Add subjects to the Subject Bank first.`); return }
        const payload = {
          department,
          section_code: form.section_code,
          section_name: form.section_name || undefined,
          strand_track: form.strand_track || undefined,
          course_program: form.course_program || undefined,
          year_level: form.year_level,
          student_count: Number(form.student_count),
          academic_year_id: form.academic_year_id
        }
        const result = (await window.electronAPI.createSectionBatch(payload)) as IpcResponse<{ created: number; skipped: number; entries: Section[]; skipped_semesters: string[] }>
        if (result.error) { setError(result.error.message); return }
        const data = result.data!
        let msg = `${data.created} section entries created`
        if (data.skipped > 0) msg += `, ${data.skipped} skipped (duplicates or missing semesters)`
        if (data.skipped_semesters.length > 0) msg += `. Note: ${data.skipped_semesters.join(', ')} semester(s) not found in this academic year.`
        toast.success(msg)
      }
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

  // ── Import handlers ──────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    const res = (await window.electronAPI.downloadImportTemplate('SECTIONS')) as IpcResponse<{ success: boolean }>
    if (res.error) toast.error(res.error.message)
    else toast.success('Template saved')
  }

  const handleImportUpload = async () => {
    setImportError(null); setImportResult(null); setImportPreview(null); setImportLoading(true)
    const res = (await window.electronAPI.uploadImport({
      target: 'SECTIONS',
      department,
      academic_year_id: form.academic_year_id,
      semester_id: form.semester_id
    })) as IpcResponse<typeof importPreview & { total_rows?: number }>
    if (res.error) { setImportError(res.error.message); setImportLoading(false); return }
    if (res.data) {
      setImportPreview({
        headers: res.data.headers ?? [],
        rows: (res.data as { preview?: Record<string, string>[] }).preview ?? res.data.rows ?? [],
        total: res.data.total_rows ?? res.data.total ?? 0,
        file_name: res.data.file_name ?? '',
        parsed: res.data.parsed ?? []
      })
    }
    setImportLoading(false)
  }

  const handleImportCommit = async () => {
    if (!importPreview) return
    if (!form.academic_year_id || !form.semester_id) { setImportError('No active term set. Go to Academic Years to activate a term first.'); return }
    setImportLoading(true); setImportError(null)
    const res = (await window.electronAPI.commitImport({
      target: 'SECTIONS',
      parsed: importPreview.parsed,
      file_name: importPreview.file_name,
      department,
      academic_year_id: form.academic_year_id,
      semester_id: form.semester_id
    })) as IpcResponse<{ created: number; updated: number; skipped: number; errors: string[] }>
    if (res.error) { setImportError(res.error.message); setImportLoading(false); return }
    if (res.data) setImportResult(res.data)
    setImportPreview(null); setImportLoading(false)
    load()
  }

  const handleCancelImport = () => { setImportPreview(null); setImportResult(null); setImportError(null) }

  // Semester type labels for display
  const semLabel = (type: string) => {
    if (type === '1ST') return '1st Semester'
    if (type === '2ND') return '2nd Semester'
    if (type === 'SUMMER') return 'Summer'
    return type
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Sections</h1>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search sections..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium" title="Download Excel template">📥 Template</button>
          <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
            {importLoading ? 'Processing...' : '📥 Import File'}
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Section</button>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600 ml-2">✕</button>
        </div>
      )}

      {/* Import preview */}
      {importPreview && (
        <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-amber-800">📥 Import Preview — {importPreview.file_name} ({importPreview.total} rows)</h2>
            <div className="flex gap-2">
              <button onClick={handleCancelImport} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button onClick={handleImportCommit} disabled={importLoading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
                {importLoading ? 'Importing...' : `✓ Import ${importPreview.total} Rows`}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-amber-50 border-b border-amber-200"><tr>
                {importPreview.headers.map(h => <th key={h} className="text-left px-3 py-2 font-semibold text-amber-700">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-surface-100">
                {importPreview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    {importPreview.headers.map(h => <td key={h} className="px-3 py-2 text-surface-600 truncate max-w-32">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {importPreview.total > 10 && <p className="text-xs text-surface-400">Showing first 10 of {importPreview.total} rows</p>}
        </div>
      )}

      {/* Import result */}
      {importResult && (
        <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-700">✓ Import Complete</h2>
            <button onClick={() => setImportResult(null)} className="text-surface-400 hover:text-surface-600 text-sm">Dismiss</button>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-700">{importResult.created}</div><div className="text-xs text-green-600">Created</div></div>
            <div className="p-3 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-700">{importResult.updated}</div><div className="text-xs text-blue-600">Updated</div></div>
            <div className="p-3 bg-amber-50 rounded-lg text-center"><div className="text-2xl font-bold text-amber-700">{importResult.skipped}</div><div className="text-xs text-amber-600">Skipped</div></div>
          </div>
          {importResult.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Errors ({importResult.errors.length})</h3>
              <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-auto">
                {importResult.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Section</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section Code</label><input type="text" value={form.section_code} onChange={(e) => setForm({ ...form, section_code: e.target.value })} placeholder="e.g. BSIT-3A, STEM-1B" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Section Name</label><input type="text" value={form.section_name} onChange={(e) => setForm({ ...form, section_name: e.target.value })} placeholder="e.g. Block A - Morning" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">{department === 'SHS' ? 'Strand/Track' : 'Course/Program'}</label><input type="text" value={department === 'SHS' ? form.strand_track : form.course_program} onChange={(e) => setForm({ ...form, [department === 'SHS' ? 'strand_track' : 'course_program']: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Year Level</label><input type="text" value={form.year_level} onChange={(e) => setForm({ ...form, year_level: e.target.value })} placeholder="e.g. 1st Year, Grade 11" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
          </div>

          {/* Row 2: Edit mode shows subject picker; Create mode shows student count only */}
          <div className="grid grid-cols-4 gap-4">
            {editingId ? (
              /* Edit mode — keep single subject picker */
              <div className="col-span-3 relative">
                <label className="block text-sm font-medium text-surface-700 mb-1">Subject</label>
                <input type="text" value={subjectSearch || form.subject} onChange={(e) => { setSubjectSearch(e.target.value); setForm({ ...form, subject: e.target.value }); setShowSubjectDropdown(true) }} onFocus={() => setShowSubjectDropdown(true)} onBlur={() => setTimeout(() => setShowSubjectDropdown(false), 200)} placeholder="Search or type subject..." className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                {showSubjectDropdown && (() => {
                  const q = (subjectSearch || form.subject).toLowerCase()
                  const filtered = subjectBankItems.filter(s => !q || s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q)).slice(0, 12)
                  return filtered.length > 0 ? (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filtered.map(s => (
                        <button key={s.id} type="button" onMouseDown={() => { setForm({ ...form, subject: s.subject_name }); setSubjectSearch(''); setShowSubjectDropdown(false) }} className="w-full text-left px-3 py-2 hover:bg-primary-50 text-sm flex justify-between items-center">
                          <span className="text-surface-800">{s.subject_name}</span>
                          <span className="text-xs text-surface-400">{s.subject_code} · {s.year_level} · {s.semester_type}</span>
                        </button>
                      ))}
                    </div>
                  ) : null
                })()}
              </div>
            ) : (
              /* Create mode — no subject picker, just spacer */
              <div className="col-span-3" />
            )}
            <div><label className="block text-sm font-medium text-surface-700 mb-1">No. of Students</label><input type="number" value={form.student_count} onChange={(e) => setForm({ ...form, student_count: parseInt(e.target.value) || 0 })} placeholder="30" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={1} /></div>
          </div>

          {/* Auto-populated subject preview (create mode only) */}
          {!editingId && (department === 'SHS' ? form.strand_track : form.course_program) && form.year_level && (
            <div className={`p-4 rounded-lg border ${totalMatchedCount > 0 ? 'bg-primary-50 border-primary-200' : 'bg-amber-50 border-amber-200'}`}>
              <h3 className={`text-sm font-semibold mb-2 ${totalMatchedCount > 0 ? 'text-primary-800' : 'text-amber-800'}`}>
                {totalMatchedCount > 0
                  ? `📚 ${totalMatchedCount} subjects found — will create ${totalMatchedCount} section entries`
                  : '⚠ No subjects found in Subject Bank'}
              </h3>
              {totalMatchedCount > 0 ? (
                <div className="space-y-2">
                  {Object.entries(subjectsBySemester).sort(([a], [b]) => a.localeCompare(b)).map(([semType, subjects]) => (
                    <div key={semType}>
                      <div className="text-xs font-semibold text-primary-700 mb-1">
                        {semType === '1ST' ? '📗' : semType === '2ND' ? '📘' : '📙'} {semLabel(semType)} ({subjects.length} subjects)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map(s => (
                          <span key={s.id} className="inline-flex items-center px-2 py-0.5 rounded bg-white border border-primary-100 text-xs text-surface-700">
                            {s.subject_name}
                            {s.subject_code ? <span className="ml-1 text-surface-400">({s.subject_code})</span> : null}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-700">
                  No subjects match <strong>{department === 'SHS' ? form.strand_track : form.course_program}</strong> / <strong>{form.year_level}</strong> in the Subject Bank.
                  Add subjects there first, then come back to create sections.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || (!editingId && totalMatchedCount === 0 && !!(department === 'SHS' ? form.strand_track : form.course_program) && !!form.year_level)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium"
            >
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : totalMatchedCount > 0 ? `Create ${totalMatchedCount} Section Entries` : 'Create'}
            </button>
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
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Subject</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Year Level</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Students</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {sections.map((s) => (
                <tr key={s.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{s.section_code}</td>
                  <td className="px-4 py-3 text-surface-600">{s.section_name ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{department === 'SHS' ? s.strand_track ?? '—' : s.course_program ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{s.subject ?? '—'}</td>
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
