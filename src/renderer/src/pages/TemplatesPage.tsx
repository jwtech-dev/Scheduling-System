import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, ScheduleTemplate, ScheduleTemplateEntry } from '@shared/types'

export default function TemplatesPage(): JSX.Element {
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [previewEntries, setPreviewEntries] = useState<ScheduleTemplateEntry[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listTemplates()) as IpcResponse<ScheduleTemplate[]>
    if (result.data) setTemplates(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: 'Delete Template',
      message: `Are you sure you want to delete "${name}"? This cannot be undone.`,
      variant: 'danger',
      confirmLabel: 'Delete'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.deleteTemplate(id)) as IpcResponse
    if (result.error) toast.error(result.error.message)
    else { toast.success('Template deleted'); load() }
  }

  const togglePreview = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setPreviewEntries([])
      return
    }
    setExpandedId(id)
    setPreviewLoading(true)
    const result = (await window.electronAPI.getTemplateEntries(id)) as IpcResponse<ScheduleTemplateEntry[]>
    if (result.data) setPreviewEntries(result.data)
    setPreviewLoading(false)
  }

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Schedule Templates</h1>
        <p className="text-sm text-surface-500">Create templates from the Schedule Builder page</p>
      </div>

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : templates.length === 0 ? <div className="text-center py-12 text-surface-400">No templates yet. Create one from the schedule builder.</div> : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-surface-900">{t.name}</h3>
                    {t.description && <p className="text-sm text-surface-500 mt-0.5">{t.description}</p>}
                  </div>
                  <button onClick={() => handleDelete(t.id, t.name)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                </div>
                <div className="flex gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">{t.scope.replace(/_/g, ' ')}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">{t.department_scope}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">{t.source_department}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-surface-400">
                    Source: {t.source_academic_year_label} · Created: {new Date(t.created_at).toLocaleDateString()}
                  </div>
                  <button
                    onClick={() => togglePreview(t.id)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800"
                  >
                    {expandedId === t.id ? 'Hide Preview ▲' : 'Preview Entries ▼'}
                  </button>
                </div>
              </div>

              {expandedId === t.id && (
                <div className="border-t border-surface-200 bg-surface-50 px-5 py-3">
                  {previewLoading ? (
                    <div className="text-center py-4 text-surface-400 text-sm">Loading entries...</div>
                  ) : previewEntries.length === 0 ? (
                    <div className="text-center py-4 text-surface-400 text-sm">No entries in this template.</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-surface-500 mb-2">{previewEntries.length} entries</div>
                      <div className="max-h-48 overflow-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-surface-100">
                            <tr>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Type</th>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Subject</th>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Room</th>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Personnel</th>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Day</th>
                              <th className="text-left px-2 py-1.5 font-semibold text-surface-600">Time</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-surface-100">
                            {previewEntries.map((e) => (
                              <tr key={e.id} className="hover:bg-surface-100/50">
                                <td className="px-2 py-1.5">
                                  <span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${e.activity_type === 'EXAM' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {e.activity_type}
                                  </span>
                                </td>
                                <td className="px-2 py-1.5 text-surface-700">{e.subject ?? e.exam_title ?? '—'}</td>
                                <td className="px-2 py-1.5 text-surface-500">{e.room_code ?? '—'}</td>
                                <td className="px-2 py-1.5 text-surface-500">{e.employee_id ?? '—'}</td>
                                <td className="px-2 py-1.5 text-surface-500">{e.day_of_week != null ? DAY_NAMES[e.day_of_week] : '—'}</td>
                                <td className="px-2 py-1.5 text-surface-500 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
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
