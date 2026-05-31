import { useState, useEffect, useCallback } from 'react'
import type { IpcResponse, ScheduleTemplate, TemplateApplication } from '@shared/types'

export default function TemplatesPage(): JSX.Element {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listTemplates()) as IpcResponse<ScheduleTemplate[]>
    if (result.data) setTemplates(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    const result = (await window.electronAPI.deleteTemplate(id)) as IpcResponse
    if (result.error) alert(result.error.message)
    else load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Schedule Templates</h1>
        <p className="text-sm text-surface-500">Create templates from the Schedule Builder page</p>
      </div>

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : templates.length === 0 ? <div className="text-center py-12 text-surface-400">No templates yet. Create one from the schedule builder.</div> : (
        <div className="grid grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-surface-900">{t.name}</h3>
                  {t.description && <p className="text-sm text-surface-500 mt-0.5">{t.description}</p>}
                </div>
                <button onClick={() => handleDelete(t.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
              </div>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium">{t.scope.replace(/_/g, ' ')}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">{t.department_scope}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-100 text-surface-600 font-medium">{t.source_department}</span>
              </div>
              <div className="text-xs text-surface-400">
                Source: {t.source_academic_year_label} · Created: {new Date(t.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
