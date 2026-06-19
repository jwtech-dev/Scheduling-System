import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Personnel, SubjectBankEntry } from '@shared/types'
import ExportDropdown from '../components/ExportDropdown'

const TYPE_COLORS: Record<string, { bg: string; border: string; accent: string; text: string; icon: string; hoverBorder: string; ring: string }> = {
  FACULTY: { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-600', text: 'text-blue-700', icon: 'text-blue-500', hoverBorder: 'hover:border-blue-400', ring: 'ring-blue-200' },
  STAFF: { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-600', text: 'text-emerald-700', icon: 'text-emerald-500', hoverBorder: 'hover:border-emerald-400', ring: 'ring-emerald-200' },
  ADMIN: { bg: 'bg-violet-50', border: 'border-violet-200', accent: 'bg-violet-600', text: 'text-violet-700', icon: 'text-violet-500', hoverBorder: 'hover:border-violet-400', ring: 'ring-violet-200' },
}
const DEFAULT_COLOR = { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-600', text: 'text-amber-700', icon: 'text-amber-500', hoverBorder: 'hover:border-amber-400', ring: 'ring-amber-200' }
const TYPE_LABELS: Record<string, string> = { FACULTY: 'Faculty', STAFF: 'Staff', ADMIN: 'Admin' }

function TypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'FACULTY') return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
  if (type === 'STAFF') return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
  if (type === 'ADMIN') return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
  return <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
}

export default function PersonnelPage(): JSX.Element {
  const navigate = useNavigate()
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 25
  const [form, setForm] = useState({ employee_id: '', first_name: '', last_name: '', email: '', department: department, is_shared: false, personnel_type: 'FACULTY' as string, specializations: '', max_weekly_hours: 40, honorific: '', credentials: '' })

  // Card / drill-down state
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Subject Bank integration
  const [subjectBankItems, setSubjectBankItems] = useState<SubjectBankEntry[]>([])
  const [specSearch, setSpecSearch] = useState('')
  const [showSpecDropdown, setShowSpecDropdown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listPersonnel({ department, search: search || undefined, is_shared: true })) as IpcResponse<Personnel[]>
    if (result.data) setPersonnel(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { load(); setPage(0) }, [load])

  // Reset drill-down when department changes
  useEffect(() => {
    setSelectedType(null)
    setSearch('')
    setPage(0)
  }, [department])

  // Load subject bank for specializations dropdown
  useEffect(() => {
    (async () => {
      const result = (await window.electronAPI.listSubjectBank({ department })) as IpcResponse<SubjectBankEntry[]>
      if (result.data) setSubjectBankItems(result.data)
    })()
  }, [department])
  useEffect(() => { setForm(f => ({ ...f, department })) }, [department])

  // Group personnel by type for card view
  const typeGroups = useMemo(() => {
    const map = new Map<string, Personnel[]>()
    for (const p of personnel) {
      const key = p.personnel_type
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(p)
    }
    // Ensure consistent order: FACULTY, STAFF, ADMIN, then any others
    const order = ['FACULTY', 'STAFF', 'ADMIN']
    const sortedKeys = [...map.keys()].sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b)
      if (ia !== -1 && ib !== -1) return ia - ib
      if (ia !== -1) return -1
      if (ib !== -1) return 1
      return a.localeCompare(b)
    })
    return sortedKeys.map(type => {
      const list = map.get(type)!
      const activeCount = list.filter(p => p.status === 'ACTIVE').length
      const sharedCount = list.filter(p => p.is_shared).length
      return { type, count: list.length, activeCount, sharedCount }
    })
  }, [personnel])

  // Filtered personnel for the detail view
  const filteredPersonnel = useMemo(() => {
    if (!selectedType) return personnel
    return personnel.filter(p => p.personnel_type === selectedType)
  }, [personnel, selectedType])

  const totalPages = Math.ceil(filteredPersonnel.length / pageSize)
  const paginated = filteredPersonnel.slice(page * pageSize, (page + 1) * pageSize)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    setIsSubmitting(true)
    try {
      const specs = form.specializations.split(',').map(s => s.trim()).filter(Boolean)
      const payload = { ...form, specializations: specs, max_weekly_hours: Number(form.max_weekly_hours), honorific: form.honorific || null, credentials: form.credentials || null }
      const result = editingId
        ? (await window.electronAPI.updatePersonnel({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createPersonnel(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Personnel updated successfully' : 'Personnel created successfully')
      setShowForm(false); setEditingId(null); resetForm(); load()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Personnel',
      message: `Are you sure you want to delete "${name}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: 'Associated schedule entries referencing this personnel will be affected.'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deletePersonnel(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Personnel deleted'); load() }
  }

  const startEdit = (p: Personnel) => {
    const specs: string[] = JSON.parse(p.specializations || '[]')
    setEditingId(p.id); setForm({ employee_id: p.employee_id, first_name: p.first_name, last_name: p.last_name, email: p.email, department: p.department, is_shared: !!p.is_shared, personnel_type: p.personnel_type, specializations: specs.join(', '), max_weekly_hours: p.max_weekly_hours, honorific: p.honorific ?? '', credentials: p.credentials ?? '' })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({ employee_id: '', first_name: '', last_name: '', email: '', department, is_shared: false, personnel_type: 'FACULTY', specializations: '', max_weekly_hours: 40, honorific: '', credentials: '' })

  const openNewPersonnelForm = () => {
    resetForm()
    if (selectedType) {
      setForm(f => ({ ...f, personnel_type: selectedType }))
    }
    setEditingId(null)
    setShowForm(true)
    setError(null)
  }

  const handleDownloadTemplate = async () => {
    const result = (await window.electronAPI.downloadImportTemplate('PERSONNEL')) as IpcResponse<{ success: boolean }>
    if (result.error) toast.error(result.error.message)
    else if (result.data?.success) toast.success('Template saved')
  }

  const handleImportUpload = async () => {
    setImportLoading(true)
    setImportError(null)
    try {
      const res = (await window.electronAPI.uploadImport({ target: 'PERSONNEL', department })) as IpcResponse<Record<string, unknown>>
      if (res.error) { setImportError(res.error.message); return }
      if (!res.data) return
      const d = res.data as Record<string, unknown>
      setImportPreview({
        headers: d.headers as string[],
        rows: (d.preview ?? d.rows) as Record<string, string>[],
        total: (d.total_rows ?? d.total) as number,
        file_name: d.file_name as string,
        parsed: d.parsed as Record<string, string>[]
      })
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportLoading(false)
    }
  }

  const handleImportCommit = async () => {
    if (!importPreview) return
    setImportLoading(true)
    setImportError(null)
    try {
      const res = (await window.electronAPI.commitImport({ target: 'PERSONNEL', parsed: importPreview.parsed, file_name: importPreview.file_name, department })) as IpcResponse<{ created: number; updated: number; skipped: number; errors: string[] }>
      if (res.error) { setImportError(res.error.message); return }
      if (res.data) {
        setImportResult(res.data)
        setImportPreview(null)
        load()
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Commit failed')
    } finally {
      setImportLoading(false)
    }
  }

  const handleCancelImport = () => {
    setImportPreview(null)
    setImportResult(null)
    setImportLoading(false)
    setImportError(null)
  }

  const handleBackToTypes = () => {
    setSelectedType(null)
    setSearch('')
    setPage(0)
  }

  // ===================== RENDER =====================

  // --- Cards view (default) ---
  if (!selectedType) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-surface-900">Personnel</h1>
          <div className="flex gap-3">
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search personnel..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
            <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium transition-colors" title="Download template">📄 Template</button>
            <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50 transition-colors">
              {importLoading ? 'Processing...' : '📥 Import File'}
            </button>
            <ExportDropdown target="personnel" department={department} />
            <button onClick={openNewPersonnelForm} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">+ New Personnel</button>
          </div>
        </div>

        {/* Import feedback */}
        {importError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
            <span>{importError}</span>
            <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
          </div>
        )}
        {importPreview && renderImportPreview()}
        {importResult && renderImportResult()}

        {/* Type cards */}
        {loading ? (
          <div className="text-center py-16 text-surface-400">Loading...</div>
        ) : typeGroups.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <p className="text-surface-500 font-medium">No personnel yet.</p>
            <p className="text-surface-400 text-sm mt-1">Click "+ New Personnel" or import a file to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeGroups.map(group => {
              const color = TYPE_COLORS[group.type] ?? DEFAULT_COLOR
              return (
                <button
                  key={group.type}
                  onClick={() => { setSelectedType(group.type); setPage(0) }}
                  className={`${color.bg} ${color.border} ${color.hoverBorder} border-2 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-md hover:ring-2 ${color.ring} hover:-translate-y-0.5 group focus:outline-none focus:ring-2 ${color.ring}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${color.accent} flex items-center justify-center shadow-sm`}>
                      <TypeIcon type={group.type} className="text-white" />
                    </div>
                    <svg className={`w-5 h-5 ${color.icon} opacity-0 group-hover:opacity-100 transition-opacity`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                  <h3 className={`text-lg font-bold ${color.text} mb-1`}>{TYPE_LABELS[group.type] ?? group.type}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-surface-700">{group.count}</span>
                      <span className="text-xs text-surface-500">personnel</span>
                    </div>
                    <span className="text-surface-300">·</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-semibold text-green-700">{group.activeCount}</span>
                      <span className="text-xs text-surface-500">active</span>
                    </div>
                    {group.sharedCount > 0 && (
                      <>
                        <span className="text-surface-300">·</span>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-primary-700">{group.sharedCount}</span>
                          <span className="text-xs text-surface-500">shared</span>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {showForm && renderFormModal()}
      </div>
    )
  }

  // --- Detail view (selected type) ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleBackToTypes} className="w-9 h-9 rounded-lg bg-surface-100 hover:bg-surface-200 flex items-center justify-center text-surface-600 transition-colors" title="Back to all types">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-2xl font-bold text-surface-900">{TYPE_LABELS[selectedType] ?? selectedType}</h1>
        </div>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} placeholder="Search personnel..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={openNewPersonnelForm} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors">+ New Personnel</button>
        </div>
      </div>

      {/* Import feedback */}
      {importError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-center justify-between">
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">✕</button>
        </div>
      )}
      {importPreview && renderImportPreview()}
      {importResult && renderImportResult()}

      {/* Table */}
      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : filteredPersonnel.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-400">No personnel found{search ? ' matching filters.' : '.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Employee ID</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Full Name</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Email Address</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/personnel/${encodeURIComponent(p.employee_id)}`)} className="hover:bg-surface-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3 font-medium text-surface-900">{p.employee_id}</td>
                  <td className="px-4 py-3 text-surface-600">{p.last_name}, {p.first_name} {p.is_shared ? <span className="ml-1 text-xs text-primary-600">(shared)</span> : ''}</td>
                  <td className="px-4 py-3 text-surface-500">{p.email}</td>
                  <td className="px-4 py-3 text-surface-600">{p.department}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={(e) => { e.stopPropagation(); startEdit(p) }} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id, `${p.last_name}, ${p.first_name}`) }} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Previous</button>
              <span className="text-sm text-surface-500">Page {page + 1} of {totalPages} · {filteredPersonnel.length} total</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}

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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-surface-900">{editingId ? 'Edit' : 'New'} Personnel</h2>
                <p className="text-xs text-surface-500">{editingId ? 'Update personnel details below.' : 'Fill in the details to add new personnel.'}</p>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Employee ID</label><input type="text" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. EMP-001" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name</label><input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Juan" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name</label><input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Dela Cruz" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan.delacruz@school.edu" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Honorific</label>
                <select value={form.honorific} onChange={(e) => setForm({ ...form, honorific: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">— None —</option>
                  <option value="Mr.">Mr.</option><option value="Ms.">Ms.</option><option value="Mrs.">Mrs.</option><option value="Dr.">Dr.</option><option value="Prof.">Prof.</option><option value="Engr.">Engr.</option>
                </select></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Credentials / Suffix</label><input type="text" value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} placeholder="e.g. LPT, MAEd, PhD" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Personnel Type</label>
                <select value={form.personnel_type} onChange={(e) => setForm({ ...form, personnel_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="FACULTY">Faculty</option><option value="STAFF">Staff</option><option value="ADMIN">Admin</option>
                </select></div>
              <div><label className="block text-sm font-medium text-surface-700 mb-1">Max Weekly Hours</label><input type="number" value={form.max_weekly_hours} onChange={(e) => setForm({ ...form, max_weekly_hours: parseInt(e.target.value) || 40 })} placeholder="40" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={1} max={80} /></div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-4 relative">
                <label className="block text-sm font-medium text-surface-700 mb-1">Specializations (from Subject Bank)</label>
                {/* Selected tags */}
                {form.specializations && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {form.specializations.split(',').filter(Boolean).map(s => (
                      <span key={s.trim()} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                        {s.trim()}
                        <button type="button" onClick={() => { const specs = form.specializations.split(',').map(x => x.trim()).filter(x => x && x !== s.trim()); setForm({ ...form, specializations: specs.join(', ') }) }} className="text-primary-400 hover:text-primary-700">×</button>
                      </span>
                    ))}
                  </div>
                )}
                <input type="text" value={specSearch} onChange={(e) => { setSpecSearch(e.target.value); setShowSpecDropdown(true) }} onFocus={() => setShowSpecDropdown(true)} onBlur={() => setTimeout(() => setShowSpecDropdown(false), 200)} placeholder="Search subjects to add..." className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                {showSpecDropdown && (() => {
                  const currentSpecs = form.specializations.split(',').map(s => s.trim()).filter(Boolean)
                  const q = specSearch.toLowerCase()
                  const filtered = subjectBankItems.filter(s => !q || s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q)).slice(0, 15)
                  return filtered.length > 0 ? (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filtered.map(s => {
                        const isSelected = currentSpecs.includes(s.subject_name)
                        return (
                          <button key={s.id} type="button" onMouseDown={() => {
                            if (isSelected) {
                              setForm({ ...form, specializations: currentSpecs.filter(x => x !== s.subject_name).join(', ') })
                            } else {
                              setForm({ ...form, specializations: [...currentSpecs, s.subject_name].join(', ') })
                            }
                            setSpecSearch('')
                          }} className={`w-full text-left px-3 py-2 text-sm flex justify-between items-center ${isSelected ? 'bg-primary-50' : 'hover:bg-surface-50'}`}>
                            <span className="flex items-center gap-2">
                              <span className={`w-4 h-4 border rounded flex items-center justify-center text-xs ${isSelected ? 'bg-primary-600 border-primary-600 text-white' : 'border-surface-300'}`}>{isSelected ? '✓' : ''}</span>
                              <span className="text-surface-800">{s.subject_name}</span>
                            </span>
                            <span className="text-xs text-surface-400">{s.subject_code}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : null
                })()}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_shared} onChange={(e) => setForm({ ...form, is_shared: e.target.checked })} className="rounded border-surface-300" /> Shared across departments</label>
            <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors">Cancel</button>
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
      <div className="bg-white p-6 rounded-xl border-2 border-amber-400 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-amber-800">📥 Import Preview — {importPreview.file_name}</h2>
          <span className="text-sm text-surface-500">{importPreview.total} row{importPreview.total !== 1 ? 's' : ''} found</span>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto border border-surface-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-amber-50 border-b border-amber-200 sticky top-0">
              <tr>
                {importPreview.headers.map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-amber-800 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {importPreview.rows.slice(0, 10).map((row, i) => (
                <tr key={i} className="hover:bg-amber-50/50">
                  {importPreview.headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-surface-600 whitespace-nowrap">{row[h] ?? ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {importPreview.total > 10 && (
          <p className="text-xs text-surface-400">Showing first 10 of {importPreview.total} rows</p>
        )}
        <div className="flex gap-2">
          <button onClick={handleImportCommit} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
            {importLoading ? 'Importing...' : `Import ${importPreview.total} Row${importPreview.total !== 1 ? 's' : ''}`}
          </button>
          <button onClick={handleCancelImport} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
        </div>
      </div>
    )
  }

  function renderImportResult() {
    if (!importResult) return null
    return (
      <div className="bg-white p-6 rounded-xl border-2 border-green-400 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-green-800">✅ Import Complete</h2>
          <button onClick={() => setImportResult(null)} className="text-surface-400 hover:text-surface-600 font-bold">✕</button>
        </div>
        <div className="flex gap-6 text-sm">
          <span className="text-green-700 font-medium">Created: {importResult.created}</span>
          <span className="text-blue-700 font-medium">Updated: {importResult.updated}</span>
          <span className="text-surface-500 font-medium">Skipped: {importResult.skipped}</span>
        </div>
        {importResult.errors.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium text-red-700">Errors ({importResult.errors.length}):</p>
            <ul className="list-disc list-inside text-sm text-red-600 max-h-32 overflow-y-auto">
              {importResult.errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
}
