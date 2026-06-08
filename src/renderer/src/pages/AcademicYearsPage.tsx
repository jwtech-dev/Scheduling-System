import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, AcademicYear, Semester, SemesterType } from '@shared/types'
import { SHS_SEMESTER_TYPES, COLLEGE_SEMESTER_TYPES } from '@shared/constants'

export default function AcademicYearsPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', start_date: '', end_date: '', is_active: false })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Semester state
  const [expandedYear, setExpandedYear] = useState<string | null>(null)
  const [semesters, setSemesters] = useState<Record<string, Semester[]>>({})
  const [semForm, setSemForm] = useState({ semester_type: '1ST_SEMESTER' as string, start_date: '', end_date: '' })
  const [showSemForm, setShowSemForm] = useState(false)
  const [semError, setSemError] = useState<string | null>(null)
  const [isSemSubmitting, setIsSemSubmitting] = useState(false)

  const loadYears = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listAcademicYears(department)) as IpcResponse<AcademicYear[]>
    if (result.data) setYears(result.data)
    setLoading(false)
  }, [department])

  useEffect(() => { loadYears() }, [loadYears])

  const loadSemesters = async (ayId: string) => {
    const result = (await window.electronAPI.getAcademicYearSemesters(ayId)) as IpcResponse<Semester[]>
    if (result.data) setSemesters(prev => ({ ...prev, [ayId]: result.data! }))
  }

  const toggleExpand = async (ayId: string) => {
    if (expandedYear === ayId) { setExpandedYear(null); return }
    setExpandedYear(ayId)
    setShowSemForm(false)
    setSemError(null)
    await loadSemesters(ayId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const payload = { ...form, department, is_active: form.is_active }
      const result = editingId
        ? (await window.electronAPI.updateAcademicYear({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createAcademicYear(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Academic year updated' : 'Academic year created')
      setShowForm(false); setEditingId(null); setForm({ label: '', start_date: '', end_date: '', is_active: false })
      loadYears()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSemError(null)
    if (!expandedYear) return
    setIsSemSubmitting(true)
    try {
      const payload = { ...semForm, academic_year_id: expandedYear, department }
      const result = (await window.electronAPI.createSemester(payload)) as IpcResponse
      if (result.error) { setSemError(result.error.message); return }
      toast.success('Semester created')
      setShowSemForm(false)
      setSemForm({ semester_type: '1ST_SEMESTER', start_date: '', end_date: '' })
      await loadSemesters(expandedYear)
    } finally {
      setIsSemSubmitting(false)
    }
  }

  const handleDelete = async (ay: AcademicYear) => {
    const semCount = semesters[ay.id]?.length ?? 0
    const confirmed = await confirm({
      title: 'Delete Academic Year',
      message: `Are you sure you want to delete "${ay.label}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: semCount > 0
        ? `This will also delete ${semCount} semester${semCount > 1 ? 's' : ''} and all associated schedule entries.`
        : 'All associated schedule entries and sections referencing this academic year will be affected.'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteAcademicYear(ay.id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Academic year deleted'); loadYears() }
  }

  const startEdit = (ay: AcademicYear) => {
    setEditingId(ay.id); setForm({ label: ay.label, start_date: ay.start_date, end_date: ay.end_date, is_active: !!ay.is_active })
    setShowForm(true); setError(null)
  }

  const semesterTypes = department === 'SHS' ? SHS_SEMESTER_TYPES : COLLEGE_SEMESTER_TYPES

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Academic Years</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: '', start_date: '', end_date: '', is_active: false }); setError(null) }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
          + New Academic Year
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Academic Year</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Label</label>
              <input type="text" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. 2025-2026"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="rounded border-surface-300 text-primary-600 focus:ring-primary-500" />
            Set as active
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading...</div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 text-surface-400">No academic years yet. Create one to get started.</div>
      ) : (
        <div className="space-y-3">
          {years.map((ay) => (
            <div key={ay.id} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
              {/* AY Row */}
              <div className="flex items-center px-4 py-3 cursor-pointer hover:bg-surface-50 transition-colors" onClick={() => toggleExpand(ay.id)}>
                <svg className={`w-4 h-4 mr-2 text-surface-400 transition-transform ${expandedYear === ay.id ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <span className="font-medium text-surface-900 w-40">{ay.label}</span>
                <span className="text-surface-500 text-sm w-32">{ay.start_date}</span>
                <span className="text-surface-500 text-sm w-32">{ay.end_date}</span>
                <span className="flex-1" />
                {ay.is_active ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 mr-3">Active</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500 mr-3">Inactive</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); startEdit(ay) }} className="text-primary-600 hover:text-primary-800 text-sm font-medium mr-2">Edit</button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(ay) }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
              </div>

              {/* Expanded: Semesters */}
              {expandedYear === ay.id && (
                <div className="border-t border-surface-200 bg-surface-50 px-6 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-700">Semesters</h3>
                    <button onClick={() => { setShowSemForm(true); setSemError(null) }} className="text-xs font-medium text-primary-600 hover:text-primary-800">+ Add Semester</button>
                  </div>

                  {(semesters[ay.id] ?? []).length === 0 && !showSemForm && (
                    <p className="text-sm text-surface-400">No semesters yet. Add one to enable sections and scheduling.</p>
                  )}

                  {(semesters[ay.id] ?? []).map((sem) => (
                    <div key={sem.id} className="flex items-center gap-4 bg-white px-4 py-2.5 rounded-lg border border-surface-200 text-sm">
                      <span className="font-medium text-surface-800 w-36">{sem.semester_type.replace(/_/g, ' ')}</span>
                      <span className="text-surface-500">{sem.start_date} — {sem.end_date}</span>
                      <span className="flex-1" />
                      {sem.status === 'DRAFT' ? (
                        <>
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Draft</span>
                          <button
                            onClick={async () => {
                              const result = (await window.electronAPI.publishSemester(sem.id)) as IpcResponse
                              if (result.error) {
                                toast.error(result.error.message)
                              } else {
                                toast.success('Semester published and activated')
                                await loadSemesters(ay.id)
                                loadYears()
                              }
                            }}
                            className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                          >
                            Publish
                          </button>
                        </>
                      ) : sem.is_active ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
                      )}
                    </div>
                  ))}

                  {showSemForm && (
                    <form onSubmit={handleSemSubmit} className="bg-white p-4 rounded-lg border border-surface-200 space-y-3">
                      {semError && <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{semError}</div>}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-surface-700 mb-1">Type</label>
                          <select value={semForm.semester_type} onChange={(e) => setSemForm({ ...semForm, semester_type: e.target.value })} className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                            {semesterTypes.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-surface-700 mb-1">Start</label>
                          <input type="date" value={semForm.start_date} onChange={(e) => setSemForm({ ...semForm, start_date: e.target.value })} className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-surface-700 mb-1">End</label>
                          <input type="date" value={semForm.end_date} onChange={(e) => setSemForm({ ...semForm, end_date: e.target.value })} className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={isSemSubmitting} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:bg-primary-400">{isSemSubmitting ? 'Creating...' : 'Create Semester'}</button>
                        <button type="button" onClick={() => setShowSemForm(false)} className="px-3 py-1.5 bg-surface-100 text-surface-700 rounded-lg text-xs font-medium hover:bg-surface-200">Cancel</button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
