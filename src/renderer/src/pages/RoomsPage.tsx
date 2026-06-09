import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Room } from '@shared/types'

export default function RoomsPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
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
    const deptFilter = department === 'SHS' ? 'SHS_ONLY' : department === 'COLLEGE' ? 'COLLEGE_ONLY' : undefined
    const result = (await window.electronAPI.listRooms({ search: search || undefined })) as IpcResponse<Room[]>
    if (result.data) setRooms(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { loadRooms() }, [loadRooms])

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
  const handleDownloadTemplate = async () => {
    const res = (await window.electronAPI.downloadImportTemplate('ROOMS')) as IpcResponse<{ success: boolean }>
    if (res.error) toast.error(res.error.message)
    else toast.success('Template saved')
  }

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

  const statusColors: Record<string, string> = { AVAILABLE: 'bg-green-100 text-green-700', MAINTENANCE: 'bg-yellow-100 text-yellow-700', INACTIVE: 'bg-surface-100 text-surface-500' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Rooms</h1>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search rooms..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium" title="Download template">📄 Template</button>
          <button onClick={handleImportUpload} disabled={importLoading} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium disabled:opacity-50">
            {importLoading ? 'Processing...' : '📥 Import File'}
          </button>
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
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Room</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Number</label><input type="text" value={form.room_code} onChange={(e) => setForm({ ...form, room_code: e.target.value })} placeholder="e.g. RM-201, LAB-3" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Name</label><input type="text" value={form.room_name} onChange={(e) => setForm({ ...form, room_name: e.target.value })} placeholder="e.g. Lecture Hall A" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Building</label><input type="text" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="e.g. Main Bldg, Annex" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Seat Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 1 })} placeholder="30" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={1} max={10000} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Floor Level</label><input type="text" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} placeholder="e.g. 2nd Floor, Ground" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Room Type</label><input type="text" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Lecture Hall, Computer Lab" /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Dept. Availability</label>
              <select value={form.department_availability} onChange={(e) => setForm({ ...form, department_availability: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="SHARED">Shared</option><option value="SHS_ONLY">SHS Only</option><option value="COLLEGE_ONLY">College Only</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : rooms.length === 0 ? <div className="text-center py-12 text-surface-400">No rooms yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Room No.</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Room Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Building</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Seats</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {rooms.map((r) => (
                <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{r.room_code}</td>
                  <td className="px-4 py-3 text-surface-600">{r.room_name}</td>
                  <td className="px-4 py-3 text-surface-600">{r.building ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-600">{r.capacity}</td>
                  <td className="px-4 py-3"><span className="text-xs font-medium">{r.department_availability}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[r.status] ?? ''}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(r)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(r.id, r.room_code)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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
