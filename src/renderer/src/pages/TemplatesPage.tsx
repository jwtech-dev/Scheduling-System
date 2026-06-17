import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type {
  IpcResponse,
  AcademicYear,
  Semester,
  CarryForwardPreview,
  CarryForwardResult,
  CarryForwardEntity
} from '@shared/types'

const ENTITY_OPTIONS: { key: CarryForwardEntity; label: string; description: string; icon: string }[] = [
  { key: 'SECTIONS', label: 'Sections', description: 'Section definitions, year levels, programs, advisers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'CLASS_SCHEDULES', label: 'Class Schedules', description: 'Class entries with room, personnel, and section assignments', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { key: 'EXAM_SCHEDULES', label: 'Exam Schedules', description: 'Exam entries with room and personnel assignments', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'CALENDAR_EVENTS', label: 'Calendar Events', description: 'Holidays, exam periods, breaks (dates kept as-is)', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
]

type Step = 'configure' | 'preview' | 'complete'

export default function TemplatesPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()

  // Step state
  const [step, setStep] = useState<Step>('configure')

  // Academic year + semester data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [sourceSemesters, setSourceSemesters] = useState<Semester[]>([])
  const [targetSemesters, setTargetSemesters] = useState<Semester[]>([])

  // Selections
  const [sourceAYId, setSourceAYId] = useState('')
  const [sourceSemId, setSourceSemId] = useState('')
  const [targetAYId, setTargetAYId] = useState('')
  const [targetSemId, setTargetSemId] = useState('')
  const [selectedEntities, setSelectedEntities] = useState<Set<CarryForwardEntity>>(new Set(['SECTIONS', 'CLASS_SCHEDULES']))

  // Preview + result
  const [preview, setPreview] = useState<CarryForwardPreview | null>(null)
  const [result, setResult] = useState<CarryForwardResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load academic years
  const loadAcademicYears = useCallback(async () => {
    const res = (await window.electronAPI.listAcademicYears(department)) as IpcResponse<AcademicYear[]>
    if (res.data) setAcademicYears(res.data)
  }, [department])

  useEffect(() => {
    loadAcademicYears()
    // Reset on department change
    setSourceAYId(''); setSourceSemId(''); setTargetAYId(''); setTargetSemId('')
    setPreview(null); setResult(null); setStep('configure')
  }, [loadAcademicYears])

  // Load source semesters when source AY changes
  useEffect(() => {
    if (!sourceAYId) { setSourceSemesters([]); setSourceSemId(''); return }
    ;(async () => {
      const res = (await window.electronAPI.getAcademicYearSemesters(sourceAYId)) as IpcResponse<Semester[]>
      if (res.data) setSourceSemesters(res.data)
    })()
    setSourceSemId('')
  }, [sourceAYId])

  // Load target semesters when target AY changes
  useEffect(() => {
    if (!targetAYId) { setTargetSemesters([]); setTargetSemId(''); return }
    ;(async () => {
      const res = (await window.electronAPI.getAcademicYearSemesters(targetAYId)) as IpcResponse<Semester[]>
      if (res.data) setTargetSemesters(res.data)
    })()
    setTargetSemId('')
  }, [targetAYId])

  const toggleEntity = (key: CarryForwardEntity): void => {
    setSelectedEntities(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const canPreview = sourceAYId && sourceSemId && targetAYId && targetSemId && selectedEntities.size > 0 && sourceSemId !== targetSemId

  const handlePreview = async (): Promise<void> => {
    setLoading(true); setError(null)
    const res = (await window.electronAPI.carryForwardPreview({
      source_academic_year_id: sourceAYId,
      source_semester_id: sourceSemId,
      target_academic_year_id: targetAYId,
      target_semester_id: targetSemId,
      department,
      entities: Array.from(selectedEntities)
    })) as IpcResponse<CarryForwardPreview>
    setLoading(false)
    if (res.error) { setError(res.error.message); return }
    if (res.data) { setPreview(res.data); setStep('preview') }
  }

  const handleExecute = async (): Promise<void> => {
    const confirmed = await confirm({
      title: 'Carry Forward Data',
      message: `This will clone data from the source term into the target term. All schedule entries will be created as DRAFT for review. Continue?`,
      variant: 'warning',
      confirmLabel: 'Carry Forward'
    })
    if (!confirmed) return

    setLoading(true); setError(null)
    const res = (await window.electronAPI.carryForwardExecute({
      source_academic_year_id: sourceAYId,
      source_semester_id: sourceSemId,
      target_academic_year_id: targetAYId,
      target_semester_id: targetSemId,
      department,
      entities: Array.from(selectedEntities)
    })) as IpcResponse<CarryForwardResult>
    setLoading(false)
    if (res.error) { setError(res.error.message); return }
    if (res.data) {
      setResult(res.data)
      setStep('complete')
      toast.success(`Carry forward complete — ${res.data.total_created} records created`)
    }
  }

  const handleReset = (): void => {
    setStep('configure'); setPreview(null); setResult(null); setError(null)
  }

  const fmtSemType = (s: string): string => s.replace(/_/g, ' ')
  const totalPreviewCount = preview ? Object.values(preview.counts).reduce((a, b) => a + b, 0) : 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Carry Forward</h1>
        <p className="text-sm text-surface-500 mt-1">Clone sections, schedules, and calendar events from a previous term to a new one</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          <span>{error}</span>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {[
          { key: 'configure' as const, label: '1. Configure' },
          { key: 'preview' as const, label: '2. Preview' },
          { key: 'complete' as const, label: '3. Complete' }
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-surface-300" />}
            <span className={`px-2.5 py-1 rounded-full ${step === s.key ? 'bg-primary-600 text-white' : step === 'complete' && s.key !== 'complete' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Configure Step ── */}
      {step === 'configure' && (
        <div className="space-y-5">
          {/* Source & Target */}
          <div className="grid grid-cols-2 gap-5">
            {/* Source */}
            <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="font-semibold text-surface-800">Source Term</h3>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Academic Year</label>
                <select value={sourceAYId} onChange={e => setSourceAYId(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select academic year</option>
                  {academicYears.map(ay => <option key={ay.id} value={ay.id}>{ay.label}{ay.is_active ? ' (Active)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Semester</label>
                <select value={sourceSemId} onChange={e => setSourceSemId(e.target.value)} disabled={!sourceAYId}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50">
                  <option value="">Select semester</option>
                  {sourceSemesters.map(s => <option key={s.id} value={s.id}>{fmtSemType(s.semester_type)}</option>)}
                </select>
              </div>
            </div>

            {/* Target */}
            <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-semibold text-surface-800">Target Term</h3>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Academic Year</label>
                <select value={targetAYId} onChange={e => setTargetAYId(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select academic year</option>
                  {academicYears.filter(ay => ay.is_active === 1).map(ay => <option key={ay.id} value={ay.id}>{ay.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Semester</label>
                <select value={targetSemId} onChange={e => setTargetSemId(e.target.value)} disabled={!targetAYId}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-50">
                  <option value="">Select semester</option>
                  {targetSemesters.map(s => <option key={s.id} value={s.id}>{fmtSemType(s.semester_type)}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Same-term warning */}
          {sourceSemId && targetSemId && sourceSemId === targetSemId && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
              ⚠ Source and target cannot be the same semester.
            </div>
          )}

          {/* Entity selection */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-3">
            <h3 className="font-semibold text-surface-800">What to Carry Forward</h3>
            <div className="grid grid-cols-2 gap-3">
              {ENTITY_OPTIONS.map(opt => {
                const selected = selectedEntities.has(opt.key)
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleEntity(opt.key)}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-200'
                        : 'border-surface-200 hover:border-surface-300 bg-white'
                    }`}
                  >
                    <div className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      selected ? 'bg-primary-600 border-primary-600' : 'border-surface-300'
                    }`}>
                      {selected && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-surface-800">{opt.label}</div>
                      <div className="text-xs text-surface-500 mt-0.5">{opt.description}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Calendar events notice */}
          {selectedEntities.has('CALENDAR_EVENTS') && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <span>Calendar events will be cloned with their <strong>original dates</strong>. You can adjust dates on the Calendar page after carry forward.</span>
            </div>
          )}

          {/* Preview button */}
          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={!canPreview || loading}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Loading...</>
              ) : (
                <>Preview →</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Preview Step ── */}
      {step === 'preview' && preview && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="text-xs font-medium text-blue-600 uppercase tracking-wider">Source</div>
              <div className="text-lg font-bold text-blue-900 mt-1">{preview.source_label}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="text-xs font-medium text-green-600 uppercase tracking-wider">Target</div>
              <div className="text-lg font-bold text-green-900 mt-1">{preview.target_label}</div>
            </div>
          </div>

          {/* Counts */}
          <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-surface-800">Records to Clone</h3>
            <div className="grid grid-cols-2 gap-3">
              {ENTITY_OPTIONS.filter(opt => selectedEntities.has(opt.key)).map(opt => {
                const count = preview.counts[opt.key] ?? 0
                return (
                  <div key={opt.key} className="flex items-center gap-3 p-3 bg-surface-50 rounded-lg">
                    <svg className="w-5 h-5 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} /></svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-surface-700">{opt.label}</div>
                    </div>
                    <div className={`text-lg font-bold ${count > 0 ? 'text-primary-600' : 'text-surface-400'}`}>{count}</div>
                  </div>
                )
              })}
            </div>
            {totalPreviewCount === 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-sm">
                No records found in the source term. Nothing to carry forward.
              </div>
            )}
          </div>

          {/* Info notices */}
          <div className="p-3 bg-surface-50 border border-surface-200 rounded-lg text-xs text-surface-600 space-y-1">
            <p>• Sections that already exist in the target term (same code + subject) will be <strong>skipped</strong>.</p>
            <p>• Schedule entries referencing <strong>inactive</strong> rooms or personnel will be skipped.</p>
            <p>• All carried-forward schedule entries will be in <strong>DRAFT</strong> status for review.</p>
            {selectedEntities.has('CALENDAR_EVENTS') && (
              <p>• Calendar events will keep their <strong>original dates</strong> — adjust on the Calendar page.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button onClick={() => setStep('configure')} className="px-4 py-2 text-sm font-medium text-surface-600 hover:text-surface-800 transition-colors">
              ← Back
            </button>
            <button
              onClick={handleExecute}
              disabled={loading || totalPreviewCount === 0}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {loading ? (
                <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Processing...</>
              ) : (
                <>Carry Forward {totalPreviewCount} Records</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Complete Step ── */}
      {step === 'complete' && result && (
        <div className="space-y-5">
          {/* Success banner */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-5 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Carry Forward Complete</h2>
                <p className="text-green-100 text-sm">{result.total_created} records created · {result.total_skipped} skipped</p>
              </div>
            </div>
          </div>

          {/* Per-entity results */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-50 border-b border-surface-200">
                <tr>
                  <th className="text-left px-5 py-3 font-semibold text-surface-600">Entity</th>
                  <th className="text-center px-5 py-3 font-semibold text-surface-600">Created</th>
                  <th className="text-center px-5 py-3 font-semibold text-surface-600">Skipped</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {result.results.map(r => {
                  const opt = ENTITY_OPTIONS.find(o => o.key === r.entity)
                  return (
                    <tr key={r.entity} className="hover:bg-surface-50">
                      <td className="px-5 py-3 font-medium text-surface-800">{opt?.label ?? r.entity}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{r.created}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        {r.skipped > 0 ? (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">{r.skipped}</span>
                        ) : (
                          <span className="text-surface-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Skipped reasons */}
          {result.results.some(r => r.skipped_reasons.length > 0) && (
            <div className="bg-white p-5 rounded-xl border border-surface-200 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-surface-700">Skipped Details</h3>
              {result.results.filter(r => r.skipped_reasons.length > 0).map(r => {
                const opt = ENTITY_OPTIONS.find(o => o.key === r.entity)
                return (
                  <div key={r.entity}>
                    <div className="text-xs font-medium text-surface-500 mb-1">{opt?.label ?? r.entity}</div>
                    <ul className="text-xs text-surface-600 space-y-0.5 max-h-32 overflow-auto">
                      {r.skipped_reasons.map((reason, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}

          {/* Next steps */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 space-y-1">
            <p className="font-medium">Next Steps:</p>
            <p>• Review carried-forward data on the <strong>Schedule</strong>, <strong>Sections</strong>, and <strong>Calendar</strong> pages</p>
            <p>• Schedule entries are in <strong>DRAFT</strong> — publish when ready</p>
            {result.results.some(r => r.entity === 'CALENDAR_EVENTS' && r.created > 0) && (
              <p>• Calendar event <strong>dates need updating</strong> on the Calendar page</p>
            )}
          </div>

          {/* Reset */}
          <div className="flex justify-end">
            <button onClick={handleReset} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">
              Carry Forward More
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
