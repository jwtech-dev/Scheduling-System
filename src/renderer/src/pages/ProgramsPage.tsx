import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, Program } from '@shared/types'

export default function ProgramsPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listPrograms({ department })) as IpcResponse<Program[]>
    if (result.data) setPrograms(result.data)
    setLoading(false)
  }, [department])

  useEffect(() => { load() }, [load])

  const filtered = search.trim()
    ? programs.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : programs

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      if (editingId) {
        const result = (await window.electronAPI.updateProgram({
          id: editingId,
          name: form.name,
          description: form.description || null
        })) as IpcResponse
        if (result.error) { setError(result.error.message); return }
        toast.success('Program updated')
      } else {
        const result = (await window.electronAPI.createProgram({
          name: form.name,
          description: form.description || null,
          department
        })) as IpcResponse
        if (result.error) { setError(result.error.message); return }
        toast.success('Program created')
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: '', description: '' })
      load()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    // Fetch impact counts before showing confirmation
    const impactResult = (await window.electronAPI.getProgramDeleteImpact(id)) as IpcResponse<{ subjectCount: number; sectionCount: number }>
    const impact = impactResult.data ?? { subjectCount: 0, sectionCount: 0 }

    const warnings: string[] = []
    if (impact.subjectCount > 0) warnings.push(`${impact.subjectCount} subject${impact.subjectCount > 1 ? 's' : ''}`)
    if (impact.sectionCount > 0) warnings.push(`${impact.sectionCount} section${impact.sectionCount > 1 ? 's' : ''}`)

    const warningText = warnings.length > 0
      ? `\n\nThis will also delete ${warnings.join(' and ')} under this program.`
      : ''

    const confirmed = await confirm({
      title: 'Delete Program',
      message: `Are you sure you want to delete "${name}"?${warningText}\n\nThis action cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteProgram(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Program deleted'); load() }
  }

  const startEdit = (p: Program) => {
    setEditingId(p.id)
    setForm({ name: p.name, description: p.description ?? '' })
    setShowForm(true)
    setError(null)
  }

  const openNewForm = () => {
    setEditingId(null)
    setForm({ name: '', description: '' })
    setShowForm(true)
    setError(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Programs</h1>
          <p className="text-sm text-surface-500 mt-0.5">
            {department === 'SHS' ? 'Manage strands and tracks' : 'Manage course programs and curricula'}. Programs must be created before adding subjects.
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programs..."
            className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-48"
          />
          <button
            onClick={openNewForm}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
          >
            + New Program
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-16 text-surface-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-surface-500 font-medium">
            {search ? 'No matching programs found.' : 'No programs yet.'}
          </p>
          <p className="text-surface-400 text-sm mt-1">
            {search ? 'Try a different search term.' : 'Click "+ New Program" to create your first program.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-surface-600">Program Name</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Description</th>
                <th className="text-left px-4 py-3 font-semibold text-surface-600">Created</th>
                <th className="text-right px-5 py-3 font-semibold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-700 font-bold text-xs">{p.name.charAt(0)}</span>
                      </div>
                      <span className="font-semibold text-surface-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-surface-500 text-sm">{p.description || '—'}</td>
                  <td className="px-4 py-3 text-surface-400 text-xs">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(p)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(p.id, p.name)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]"
          onClick={() => { setShowForm(false); setError(null) }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[28rem] animate-[modal-dialog-in_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900">{editingId ? 'Edit' : 'New'} Program</h2>
                  <p className="text-xs text-surface-500">
                    {editingId
                      ? 'Update program details below.'
                      : department === 'SHS'
                        ? 'Add a new strand or track.'
                        : 'Add a new course program or curriculum.'}
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  {department === 'SHS' ? 'Strand/Track Name' : 'Program Name'}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={department === 'SHS' ? 'e.g. STEM, ABM, HUMSS' : 'e.g. BSIT, BSCS, BSA'}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Description <span className="text-surface-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={department === 'SHS' ? 'e.g. Science, Technology, Engineering, Mathematics' : 'e.g. Bachelor of Science in Information Technology'}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(null) }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 shadow-sm transition-colors"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
