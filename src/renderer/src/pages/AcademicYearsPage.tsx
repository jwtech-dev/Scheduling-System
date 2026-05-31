import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import type { IpcResponse, AcademicYear } from '@shared/types'

export default function AcademicYearsPage(): JSX.Element {
  const { department } = useDepartment()
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ label: '', start_date: '', end_date: '', is_active: false })
  const [error, setError] = useState<string | null>(null)

  const loadYears = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listAcademicYears(department)) as IpcResponse<AcademicYear[]>
    if (result.data) setYears(result.data)
    setLoading(false)
  }, [department])

  useEffect(() => { loadYears() }, [loadYears])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload = { ...form, department, is_active: form.is_active }
    const result = editingId
      ? (await window.electronAPI.updateAcademicYear({ id: editingId, ...payload })) as IpcResponse
      : (await window.electronAPI.createAcademicYear(payload)) as IpcResponse
    if (result.error) { setError(result.error.message); return }
    setShowForm(false); setEditingId(null); setForm({ label: '', start_date: '', end_date: '', is_active: false })
    loadYears()
  }

  const startEdit = (ay: AcademicYear) => {
    setEditingId(ay.id); setForm({ label: ay.label, start_date: ay.start_date, end_date: ay.end_date, is_active: !!ay.is_active })
    setShowForm(true); setError(null)
  }

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
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
              {editingId ? 'Update' : 'Create'}
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
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Label</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Start</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">End</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {years.map((ay) => (
                <tr key={ay.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{ay.label}</td>
                  <td className="px-4 py-3 text-surface-600">{ay.start_date}</td>
                  <td className="px-4 py-3 text-surface-600">{ay.end_date}</td>
                  <td className="px-4 py-3">
                    {ay.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-100 text-surface-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(ay)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
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
