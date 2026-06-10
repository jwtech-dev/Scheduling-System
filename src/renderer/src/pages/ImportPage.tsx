import { useState } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import type { IpcResponse, ImportTarget } from '@shared/types'

export default function ImportPage(): JSX.Element {
  const { department } = useDepartment()
  const [target, setTarget] = useState<ImportTarget>('PERSONNEL')
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[]; total: number; file_name: string; parsed: Record<string, string>[] } | null>(null)
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownloadTemplate = async () => {
    const res = (await window.electronAPI.downloadImportTemplate(target)) as IpcResponse<{ success: boolean }>
    if (res.error) setError(res.error.message)
  }

  const handleUpload = async () => {
    setError(null); setResult(null); setPreview(null); setLoading(true)
    const res = (await window.electronAPI.uploadImport({ target, department })) as IpcResponse<typeof preview>
    if (res.error) { setError(res.error.message); setLoading(false); return }
    if (res.data?.total) setPreview(res.data)
    setLoading(false)
  }

  const handleCommit = async () => {
    if (!preview) return
    setLoading(true); setError(null)
    const res = (await window.electronAPI.commitImport({ target, parsed: preview.parsed, file_name: preview.file_name, department })) as IpcResponse<{ created: number; updated: number; skipped: number; errors: string[] }>
    if (res.error) { setError(res.error.message); setLoading(false); return }
    if (res.data) setResult(res.data)
    setPreview(null); setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-surface-900">Data Import</h1>

      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Import Target</label>
            <select value={target} onChange={(e) => { setTarget(e.target.value as ImportTarget); setPreview(null); setResult(null) }} className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="PERSONNEL">Personnel</option>
              <option value="SECTIONS">Sections</option>
              <option value="ROOMS">Rooms</option>
              <option value="CALENDAR_EVENTS">Calendar Events</option>
            </select>
          </div>
          <button onClick={handleDownloadTemplate} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Download Template</button>
          <button onClick={handleUpload} disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50">
            {loading ? 'Processing...' : 'Upload File'}
          </button>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      </div>

      {preview && (
        <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Preview — {preview.file_name} ({preview.total} rows)</h2>
            <button onClick={handleCommit} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50">
              {loading ? 'Importing...' : `Import ${preview.total} Rows`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface-50 border-b border-surface-200"><tr>
                {preview.headers.map(h => <th key={h} className="text-left px-3 py-2 font-semibold text-surface-600">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-surface-100">
                {preview.rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-surface-50">
                    {preview.headers.map(h => <td key={h} className="px-3 py-2 text-surface-600 truncate max-w-32">{row[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > 10 && <p className="text-xs text-surface-400">Showing first 10 of {preview.total} rows</p>}
        </div>
      )}

      {result && (
        <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-3">
          <h2 className="text-lg font-semibold text-green-700">Import Complete</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-green-50 rounded-lg text-center"><div className="text-2xl font-bold text-green-700">{result.created}</div><div className="text-xs text-green-600">Created</div></div>
            <div className="p-3 bg-blue-50 rounded-lg text-center"><div className="text-2xl font-bold text-blue-700">{result.updated}</div><div className="text-xs text-blue-600">Updated</div></div>
            <div className="p-3 bg-amber-50 rounded-lg text-center"><div className="text-2xl font-bold text-amber-700">{result.skipped}</div><div className="text-xs text-amber-600">Skipped</div></div>
          </div>
          {result.errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-sm font-semibold text-red-700 mb-1">Errors ({result.errors.length})</h3>
              <ul className="text-xs text-red-600 space-y-0.5 max-h-32 overflow-auto">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
