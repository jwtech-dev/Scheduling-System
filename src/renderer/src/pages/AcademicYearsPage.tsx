import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, AcademicYear, GradeLevel } from '@shared/types'
import { GRADE_LEVEL_LABELS, GRADE_LEVELS } from '@shared/constants'

const CARDS_PER_ROW = 5
const ROWS_PER_PAGE = 3
const PAGE_SIZE = CARDS_PER_ROW * ROWS_PER_PAGE // 15

export default function AcademicYearsPage(): JSX.Element {
  const { department } = useDepartment()
  const navigate = useNavigate()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<{
    label: string; start_date: string; end_date: string; grade_level: GradeLevel | ''
  }>({ label: '', start_date: '', end_date: '', grade_level: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  /** Derive academic year label from start date: '2025-06-01' → '2025–2026' */
  const deriveLabel = (startDate: string): string => {
    if (!startDate) return ''
    const year = new Date(startDate).getFullYear()
    return `${year}–${year + 1}`
  }

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)

  const loadYears = useCallback(async () => {
    setLoading(true)
    // Auto-complete expired AYs before loading the list
    await window.electronAPI.autoCompleteAcademicYears()
    const result = (await window.electronAPI.listAcademicYears(department)) as IpcResponse<AcademicYear[]>
    if (result.data) setYears(result.data)
    setLoading(false)
  }, [department])

  useEffect(() => { loadYears() }, [loadYears])

  // Reset to page 1 when department changes
  useEffect(() => { setCurrentPage(1) }, [department])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(years.length / PAGE_SIZE))
  const paginatedYears = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return years.slice(start, start + PAGE_SIZE)
  }, [years, currentPage])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const payload: Record<string, unknown> = { label: form.label, start_date: form.start_date, end_date: form.end_date, department, ...(department === 'SHS' && form.grade_level ? { grade_level: form.grade_level } : {}) }
      const result = editingId
        ? (await window.electronAPI.updateAcademicYear({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createAcademicYear(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Academic year updated' : 'Academic year created')
      setShowForm(false); setEditingId(null)
      setForm({ label: '', start_date: '', end_date: '', grade_level: '' })
      loadYears()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (ay: AcademicYear) => {
    const confirmed = await confirm({
      title: 'Delete Academic Year',
      message: `Are you sure you want to delete "${ay.label}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: 'All associated schedule entries and sections referencing this academic year will be affected.'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteAcademicYear(ay.id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Academic year deleted'); loadYears() }
  }

  const handlePublishAY = async (ay: AcademicYear) => {
    const result = (await window.electronAPI.publishAcademicYear(ay.id)) as IpcResponse
    if (result.error) {
      toast.error(result.error.message)
    } else {
      toast.success('Academic year published and activated')
      loadYears()
    }
  }

  const startEdit = (ay: AcademicYear) => {
    setEditingId(ay.id)
    setForm({
      label: ay.label, start_date: ay.start_date, end_date: ay.end_date,
      grade_level: (ay.grade_level as GradeLevel) || ''
    })
    setShowForm(true); setError(null)
  }

  // Status helpers
  const getStatusBadge = (ay: AcademicYear) => {
    if (ay.status === 'DRAFT') {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Draft</span>
    }
    if (ay.status === 'COMPLETED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          Completed
        </span>
      )
    }
    if (ay.is_active) {
      return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
    }
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
  }

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  // Generate page numbers for pagination
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | 'ellipsis')[] = [1]
    if (currentPage > 3) pages.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between sticky top-0 z-10 bg-surface-50 pb-4 -mx-6 px-6 pt-4">
        <div>
          <p className="text-sm text-surface-500 mt-0.5">
            {years.length} academic year{years.length !== 1 ? 's' : ''}
            {totalPages > 1 && <span> · Page {currentPage} of {totalPages}</span>}
          </p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ label: '', start_date: '', end_date: '', grade_level: '' }); setError(null) }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm">
          + New Academic Year
        </button>
      </div>

      {/* Modal Overlay for New/Edit Academic Year */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowForm(false); setError(null) }} />
          {/* Modal */}
          <form onSubmit={handleSubmit} className="relative bg-white p-6 rounded-xl border border-surface-200 shadow-xl space-y-4 w-full max-w-lg mx-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">{editingId ? 'Edit' : 'New'} Academic Year</h2>
              <button type="button" onClick={() => { setShowForm(false); setError(null) }}
                className="text-surface-400 hover:text-surface-600 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="space-y-4">
              {/* SHS: Grade Level selector */}
              {department === 'SHS' && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Grade Level <span className="text-red-500">*</span></label>
                  <select
                    value={form.grade_level}
                    onChange={(e) => setForm({ ...form, grade_level: e.target.value as GradeLevel | '' })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    required
                    disabled={!!editingId}
                  >
                    <option value="">Select Grade Level</option>
                    {GRADE_LEVELS.map((gl) => (
                      <option key={gl} value={gl}>{GRADE_LEVEL_LABELS[gl]}</option>
                    ))}
                  </select>
                  {editingId && <p className="text-xs text-surface-400 mt-1">Grade level cannot be changed after creation.</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Label</label>
                <input type="text" value={form.label} readOnly tabIndex={-1} placeholder="Auto-derived from Start Date"
                  className="w-full px-3 py-2 border border-surface-200 rounded-lg bg-surface-50 text-surface-500 cursor-not-allowed outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => {
                    const sd = e.target.value
                    setForm({ ...form, start_date: sd, label: deriveLabel(sd) })
                  }}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
              </div>

            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowForm(false); setError(null) }}
                className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading...</div>
      ) : years.length === 0 ? (
        <div className="text-center py-12 text-surface-400">No academic years yet. Create one to get started.</div>
      ) : (
        <>
          {/* Card Grid — 5 per row */}
          <div className="grid grid-cols-5 gap-4">
            {paginatedYears.map((ay) => {
              const isDraft = ay.status === 'DRAFT'
              const isCompleted = ay.status === 'COMPLETED'
              const isActive = !!ay.is_active

              return (
                <div
                  key={ay.id}
                  onClick={() => navigate(
                    isCompleted ? `/academic-years/${ay.id}/history` : `/academic-years/${ay.id}`
                  )}
                  className={`
                    relative bg-white rounded-xl border-2 shadow-sm overflow-hidden cursor-pointer
                    transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                    ${isActive
                      ? 'border-green-300 hover:border-green-400'
                      : isDraft
                        ? 'border-amber-200 hover:border-amber-300'
                        : isCompleted
                          ? 'border-slate-200 hover:border-slate-300'
                          : 'border-surface-200 hover:border-surface-300'
                    }
                  `}
                >
                  {/* Active indicator strip */}
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-500" />
                  )}
                  {isDraft && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                  )}
                  {isCompleted && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-300 to-slate-400" />
                  )}

                  <div className="p-4 pt-5">
                    {/* Grade level badge for SHS */}
                    {ay.grade_level && (
                      <div className="mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
                          ay.grade_level === 'GRADE_11'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                          {GRADE_LEVEL_LABELS[ay.grade_level as keyof typeof GRADE_LEVEL_LABELS]}
                        </span>
                      </div>
                    )}
                    {/* Header: Label + Badge */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base font-bold text-surface-900 leading-tight">{ay.label}</h3>
                      {getStatusBadge(ay)}
                    </div>

                    {/* Date range */}
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <svg className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{ay.start_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <svg className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{ay.end_date}</span>
                      </div>
                    </div>

                    {/* View detail hint */}
                    <div className="text-xs text-primary-500 font-medium">
                      Click to view details →
                    </div>


                    {/* Draft action buttons */}
                    {isDraft && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-100">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePublishAY(ay) }}
                          className="flex-1 px-2 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors"
                        >
                          Publish
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(ay) }}
                          className="px-2 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(ay) }}
                          className="px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-surface-500">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, years.length)} of {years.length}
              </p>
              <div className="flex items-center gap-1">
                {/* Previous */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-surface-300 disabled:cursor-not-allowed text-surface-600 hover:bg-surface-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                {/* Page numbers */}
                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 py-1.5 text-sm text-surface-400">…</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-primary-600 text-white shadow-sm'
                          : 'text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:text-surface-300 disabled:cursor-not-allowed text-surface-600 hover:bg-surface-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
