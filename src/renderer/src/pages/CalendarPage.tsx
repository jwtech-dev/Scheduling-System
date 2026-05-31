import { useState, useEffect, useCallback } from 'react'
import type { IpcResponse, CalendarEvent } from '@shared/types'
import { CALENDAR_EVENT_TYPES } from '@shared/constants'

export default function CalendarPage(): JSX.Element {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', event_type: 'HOLIDAY' as string, is_blocking: true, is_all_day: true, start_datetime: '', end_datetime: '', description: '' })
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.listCalendarEvents()) as IpcResponse<CalendarEvent[]>
    if (result.data) setEvents(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    const payload = { ...form, is_blocking: form.is_blocking, is_all_day: form.is_all_day }
    const result = editingId
      ? (await window.electronAPI.updateCalendarEvent({ id: editingId, ...payload })) as IpcResponse
      : (await window.electronAPI.createCalendarEvent(payload)) as IpcResponse
    if (result.error) { setError(result.error.message); return }
    setShowForm(false); setEditingId(null); resetForm(); load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return
    const result = (await window.electronAPI.deleteCalendarEvent(id)) as IpcResponse
    if (result.error) alert(result.error.message)
    else load()
  }

  const startEdit = (ev: CalendarEvent) => {
    setEditingId(ev.id); setForm({ title: ev.title, event_type: ev.event_type, is_blocking: !!ev.is_blocking, is_all_day: !!ev.is_all_day, start_datetime: ev.start_datetime.slice(0, 16), end_datetime: ev.end_datetime.slice(0, 16), description: ev.description ?? '' })
    setShowForm(true); setError(null)
  }

  const resetForm = () => setForm({ title: '', event_type: 'HOLIDAY', is_blocking: true, is_all_day: true, start_datetime: '', end_datetime: '', description: '' })

  const typeColors: Record<string, string> = { HOLIDAY: 'bg-red-100 text-red-700', EXAM_PERIOD: 'bg-purple-100 text-purple-700', BREAK: 'bg-blue-100 text-blue-700', INSTITUTIONAL_EVENT: 'bg-green-100 text-green-700', CUSTOM: 'bg-surface-100 text-surface-600' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Calendar Events</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); setError(null) }} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">+ New Event</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Calendar Event</h2>
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Type</label>
              <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                {CALENDAR_EVENT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select></div>
            <div className="flex items-end gap-4 pb-2">
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.is_blocking} onChange={(e) => setForm({ ...form, is_blocking: e.target.checked })} className="rounded border-surface-300" /> Blocking</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={form.is_all_day} onChange={(e) => setForm({ ...form, is_all_day: e.target.checked })} className="rounded border-surface-300" /> All Day</label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-surface-700 mb-1">Start</label><input type={form.is_all_day ? 'date' : 'datetime-local'} value={form.start_datetime} onChange={(e) => setForm({ ...form, start_datetime: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
            <div><label className="block text-sm font-medium text-surface-700 mb-1">End</label><input type={form.is_all_day ? 'date' : 'datetime-local'} value={form.end_datetime} onChange={(e) => setForm({ ...form, end_datetime: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required /></div>
          </div>
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" /></div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">{editingId ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : events.length === 0 ? <div className="text-center py-12 text-surface-400">No calendar events yet.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Title</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Start</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">End</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Blocking</th>
              <th className="text-right px-4 py-3 font-semibold text-surface-600">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{ev.title}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${typeColors[ev.event_type] ?? ''}`}>{ev.event_type.replace(/_/g, ' ')}</span></td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{new Date(ev.start_datetime).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{new Date(ev.end_datetime).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{ev.is_blocking ? <span className="text-red-500 text-xs font-semibold">Yes</span> : <span className="text-surface-400 text-xs">No</span>}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => startEdit(ev)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">Edit</button>
                    <button onClick={() => handleDelete(ev.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
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
