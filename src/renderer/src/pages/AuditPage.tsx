import { useState, useEffect, useCallback } from 'react'
import type { IpcResponse, AuditLogEntry } from '@shared/types'

export default function AuditPage(): JSX.Element {
  const [records, setRecords] = useState<AuditLogEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [filters, setFilters] = useState({ entity_type: '', action: '' })
  const pageSize = 25

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listAuditLog({
      ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      limit: pageSize, offset: page * pageSize
    })) as IpcResponse<{ records: AuditLogEntry[]; total: number }>
    if (result.data) { setRecords(result.data.records); setTotal(result.data.total) }
    setLoading(false)
  }, [filters, page])

  useEffect(() => { load() }, [load])

  const totalPages = Math.ceil(total / pageSize)
  const actionColors: Record<string, string> = { CREATE: 'bg-green-100 text-green-700', UPDATE: 'bg-blue-100 text-blue-700', DELETE: 'bg-red-100 text-red-700', PUBLISH: 'bg-purple-100 text-purple-700', UNPUBLISH: 'bg-amber-100 text-amber-700', OVERRIDE: 'bg-orange-100 text-orange-700' }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Audit Log</h1>

      <div className="flex gap-3 items-center">
        <select value={filters.entity_type} onChange={(e) => { setFilters(f => ({ ...f, entity_type: e.target.value })); setPage(0) }}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Entities</option>
          {['academic_year', 'semester', 'calendar_event', 'room', 'section', 'personnel', 'schedule_entry', 'schedule_template', 'template_application', 'settings'].map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select value={filters.action} onChange={(e) => { setFilters(f => ({ ...f, action: e.target.value })); setPage(0) }}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
          <option value="">All Actions</option>
          {['CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'OVERRIDE'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="text-sm text-surface-500 ml-auto">{total} records</span>
      </div>

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : records.length === 0 ? <div className="text-center py-12 text-surface-400">No audit records found.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Entity</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Action</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Dept</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Details</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 text-surface-500 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="text-xs font-mono bg-surface-100 px-1.5 py-0.5 rounded">{r.entity_type}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${actionColors[r.action] ?? 'bg-surface-100 text-surface-600'}`}>{r.action}</span></td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{r.department ?? '—'}</td>
                  <td className="px-4 py-3 text-surface-500 text-xs truncate max-w-xs">{r.override_reason ? `Override: ${r.override_reason}` : r.entity_id.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-200">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Previous</button>
              <span className="text-sm text-surface-500">Page {page + 1} of {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="px-3 py-1 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
