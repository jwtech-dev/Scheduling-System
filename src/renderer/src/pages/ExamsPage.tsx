import { useState, useEffect, useCallback } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import type { IpcResponse, ScheduleEntry, Room, Personnel } from '@shared/types'

export default function ExamsPage(): JSX.Element {
  const { department } = useDepartment()
  const [entries, setEntries] = useState<ScheduleEntry[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [entriesRes, roomsRes, persRes] = await Promise.all([
      window.electronAPI.listExamEntries({ department }) as Promise<IpcResponse<ScheduleEntry[]>>,
      window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
      window.electronAPI.listPersonnel({ department, is_shared: true }) as Promise<IpcResponse<Personnel[]>>
    ])
    if (entriesRes.data) setEntries(entriesRes.data)
    if (roomsRes.data) setRooms(roomsRes.data)
    if (persRes.data) setPersonnel(persRes.data)
    setLoading(false)
  }, [department])

  useEffect(() => { load() }, [load])

  const getRoomName = (id: string | null) => rooms.find(r => r.id === id)?.room_code ?? '—'
  const getPersonnelName = (id: string | null) => { const p = personnel.find(x => x.id === id); return p ? `${p.last_name}, ${p.first_name}` : '—' }

  const handleExportExams = async () => {
    const result = (await window.electronAPI.exportExamSchedule({ department })) as IpcResponse<{ success: boolean; path?: string }>
    if (result.data?.path) alert(`Exported to: ${result.data.path}`)
    else if (result.error) alert(result.error.message)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Exam Schedule</h1>
        <button onClick={handleExportExams} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Export CSV</button>
      </div>

      {loading ? <div className="text-center py-12 text-surface-400">Loading...</div> : entries.length === 0 ? <div className="text-center py-12 text-surface-400">No exam entries found.</div> : (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-200"><tr>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Exam Title</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Type</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Room</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Proctor</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Date</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Time</th>
              <th className="text-left px-4 py-3 font-semibold text-surface-600">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-surface-100">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-surface-900">{e.exam_title ?? '—'}</td>
                  <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">{e.exam_type ?? '—'}</span></td>
                  <td className="px-4 py-3 text-surface-600">{getRoomName(e.room_id)}</td>
                  <td className="px-4 py-3 text-surface-600">{getPersonnelName(e.personnel_id)}</td>
                  <td className="px-4 py-3 text-surface-600 text-xs">{e.recurrence_start_date}</td>
                  <td className="px-4 py-3 text-surface-600 whitespace-nowrap">{e.start_time}–{e.end_time}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${e.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{e.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
