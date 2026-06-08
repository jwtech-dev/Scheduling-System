import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Personnel } from '@shared/types'

export default function PersonnelPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ employee_id: '', first_name: '', last_name: '', email: '', department: department, is_shared: false, personnel_type: 'FACULTY' as string, specializations: '', max_weekly_hours: 40 })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listPersonnel({ department, search: search || undefined, is_shared: true })) as IpcResponse<Personnel[]>
    if (result.data) setPersonnel(result.data)
    setLoading(false)
  }, [department, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setForm(f => ({ ...f, department })) }, [department])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    setIsSubmitting(true)
    try {
      const specs = form.specializations.split(',').map(s => s.trim()).filter(Boolean)
      const payload = { ...form, specializations: specs, max_weekly_hours: Number(form.max_weekly_hours) }
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
    setEditingId(p.id); setForm({ employee_id: p.employee_id, first_name: p.first_name, last_name: p.last_name, email: p.email, department: p.department, is_shared: !!p.is_shared, personnel_type: p.personnel_type, specializations: specs.join(', '), max_weekly_hours: p.max_weekly_hours })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({ employee_id: '', first_name: '', last_name: '', email: '', department, is_shared: false, personnel_type: 'FACULTY', specializations: '', max_weekly_hours: 40 })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Personnel</h1>
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search personnel..." className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48" />
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Personnel</button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Personnel</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Employee ID</label><input type="text" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="e.g. EMP-001" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">First Name</label><input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Juan" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Last Name</label><input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Dela Cruz" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Email Address</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="juan.delacruz@school.edu" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Personnel Type</label>
              <select value={form.personnel_type} onChange={(e) => setForm({ ...form, personnel_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                <option value="FACULTY">Faculty</option><option value="STAFF">Staff</option><option value="ADMIN">Admin</option>
              </select></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Max Weekly Hours</label><input type="number" value={form.max_weekly_hours} onChange={(e) => setForm({ ...form, max_weekly_hours: parseInt(e.target.value) || 40 })} placeholder="40" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={1} max={80} /></div>
            <div className="col-span-2"><label className="block text-sm font-medium text-surface-700 mb-1">Specializations</label><input type="text" value={form.specializations} onChange={(e) => setForm({ ...form, specializations: e.target.value })} placeholder="e.g. Mathematics, Physics, Computer Science" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_shared} onChange={(e) => setForm({ ...form, is_shared: e.target.checked })} className="rounded border-surface-300" /> Shared across departments</label>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-primary-400 text-sm font-medium">{isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : personnel.length === 0 ? <div className="text-center py-12 text-surface-400">No personnel yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Employee ID</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Full Name</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Email Address</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Department</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {personnel.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{p.employee_id}</td>
                  <td className="px-4 py-3 text-surface-600">{p.last_name}, {p.first_name} {p.is_shared ? <span className="ml-1 text-xs text-primary-600">(shared)</span> : ''}</td>
                  <td className="px-4 py-3 text-surface-500">{p.email}</td>
                  <td className="px-4 py-3 text-surface-600">{p.personnel_type}</td>
                  <td className="px-4 py-3 text-surface-600">{p.department}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-surface-100 text-surface-500'}`}>{p.status}</span></td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(p)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id, `${p.last_name}, ${p.first_name}`)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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
