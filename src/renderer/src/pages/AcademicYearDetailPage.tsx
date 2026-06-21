import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment, useRegisterDirty } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, AcademicYear, Semester, Quarter, QuarterLabel, GradeLevel, TermType } from '@shared/types'
import {
  SHS_SEMESTER_TYPES, COLLEGE_SEMESTER_TYPES,
  SHS_TWO_SEM_SEMESTER_TYPES, SHS_TRIMESTRAL_SEMESTER_TYPES,
  TERM_TYPE_LABELS, GRADE_LEVEL_LABELS, GRADE_LEVELS
} from '@shared/constants'

// ── Quarter labels available per semester type ──────────────────────────────
const QUARTER_LABELS_FOR_SEM: Record<string, QuarterLabel[]> = {
  '1ST_SEMESTER': ['Q1', 'Q2'],
  '2ND_SEMESTER': ['Q3', 'Q4'],
  '3RD_SEMESTER': [],
  'SUMMER': [],
}

// ── Quarter sub-component ───────────────────────────────────────────────────
interface QuarterSectionProps {
  sem: Semester
  toast: ReturnType<typeof import('../components/ToastProvider').useToast>
  confirm: ReturnType<typeof import('../components/ConfirmDialog').useConfirmDialog>['confirm']
}

function QuarterSection({ sem, toast, confirm }: QuarterSectionProps): JSX.Element {
  const [quarters, setQuarters] = useState<Quarter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [qForm, setQForm] = useState<{ quarter_label: QuarterLabel; start_date: string; end_date: string }>({
    quarter_label: 'Q1',
    start_date: sem.start_date,
    end_date: '',
  })
  const [qError, setQError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit quarter state
  const [editingQId, setEditingQId] = useState<string | null>(null)
  const [editQForm, setEditQForm] = useState({ start_date: '', end_date: '' })
  const [editQError, setEditQError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  const availableLabels = QUARTER_LABELS_FOR_SEM[sem.semester_type] ?? []

  const loadQuarters = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listQuarters(sem.id)) as IpcResponse<Quarter[]>
    if (result.data) setQuarters(result.data)
    setLoading(false)
  }, [sem.id])

  useEffect(() => { loadQuarters() }, [loadQuarters])

  // Compute which labels are still available to add
  const usedLabels = quarters.map(q => q.quarter_label)
  const remainingLabels = availableLabels.filter(l => !usedLabels.includes(l))

  const openAddForm = () => {
    if (remainingLabels.length === 0) return
    const nextLabel = remainingLabels[0]
    // Auto-fill start: if first quarter, use sem start; else use previous quarter's end_date
    const prevQ = quarters.find(q => q.quarter_label === availableLabels[availableLabels.indexOf(nextLabel) - 1])
    const autoStart = prevQ ? prevQ.end_date : sem.start_date
    // Auto-fill end: if last quarter, use sem end; else blank
    const isLast = nextLabel === availableLabels[availableLabels.length - 1]
    const autoEnd = isLast ? sem.end_date : ''
    setQForm({ quarter_label: nextLabel, start_date: autoStart, end_date: autoEnd })
    setQError(null)
    setShowForm(true)
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setQError(null)
    setIsSubmitting(true)
    try {
      const result = (await window.electronAPI.createQuarter({
        semester_id: sem.id,
        quarter_label: qForm.quarter_label,
        start_date: qForm.start_date,
        end_date: qForm.end_date,
      })) as IpcResponse
      if (result.error) { setQError(result.error.message); return }
      toast.success(`${qForm.quarter_label} added`)
      setShowForm(false)
      await loadQuarters()
    } finally {
      setIsSubmitting(false)
    }
  }

  const startEditQ = (q: Quarter) => {
    setEditingQId(q.id)
    setEditQForm({ start_date: q.start_date, end_date: q.end_date })
    setEditQError(null)
  }

  const handleEditQSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQId) return
    setIsEditSubmitting(true)
    setEditQError(null)
    try {
      const result = (await window.electronAPI.updateQuarter({
        id: editingQId,
        start_date: editQForm.start_date,
        end_date: editQForm.end_date,
      })) as IpcResponse
      if (result.error) { setEditQError(result.error.message); return }
      toast.success('Quarter updated')
      setEditingQId(null)
      await loadQuarters()
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteQ = async (q: Quarter) => {
    const confirmed = await confirm({
      title: 'Delete Quarter',
      message: `Delete ${q.quarter_label} (${q.start_date} – ${q.end_date})?`,
      variant: 'danger',
      confirmLabel: 'Delete',
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteQuarter(q.id)) as IpcResponse
    if (result.error) { toast.error(result.error.message) }
    else { toast.success(`${q.quarter_label} deleted`); await loadQuarters() }
  }

  if (availableLabels.length === 0) return <></> // SUMMER has no quarters

  return (
    <div className="mt-3 ml-10 border-l-2 border-surface-200 pl-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Quarters ({quarters.length} / {availableLabels.length})
        </span>
        {remainingLabels.length > 0 && !showForm && (
          <button onClick={openAddForm}
            className="text-xs font-medium text-primary-600 hover:text-primary-800 px-2 py-0.5 hover:bg-primary-50 rounded transition-colors">
            + Add Quarter
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-xs text-surface-400 py-1">Loading...</div>
      ) : (
        <div className="space-y-1.5">
          {quarters.map(q => (
            <div key={q.id}>
              {editingQId === q.id ? (
                <form onSubmit={handleEditQSubmit}
                  className="bg-white border border-primary-200 rounded-lg p-3 space-y-2">
                  {editQError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{editQError}</div>}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-surface-700 w-6">{q.quarter_label}</span>
                    <div className="flex gap-2 flex-1">
                      <div className="flex-1">
                        <label className="block text-xs text-surface-500 mb-0.5">Start</label>
                        <input type="date" value={editQForm.start_date}
                          onChange={e => setEditQForm({ ...editQForm, start_date: e.target.value })}
                          className="w-full px-2 py-1 border border-surface-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" required />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-surface-500 mb-0.5">End</label>
                        <input type="date" value={editQForm.end_date}
                          onChange={e => setEditQForm({ ...editQForm, end_date: e.target.value })}
                          className="w-full px-2 py-1 border border-surface-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" required />
                      </div>
                    </div>
                    <div className="flex gap-1 items-end pb-0.5">
                      <button type="submit" disabled={isEditSubmitting}
                        className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                        {isEditSubmitting ? '...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditingQId(null)}
                        className="px-2 py-1 bg-surface-100 text-surface-600 rounded text-xs hover:bg-surface-200">
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3 bg-surface-50 px-3 py-1.5 rounded-lg border border-surface-100 text-xs group">
                  <span className="font-bold text-primary-700 w-5 flex-shrink-0">{q.quarter_label}</span>
                  <span className="text-surface-600">{q.start_date} – {q.end_date}</span>
                  <span className="flex-1" />
                  <div className="hidden group-hover:flex items-center gap-1.5">
                    <button onClick={() => startEditQ(q)}
                      className="text-primary-600 hover:text-primary-800 font-medium">Edit</button>
                    <button onClick={() => handleDeleteQ(q)}
                      className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddSubmit}
          className="bg-white border border-surface-200 rounded-lg p-3 space-y-2 mt-1">
          {qError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{qError}</div>}
          <div className="flex items-center gap-2">
            <div>
              <label className="block text-xs text-surface-500 mb-0.5">Quarter</label>
              <select value={qForm.quarter_label}
                onChange={e => setQForm({ ...qForm, quarter_label: e.target.value as QuarterLabel })}
                className="px-2 py-1 border border-surface-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none">
                {remainingLabels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-surface-500 mb-0.5">Start</label>
              <input type="date" value={qForm.start_date}
                onChange={e => setQForm({ ...qForm, start_date: e.target.value })}
                className="w-full px-2 py-1 border border-surface-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" required />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-surface-500 mb-0.5">End</label>
              <input type="date" value={qForm.end_date}
                onChange={e => setQForm({ ...qForm, end_date: e.target.value })}
                className="w-full px-2 py-1 border border-surface-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" required />
            </div>
            <div className="flex gap-1 items-end pb-0.5">
              <button type="submit" disabled={isSubmitting}
                className="px-2 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 disabled:opacity-50">
                {isSubmitting ? '...' : 'Add'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-2 py-1 bg-surface-100 text-surface-600 rounded text-xs hover:bg-surface-200">
                Cancel
              </button>
            </div>
          </div>
          <p className="text-xs text-surface-400">
            {qForm.quarter_label === availableLabels[0] ? 'Start auto-filled from semester start.' : ''}
            {qForm.quarter_label === availableLabels[availableLabels.length - 1] ? ' End auto-filled from semester end.' : ''}
          </p>
        </form>
      )}
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function AcademicYearDetailPage(): JSX.Element {
  const { ayId } = useParams<{ ayId: string }>()
  const navigate = useNavigate()
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()

  const [ay, setAy] = useState<AcademicYear | null>(null)
  const [loading, setLoading] = useState(true)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [semLoading, setSemLoading] = useState(true)

  // Semester create form
  const [showSemForm, setShowSemForm] = useState(false)
  const [semForm, setSemForm] = useState<{
    semester_type: string; start_date: string; end_date: string
    grade_level: GradeLevel | ''; term_type: TermType | ''
  }>({ semester_type: '1ST_SEMESTER', start_date: '', end_date: '', grade_level: '', term_type: '' })
  const [semError, setSemError] = useState<string | null>(null)
  const [isSemSubmitting, setIsSemSubmitting] = useState(false)

  // Edit AY form
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState({ label: '', start_date: '', end_date: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Edit Semester form
  const [showEditSemForm, setShowEditSemForm] = useState(false)
  const [editingSemId, setEditingSemId] = useState<string | null>(null)
  const [editSemForm, setEditSemForm] = useState({ semester_type: '', start_date: '', end_date: '' })
  const [editSemError, setEditSemError] = useState<string | null>(null)
  const [isEditSemSubmitting, setIsEditSemSubmitting] = useState(false)

  // Register dirty state — blocks department switch while any form is open
  useRegisterDirty(showSemForm || showEditForm || showEditSemForm || editingSemId !== null)

  const startEditSem = (sem: Semester) => {
    setEditingSemId(sem.id)
    setEditSemForm({ semester_type: sem.semester_type, start_date: sem.start_date, end_date: sem.end_date })
    setShowEditSemForm(true)
    setEditSemError(null)
  }

  const handleEditSemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditSemError(null)
    if (!editingSemId) return
    setIsEditSemSubmitting(true)
    try {
      const result = (await window.electronAPI.updateSemester({ id: editingSemId, start_date: editSemForm.start_date, end_date: editSemForm.end_date })) as IpcResponse
      if (result.error) { setEditSemError(result.error.message); return }
      toast.success('Semester updated')
      setShowEditSemForm(false)
      setEditingSemId(null)
      await loadSemesters()
    } finally {
      setIsEditSemSubmitting(false)
    }
  }

  const loadAY = useCallback(async () => {
    if (!ayId) return
    setLoading(true)
    const result = (await window.electronAPI.getAcademicYear(ayId)) as IpcResponse<AcademicYear>
    if (result.error) { toast.error(result.error.message); setLoading(false); return }
    if (result.data) setAy(result.data)
    setLoading(false)
  }, [ayId])

  const loadSemesters = useCallback(async () => {
    if (!ayId) return
    setSemLoading(true)
    const result = (await window.electronAPI.getAcademicYearSemesters(ayId)) as IpcResponse<Semester[]>
    if (result.data) setSemesters(result.data)
    setSemLoading(false)
  }, [ayId])

  useEffect(() => { loadAY(); loadSemesters() }, [loadAY, loadSemesters])

  const semesterTypes = department === 'SHS' ? SHS_SEMESTER_TYPES : COLLEGE_SEMESTER_TYPES

  // SHS grade-level grouping
  const shsGradeLevelGroups = useMemo(() => {
    if (department !== 'SHS' || !ay) return null
    const groups: Array<{ gradeLevel: GradeLevel; termType: TermType | null; semesters: Semester[] }> = []
    for (const gl of GRADE_LEVELS as GradeLevel[]) {
      const termType = gl === 'GRADE_11' ? ay.grade_11_term_type : ay.grade_12_term_type
      const glSems = semesters.filter(s => s.grade_level === gl)
      groups.push({ gradeLevel: gl, termType, semesters: glSems })
    }
    // Also include legacy semesters (no grade_level)
    const legacy = semesters.filter(s => !s.grade_level)
    return { groups, legacy }
  }, [department, ay, semesters])

  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  // Generate preview modal state
  interface SemesterPreviewItem {
    semester_type: string; start_date: string; end_date: string
    quarters: Array<{ label: string; start_date: string; end_date: string }>
  }
  const [generatePreview, setGeneratePreview] = useState<{
    gradeLevel: GradeLevel; termType: TermType; semesters: SemesterPreviewItem[]
  } | null>(null)

  const handleConfigureSemesters = async (gradeLevel: GradeLevel, termType: TermType) => {
    if (!ayId) return
    setIsGenerating(gradeLevel)
    try {
      const result = (await window.electronAPI.previewSemesterGeneration({
        academic_year_id: ayId, grade_level: gradeLevel, term_type: termType
      })) as IpcResponse<SemesterPreviewItem[]>
      if (result.error) { toast.error(result.error.message); return }
      if (result.data) {
        setGeneratePreview({ gradeLevel, termType, semesters: result.data })
      }
    } finally {
      setIsGenerating(null)
    }
  }

  const handleExecuteGeneration = async () => {
    if (!generatePreview || !ayId) return
    setIsGenerating(generatePreview.gradeLevel)
    try {
      const result = (await window.electronAPI.executeSemesterGeneration({
        academic_year_id: ayId,
        grade_level: generatePreview.gradeLevel,
        term_type: generatePreview.termType,
        semesters: generatePreview.semesters.map(s => ({
          semester_type: s.semester_type, start_date: s.start_date, end_date: s.end_date
        }))
      })) as IpcResponse
      if (result.error) { toast.error(result.error.message); return }
      toast.success(`${GRADE_LEVEL_LABELS[generatePreview.gradeLevel]} semesters created`)
      setGeneratePreview(null)
      await loadSemesters()
    } finally {
      setIsGenerating(null)
    }
  }

  const updatePreviewDate = (idx: number, field: 'start_date' | 'end_date', value: string) => {
    if (!generatePreview) return
    const updated = [...generatePreview.semesters]
    updated[idx] = { ...updated[idx], [field]: value }
    setGeneratePreview({ ...generatePreview, semesters: updated })
  }

  const semesterLabel = (semType: string): string => {
    const map: Record<string, string> = {
      '1ST_SEMESTER': 'Semester 1',
      '2ND_SEMESTER': 'Semester 2',
      '3RD_SEMESTER': 'Semester 3',
      'SUMMER': 'Summer',
    }
    return map[semType] ?? semType.replace(/_/g, ' ')
  }

  const getSemesterDatePrefill = (semType: string, acadYear: AcademicYear) => {
    if (semType === '1ST_SEMESTER') return { start_date: acadYear.start_date, end_date: '' }
    if (semType === '2ND_SEMESTER') return { start_date: '', end_date: acadYear.end_date }
    return { start_date: '', end_date: '' }
  }

  const handleSemSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSemError(null)
    if (!ayId) return
    setIsSemSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        semester_type: semForm.semester_type, start_date: semForm.start_date,
        end_date: semForm.end_date, academic_year_id: ayId, department
      }
      if (department === 'SHS' && semForm.grade_level) {
        payload.grade_level = semForm.grade_level
        payload.term_type = semForm.term_type || undefined
      }
      const result = (await window.electronAPI.createSemester(payload)) as IpcResponse
      if (result.error) { setSemError(result.error.message); return }
      toast.success('Semester created')
      setShowSemForm(false)
      setSemForm({ semester_type: '1ST_SEMESTER', start_date: '', end_date: '', grade_level: '', term_type: '' })
      await loadSemesters()
    } finally {
      setIsSemSubmitting(false)
    }
  }

  const handleSemDelete = async (sem: Semester) => {
    const confirmed = await confirm({
      title: 'Delete Semester',
      message: `Are you sure you want to delete "${sem.semester_type.replace(/_/g, ' ')}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: 'All associated quarters, schedule entries, and calendar events will be affected.',
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteSemester(sem.id)) as IpcResponse
    if (result.error) { toast.error(result.error.message) }
    else { toast.success('Semester deleted'); await loadSemesters() }
  }

  const handlePublishAY = async () => {
    if (!ayId) return
    const result = (await window.electronAPI.publishAcademicYear(ayId)) as IpcResponse<Record<string, unknown>>
    if (result.error) { toast.error(result.error.message) }
    else {
      toast.success('Academic year published and activated')
      if (result.data?.warning) toast.warning(result.data.warning as string)
      loadAY()
    }
  }

  const handleDeleteAY = async () => {
    if (!ay) return
    const confirmed = await confirm({
      title: 'Delete Academic Year',
      message: `Are you sure you want to delete "${ay.label}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: semesters.length > 0
        ? `This will also delete ${semesters.length} semester${semesters.length > 1 ? 's' : ''} and all associated schedule entries.`
        : 'All associated schedule entries and sections referencing this academic year will be affected.',
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteAcademicYear(ay.id)) as IpcResponse
    if (result.error) { toast.error(result.error.message) }
    else { toast.success('Academic year deleted'); navigate('/academic-years') }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditError(null)
    if (!ay) return
    setIsEditSubmitting(true)
    try {
      const result = (await window.electronAPI.updateAcademicYear({ id: ay.id, ...editForm })) as IpcResponse
      if (result.error) { setEditError(result.error.message); return }
      toast.success('Academic year updated')
      setShowEditForm(false)
      loadAY()
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const startEdit = () => {
    if (!ay) return
    setEditForm({ label: ay.label, start_date: ay.start_date, end_date: ay.end_date })
    setShowEditForm(true)
    setEditError(null)
  }

  if (loading) return <div className="p-8 text-center text-surface-400">Loading...</div>
  if (!ay) return (
    <div className="p-8 text-center">
      <p className="text-surface-400 mb-4">Academic year not found.</p>
      <button onClick={() => navigate('/academic-years')} className="text-primary-600 hover:text-primary-800 font-medium">← Back to Academic Years</button>
    </div>
  )

  const isDraft = ay.status === 'DRAFT'
  const isActive = !!ay.is_active

  return (
    <div className="space-y-6 p-1">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/academic-years')} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors">
          <span>←</span> Back to Academic Years
        </button>
      </div>

      {/* AY info header */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-4 mb-1">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold flex-shrink-0 ${isActive ? 'bg-green-50 text-green-600' : isDraft ? 'bg-amber-50 text-amber-600' : 'bg-surface-100 text-surface-500'}`}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-surface-900">{ay.label}</h1>
            <p className="text-surface-500 text-sm">{ay.department} Department</p>
          </div>
          {isDraft ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500" />Draft
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-500" />Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">
              <span className="w-2 h-2 rounded-full bg-surface-400" />Inactive
            </span>
          )}
        </div>

        <div className="flex items-center gap-6 mt-3 text-sm text-surface-500 flex-wrap">
          <span><strong className="text-surface-700">Start Date:</strong> {ay.start_date}</span>
          <span><strong className="text-surface-700">End Date:</strong> {ay.end_date}</span>
          <span><strong className="text-surface-700">Semesters:</strong> {semesters.length}</span>
        </div>

        {isDraft && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surface-100">
            <button onClick={handlePublishAY} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">Publish</button>
            <button onClick={startEdit} className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm font-medium transition-colors">Edit</button>
            <button onClick={handleDeleteAY} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Delete</button>
          </div>
        )}
      </div>

      {/* Edit AY Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditForm(false); setEditError(null) }} />
          <form onSubmit={handleEditSubmit} className="relative bg-white p-6 rounded-xl border border-surface-200 shadow-xl space-y-4 w-full max-w-lg mx-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Edit Academic Year</h2>
              <button type="button" onClick={() => { setShowEditForm(false); setEditError(null) }} className="text-surface-400 hover:text-surface-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {editError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{editError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Label</label>
                <input type="text" value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} placeholder="e.g. 2025-2026"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
                  <input type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
                  <input type="date" value={editForm.end_date} onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowEditForm(false); setEditError(null) }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={isEditSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">
                {isEditSubmitting ? 'Saving...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Semester Modal */}
      {showEditSemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setShowEditSemForm(false); setEditSemError(null) }} />
          <form onSubmit={handleEditSemSubmit} className="relative bg-white p-6 rounded-xl border border-surface-200 shadow-xl space-y-4 w-full max-w-lg mx-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-surface-900">Edit Semester Dates</h2>
              <button type="button" onClick={() => { setShowEditSemForm(false); setEditSemError(null) }} className="text-surface-400 hover:text-surface-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {editSemError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{editSemError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Semester Type</label>
                <input type="text" value={semesterLabel(editSemForm.semester_type)} className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-surface-50 text-surface-500 outline-none" disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
                  <input type="date" value={editSemForm.start_date} onChange={e => setEditSemForm({ ...editSemForm, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
                  <input type="date" value={editSemForm.end_date} onChange={e => setEditSemForm({ ...editSemForm, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => { setShowEditSemForm(false); setEditSemError(null) }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={isEditSemSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">
                {isEditSemSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Semesters Section */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <h2 className="text-sm font-semibold text-surface-700">Semesters</h2>
            <span className="text-xs text-surface-400">({semesters.length})</span>
          </div>
          <button onClick={() => {
            if (!ay) return
            const prefill = getSemesterDatePrefill('1ST_SEMESTER', ay)
            setSemForm({ semester_type: '1ST_SEMESTER', ...prefill, grade_level: '', term_type: '' })
            setShowSemForm(true)
            setSemError(null)
          }} className="text-xs font-medium text-primary-600 hover:text-primary-800 px-2 py-1 hover:bg-primary-50 rounded-lg transition-colors">
            + Add Semester
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {semLoading ? (
            <div className="text-center py-8 text-surface-400 text-sm">Loading semesters...</div>
          ) : department === 'SHS' && shsGradeLevelGroups && (ay?.grade_11_term_type || ay?.grade_12_term_type) ? (
            /* ── SHS Grade-Level Grouped View ── */
            <div className="space-y-6">
              {shsGradeLevelGroups.groups.map(({ gradeLevel, termType, semesters: glSems }) => (
                <div key={gradeLevel} className="space-y-3">
                  {/* Grade level header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        gradeLevel === 'GRADE_11' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                      }`}>{GRADE_LEVEL_LABELS[gradeLevel]}</span>
                      {termType && (
                        <span className="text-xs text-surface-500">{TERM_TYPE_LABELS[termType]}</span>
                      )}
                    </div>
                    {termType && glSems.length === 0 && (
                      <button
                        onClick={() => handleConfigureSemesters(gradeLevel, termType)}
                        disabled={isGenerating === gradeLevel}
                        className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:bg-primary-400 transition-colors"
                      >
                        {isGenerating === gradeLevel ? 'Loading...' : `Configure ${TERM_TYPE_LABELS[termType]} Semesters`}
                      </button>
                    )}
                  </div>

                  {glSems.length === 0 && !termType && (
                    <p className="text-xs text-surface-400 pl-1">No term type configured. Set it in the Academic Year settings.</p>
                  )}
                  {glSems.length === 0 && termType && (
                    <p className="text-xs text-surface-400 pl-1">No semesters yet. Click "Configure" to set dates and create them.</p>
                  )}

                  {glSems.map((sem) => {
                    const semIsDraft = sem.status === 'DRAFT'
                    const semIsActive = !!sem.is_active
                    return (
                      <div key={sem.id} className="rounded-lg border border-surface-200 overflow-hidden">
                        <div className="flex items-center gap-4 bg-surface-50 px-4 py-3 text-sm">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${semIsActive ? 'bg-green-50 text-green-600' : semIsDraft ? 'bg-amber-50 text-amber-600' : 'bg-surface-100 text-surface-500'}`}>
                            {sem.semester_type === '1ST_SEMESTER' ? '1st' : sem.semester_type === '2ND_SEMESTER' ? '2nd' : sem.semester_type === '3RD_SEMESTER' ? '3rd' : 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-surface-800 block">{semesterLabel(sem.semester_type)}</span>
                            <span className="text-surface-500 text-xs">{sem.start_date} — {sem.end_date}</span>
                          </div>
                          {semIsDraft ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Draft</span>
                              <button onClick={async () => {
                                const result = (await window.electronAPI.publishSemester(sem.id)) as IpcResponse
                                if (result.error) { toast.error(result.error.message) }
                                else { toast.success('Semester published and activated'); await loadSemesters(); loadAY() }
                              }} className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors">Publish</button>
                              <button onClick={() => startEditSem(sem)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                              <button onClick={() => handleSemDelete(sem)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                            </div>
                          ) : semIsActive ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
                          )}
                        </div>
                        {/* Quarters: only for TWO_SEMESTER */}
                        {sem.term_type !== 'TRIMESTRAL' && (
                          <div className="px-4 pb-3 bg-white">
                            <QuarterSection sem={sem} toast={toast} confirm={confirm} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}

              {/* Legacy semesters (no grade_level) */}
              {shsGradeLevelGroups.legacy.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Legacy (No Grade Level)</span>
                  </div>
                  {shsGradeLevelGroups.legacy.map((sem) => {
                    const semIsDraft = sem.status === 'DRAFT'
                    const semIsActive = !!sem.is_active
                    return (
                      <div key={sem.id} className="rounded-lg border border-surface-200 overflow-hidden">
                        <div className="flex items-center gap-4 bg-surface-50 px-4 py-3 text-sm">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${semIsActive ? 'bg-green-50 text-green-600' : semIsDraft ? 'bg-amber-50 text-amber-600' : 'bg-surface-100 text-surface-500'}`}>
                            {sem.semester_type === '1ST_SEMESTER' ? '1st' : sem.semester_type === '2ND_SEMESTER' ? '2nd' : sem.semester_type === '3RD_SEMESTER' ? '3rd' : 'S'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-surface-800 block">{semesterLabel(sem.semester_type)}</span>
                            <span className="text-surface-500 text-xs">{sem.start_date} — {sem.end_date}</span>
                          </div>
                          {semIsDraft ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Draft</span>
                              <button onClick={() => startEditSem(sem)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                              <button onClick={() => handleSemDelete(sem)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                            </div>
                          ) : semIsActive ? (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
                          )}
                        </div>
                        <div className="px-4 pb-3 bg-white">
                          <QuarterSection sem={sem} toast={toast} confirm={confirm} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : semesters.length === 0 && !showSemForm ? (
            <p className="text-sm text-surface-400 text-center py-8">No semesters yet. Add one to enable sections and scheduling.</p>
          ) : (
            /* ── College / SHS without term types: flat list ── */
            <>
              {semesters.map((sem) => {
                const semIsDraft = sem.status === 'DRAFT'
                const semIsActive = !!sem.is_active

                return (
                  <div key={sem.id} className="rounded-lg border border-surface-200 overflow-hidden">
                    <div className="flex items-center gap-4 bg-surface-50 px-4 py-3 text-sm">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${semIsActive ? 'bg-green-50 text-green-600' : semIsDraft ? 'bg-amber-50 text-amber-600' : 'bg-surface-100 text-surface-500'}`}>
                        {sem.semester_type === '1ST_SEMESTER' ? '1st' : sem.semester_type === '2ND_SEMESTER' ? '2nd' : sem.semester_type === '3RD_SEMESTER' ? '3rd' : 'S'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-surface-800 block">{semesterLabel(sem.semester_type)}</span>
                        <span className="text-surface-500 text-xs">{sem.start_date} — {sem.end_date}</span>
                      </div>
                      {semIsDraft ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">Draft</span>
                          <button onClick={async () => {
                            const result = (await window.electronAPI.publishSemester(sem.id)) as IpcResponse
                            if (result.error) { toast.error(result.error.message) }
                            else { toast.success('Semester published and activated'); await loadSemesters(); loadAY() }
                          }} className="px-2.5 py-1 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 transition-colors">Publish</button>
                          <button onClick={() => startEditSem(sem)} className="text-primary-600 hover:text-primary-800 text-xs font-medium">Edit</button>
                          <button onClick={() => handleSemDelete(sem)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
                        </div>
                      ) : semIsActive ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
                      )}
                    </div>
                    {/* Quarter sub-section (SHS only, non-trimestral) */}
                    {department === 'SHS' && sem.term_type !== 'TRIMESTRAL' && (
                      <div className="px-4 pb-3 bg-white">
                        <QuarterSection sem={sem} toast={toast} confirm={confirm} />
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* Add Semester inline form */}
          {showSemForm && ay && (
            <form onSubmit={handleSemSubmit} className="bg-white p-4 rounded-lg border border-surface-200 space-y-3 mt-3">
              {semError && <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded text-xs">{semError}</div>}
              {/* SHS: grade level + term type row */}
              {department === 'SHS' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Grade Level</label>
                    <select value={semForm.grade_level}
                      onChange={e => {
                        const gl = e.target.value as GradeLevel | ''
                        const tt = gl && ay ? (gl === 'GRADE_11' ? ay.grade_11_term_type : ay.grade_12_term_type) : null
                        setSemForm({ ...semForm, grade_level: gl, term_type: tt ?? '' })
                      }}
                      className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">— Select —</option>
                      {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{GRADE_LEVEL_LABELS[gl as GradeLevel]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-700 mb-1">Term Type</label>
                    <input type="text" readOnly
                      value={semForm.term_type ? TERM_TYPE_LABELS[semForm.term_type] : '(auto from AY config)'}
                      className="w-full px-2 py-1.5 border border-surface-200 rounded-lg text-sm bg-surface-50 text-surface-500" />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">Type</label>
                  <select value={semForm.semester_type}
                    onChange={e => { const t = e.target.value; setSemForm({ ...semForm, semester_type: t, ...getSemesterDatePrefill(t, ay) }) }}
                    className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    {(department === 'SHS' && semForm.term_type
                      ? (semForm.term_type === 'TRIMESTRAL' ? SHS_TRIMESTRAL_SEMESTER_TYPES : SHS_TWO_SEM_SEMESTER_TYPES)
                      : semesterTypes
                    ).map(t => <option key={t} value={t}>{semesterLabel(t)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">Start</label>
                  <input type="date" value={semForm.start_date} onChange={e => setSemForm({ ...semForm, start_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-surface-700 mb-1">End</label>
                  <input type="date" value={semForm.end_date} onChange={e => setSemForm({ ...semForm, end_date: e.target.value })}
                    className="w-full px-2 py-1.5 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" required />
                </div>
              </div>
              {department === 'SHS' && semForm.term_type === 'TWO_SEMESTER' && semForm.semester_type !== 'SUMMER' && (
                <p className="text-xs text-surface-400">
                  After creating the semester, add quarters (Q1/Q2 or Q3/Q4) using the Quarters section that will appear below it.
                </p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={isSemSubmitting} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 disabled:bg-primary-400">
                  {isSemSubmitting ? 'Creating...' : 'Create Semester'}
                </button>
                <button type="button" onClick={() => setShowSemForm(false)} className="px-3 py-1.5 bg-surface-100 text-surface-700 rounded-lg text-xs font-medium hover:bg-surface-200">Cancel</button>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Semester Generation Preview Modal */}
      {generatePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setGeneratePreview(null)} />
          <div className="relative bg-white p-6 rounded-xl border border-surface-200 shadow-xl space-y-4 w-full max-w-xl mx-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-surface-900">
                  Configure {TERM_TYPE_LABELS[generatePreview.termType]} Semesters
                </h2>
                <p className="text-sm text-surface-500 mt-0.5">
                  {GRADE_LEVEL_LABELS[generatePreview.gradeLevel]} — Adjust dates before saving
                </p>
              </div>
              <button type="button" onClick={() => setGeneratePreview(null)} className="text-surface-400 hover:text-surface-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              {generatePreview.semesters.map((sem, idx) => {
                const isFirst = idx === 0
                const isLast = idx === generatePreview.semesters.length - 1
                return (
                  <div key={sem.semester_type} className="bg-surface-50 p-3 rounded-lg border border-surface-200">
                    <div className="text-sm font-medium text-surface-800 mb-2">{semesterLabel(sem.semester_type)}</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-surface-600 mb-1">
                          Start Date {isFirst && <span className="text-surface-400">(AY start)</span>}
                        </label>
                        <input
                          type="date"
                          value={sem.start_date}
                          readOnly={isFirst}
                          onChange={e => updatePreviewDate(idx, 'start_date', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${
                            isFirst ? 'border-surface-200 bg-surface-100 text-surface-500' : 'border-surface-300 bg-white'
                          }`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-surface-600 mb-1">
                          End Date {isLast && <span className="text-surface-400">(AY end)</span>}
                        </label>
                        <input
                          type="date"
                          value={sem.end_date}
                          readOnly={isLast}
                          onChange={e => updatePreviewDate(idx, 'end_date', e.target.value)}
                          className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none ${
                            isLast ? 'border-surface-200 bg-surface-100 text-surface-500' : 'border-surface-300 bg-white'
                          }`}
                          required
                        />
                      </div>
                    </div>
                    {sem.quarters.length > 0 && (
                      <p className="text-xs text-surface-400 mt-1.5">Quarters ({sem.quarters.map(q => q.label).join(', ')}) will be auto-created within this range.</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setGeneratePreview(null)}
                className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
              <button
                onClick={handleExecuteGeneration}
                disabled={isGenerating !== null}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium"
              >
                {isGenerating ? 'Creating...' : 'Create Semesters'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
