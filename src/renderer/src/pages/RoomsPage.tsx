import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Room } from '@shared/types'
import ExportDropdown from '../components/ExportDropdown'

export default function RoomsPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const CARDS_PER_PAGE = 6
  const [form, setForm] = useState({ room_code: '', room_name: '', building: '', floor: '', capacity: 30, room_type: '', department_availability: 'SHARED' as string, notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Import state
  const [importPreview, setImportPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const loadRooms = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listRooms({ department, search: search || undefined })) as IpcResponse<Room[]>
    if (result.data) setRooms(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { loadRooms() }, [loadRooms])

  // Reset to page 1 when search or department changes
  useEffect(() => { setCurrentPage(1) }, [search, department])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    const capacityNum = Number(form.capacity)
    if (capacityNum < 1 || capacityNum > 10000) {
      setError('Capacity must be between 1 and 10,000.')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = { ...form, capacity: capacityNum }
      const result = editingId
        ? (await window.electronAPI.updateRoom({ id: editingId, ...payload })) as IpcResponse
        : (await window.electronAPI.createRoom(payload)) as IpcResponse
      if (result.error) { setError(result.error.message); return }
      toast.success(editingId ? 'Room updated successfully' : 'Room created successfully')
      setShowForm(false); setEditingId(null); resetForm(); loadRooms()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Room',
      message: `Are you sure you want to delete "${name}"?`,
      variant: 'danger',
      confirmLabel: 'Delete',
      cascadeInfo: 'Schedule entries using this room will lose their room assignment.'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteRoom(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Room deleted'); loadRooms() }
  }

  const startEdit = (r: Room) => {
    setEditingId(r.id); setForm({ room_code: r.room_code, room_name: r.room_name, building: r.building ?? '', floor: r.floor ?? '', capacity: r.capacity, room_type: r.room_type ?? '', department_availability: r.department_availability, notes: r.notes ?? '' })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({ room_code: '', room_name: '', building: '', floor: '', capacity: 30, room_type: '', department_availability: 'SHARED', notes: '' })

  // ── Import handlers ──────────────────────────────────────────

  const handleImportUpload = async () => {
    setImportError(null); setImportResult(null); setImportPreview(null); setImportLoading(true)
    const res = (await window.electronAPI.uploadImport({
      target: 'ROOMS',
      department
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
    setImportLoading(true); setImportError(null)
    const res = (await window.electronAPI.commitImport({
      target: 'ROOMS',
      parsed: importPreview.parsed,
      file_name: importPreview.file_name,
      department
    })) as IpcResponse<{ created: number; updated: number; skipped: number; errors: string[] }>
    if (res.error) { setImportError(res.error.message); setImportLoading(false); return }
    if (res.data) setImportResult(res.data)
    setImportPreview(null); setImportLoading(false)
    loadRooms()
  }

  const handleCancelImport = () => { setImportPreview(null); setImportResult(null); setImportError(null) }

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    AVAILABLE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    MAINTENANCE: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    INACTIVE: { bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-400' }
  }

  const deptLabels: Record<string, string> = { SHARED: 'Shared', SHS_ONLY: 'SHS Only', COLLEGE_ONLY: 'College Only' }
  const deptColors: Record<string, string> = { SHARED: 'bg-blue-50 text-blue-700', SHS_ONLY: 'bg-purple-50 text-purple-700', COLLEGE_ONLY: 'bg-indigo-50 text-indigo-700' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end sticky top-0 z-10 bg-surface-50 pb-4 -mx-6 px-6 pt-4">
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rooms..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
            {importLoading ? 'Processing...' : '📥 Import File'}
          </button>
          <ExportDropdown target="rooms" />
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Room</button>
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]" onClick={() => { setShowForm(false); setError(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[44rem] max-h-[85vh] overflow-y-auto animate-[modal-dialog-in_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900">{editingId ? 'Edit' : 'New'} Room</h2>
                  <p className="text-xs text-surface-500">{editingId ? 'Update room details below.' : 'Fill in the details to add a new room.'}</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Number</label><input type="text" value={form.room_code} onChange={(e) => setForm({ ...form, room_code: e.target.value.toUpperCase() })} placeholder="e.g. RM-201, LAB-3" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Name</label><input type="text" value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} placeholder="e.g. Lecture Hall A" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Building</label><input type="text" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="e.g. Main Bldg, Annex" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Floor Level</label><input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. 2nd Floor, Ground" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Seat Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} placeholder="30" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={1} max={10000} required /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Type</label><input type="text" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Lecture Hall, Computer Lab" /></div>
                <div><label className="block text-sm font-medium text-surface-700 mb-1">Dept. Availability</label>
                  <select value={form.department_availability} onChange={(e) => setForm({ ...form, department_availability: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="SHARED">Shared</option><option value="SHS_ONLY">SHS Only</option><option value="COLLEGE_ONLY">College Only</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm transition-colors">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading...</div>
      ) : rooms.length === 0 ? (
        /* ── Onboarding empty state ─────────────────────────────── */
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-sm w-full max-w-2xl overflow-hidden">
            {/* Hero banner */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-10 text-white text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Set Up Your Rooms</h2>
              <p className="text-primary-100 text-sm max-w-md mx-auto">
                Rooms are the physical spaces where classes, exams, and events are held.
                Add them here so you can assign them when building your schedule.
              </p>
            </div>

            {/* Steps */}
            <div className="px-8 py-6 space-y-4">
              <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Quick Start — Choose one</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option A — Import */}
                <button
                  onClick={handleImportUpload}
                  disabled={importLoading}
                  className="flex items-start gap-4 p-5 rounded-xl border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-lg group-hover:scale-105 transition-transform">
                    📥
                  </div>
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">Import from Excel</p>
                    <p className="text-xs text-surface-500 mt-0.5">Upload an Excel file with multiple rooms at once. Best for large setups.</p>
                    <span className="inline-block mt-2 text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">Recommended for bulk setup</span>
                  </div>
                </button>

                {/* Option B — Manual */}
                <button
                  onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }}
                  className="flex items-start gap-4 p-5 rounded-xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 hover:border-primary-400 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center flex-shrink-0 text-lg group-hover:scale-105 transition-transform">
                    ➕
                  </div>
                  <div>
                    <p className="font-semibold text-surface-800 text-sm">Add Your First Room</p>
                    <p className="text-xs text-surface-500 mt-0.5">Manually enter a room's code, name, capacity, and availability settings.</p>
                    <span className="inline-block mt-2 text-[10px] font-medium text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full border border-primary-200">Start small, grow later</span>
                  </div>
                </button>
              </div>

              {/* Info chips */}
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
                  <span>🏢</span> Track building &amp; floor
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
                  <span>💺</span> Set seat capacity
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
                  <span>🏷️</span> Assign room type
                </div>
                <div className="flex items-center gap-2 text-xs text-surface-500 bg-surface-50 px-3 py-1.5 rounded-full border border-surface-200">
                  <span>🔒</span> Control dept. access
                </div>
              </div>
            </div>

            {/* Footer hint */}
            <div className="px-8 py-4 bg-surface-50 border-t border-surface-100 text-center">
              <p className="text-xs text-surface-400">
                Need a template? Go to <strong>Tools → Export Template</strong> in the sidebar.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Rooms grid — always 3 columns, 2 rows = 6 cards per page */}
          <div className="grid grid-cols-3 gap-4">
            {rooms.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE).map((r) => {
              const sc = statusConfig[r.status] ?? statusConfig.INACTIVE
              return (
                <div
                  key={r.id}
                  onClick={() => navigate(`/rooms/${r.id}`)}
                  className="bg-white rounded-xl border border-surface-200 shadow-sm hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer group flex flex-col"
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-3 flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                          {r.room_code.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-surface-900 truncate group-hover:text-primary-700 transition-colors">{r.room_code}</h3>
                          <p className="text-xs text-surface-500 truncate">{r.room_name}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${sc.bg} ${sc.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                        {r.status}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="mt-3 space-y-1.5">
                      {(r.building || r.floor) && (
                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                          <span className="text-surface-400">🏢</span>
                          <span className="truncate">{[r.building, r.floor].filter(Boolean).join(' · ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <span className="text-surface-400">💺</span>
                        <span>{r.capacity} seats</span>
                      </div>
                      {r.room_type && (
                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                          <span className="text-surface-400">🏷️</span>
                          <span className="truncate">{r.room_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="px-5 py-3 border-t border-surface-100 flex items-center justify-between">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${deptColors[r.department_availability] ?? ''}`}>
                      {deptLabels[r.department_availability] ?? r.department_availability}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); startEdit(r) }} className="text-primary-600 hover:text-primary-800 text-xs font-medium hover:underline">Edit</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id, r.room_code) }} className="text-red-500 hover:text-red-700 text-xs font-medium hover:underline">Delete</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination controls — only shown when there are more than 6 rooms */}
          {rooms.length > CARDS_PER_PAGE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-surface-400">
                Showing {Math.min((currentPage - 1) * CARDS_PER_PAGE + 1, rooms.length)}–{Math.min(currentPage * CARDS_PER_PAGE, rooms.length)} of {rooms.length} rooms
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.ceil(rooms.length / CARDS_PER_PAGE) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'border border-surface-200 text-surface-600 hover:bg-surface-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(rooms.length / CARDS_PER_PAGE), p + 1))}
                  disabled={currentPage === Math.ceil(rooms.length / CARDS_PER_PAGE)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-surface-200 text-surface-600 hover:bg-surface-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
