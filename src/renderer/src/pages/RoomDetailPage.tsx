import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import type { IpcResponse, Room, ScheduleEntry, ActiveTerm, Semester } from '@shared/types'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ScheduleRow extends ScheduleEntry {
  personnel_name?: string
}

export default function RoomDetailPage(): JSX.Element {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { department } = useDepartment()
  const toast = useToast()
  const [room, setRoom] = useState<Room | null>(null)
  const [entries, setEntries] = useState<ScheduleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [entriesLoading, setEntriesLoading] = useState(true)
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemId, setSelectedSemId] = useState<string>('')

  const loadRoom = useCallback(async () => {
    if (!roomId) return
    setLoading(true)
    const result = (await window.electronAPI.getRoom(roomId)) as IpcResponse<Room>
    if (result.error) {
      toast.error(result.error.message)
      setLoading(false)
      return
    }
    if (result.data) setRoom(result.data)
    setLoading(false)
  }, [roomId])

  const loadSchedule = useCallback(async () => {
    if (!roomId) return
    setEntriesLoading(true)
    const filters: Record<string, string> = {}
    if (selectedSemId) filters.semester_id = selectedSemId
    const result = (await window.electronAPI.getRoomSchedule(roomId, filters)) as IpcResponse<ScheduleRow[]>
    if (result.data) setEntries(result.data)
    setEntriesLoading(false)
  }, [roomId, selectedSemId])

  useEffect(() => {
    loadRoom()
    loadSchedule()
  }, [loadRoom, loadSchedule])

  // Load active term and semesters for the picker
  useEffect(() => {
    (async () => {
      const termRes = (await window.electronAPI.getActiveTerm(department)) as IpcResponse<ActiveTerm>
      if (termRes.data) {
        setActiveTerm(termRes.data)
        if (termRes.data.academicYear) {
          const semRes = (await window.electronAPI.getAcademicYearSemesters(termRes.data.academicYear.id)) as IpcResponse<Semester[]>
          if (semRes.data) setSemesters(semRes.data)
        }
        if (termRes.data.semester?.id) {
          setSelectedSemId(prev => prev || termRes.data!.semester!.id)
        }
      }
    })()
  }, [department])

  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    AVAILABLE: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
    MAINTENANCE: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    INACTIVE: { bg: 'bg-surface-100', text: 'text-surface-500', dot: 'bg-surface-400' }
  }

  const entryStatusColors: Record<string, string> = {
    DRAFT: 'bg-amber-50 text-amber-700',
    PUBLISHED: 'bg-green-50 text-green-700'
  }

  const activityColors: Record<string, string> = {
    CLASS: 'bg-blue-50 text-blue-700',
    EXAM: 'bg-red-50 text-red-700',
    OFFICE: 'bg-purple-50 text-purple-700',
    MEETING: 'bg-indigo-50 text-indigo-700',
    EVENT: 'bg-pink-50 text-pink-700',
    MAINTENANCE: 'bg-yellow-50 text-yellow-700'
  }

  const deptLabels: Record<string, string> = { SHARED: 'Shared', SHS_ONLY: 'SHS Only', COLLEGE_ONLY: 'College Only' }

  const formatTime = (t: string): string => {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  const parseSectionIds = (sectionIds: string): string => {
    if (!sectionIds) return '—'
    try {
      const parsed = JSON.parse(sectionIds)
      if (Array.isArray(parsed)) return parsed.join(', ')
    } catch { /* noop */ }
    return sectionIds
  }

  if (loading) return <div className="p-8 text-center text-surface-400">Loading...</div>
  if (!room) return (
    <div className="p-8 text-center">
      <p className="text-surface-400 mb-4">Room not found.</p>
      <button onClick={() => navigate('/rooms')} className="text-primary-600 hover:text-primary-800 font-medium">← Back to Rooms</button>
    </div>
  )

  const sc = statusConfig[room.status] ?? statusConfig.INACTIVE

  return (
    <div className="space-y-6 p-1">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/rooms')} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors">
          <span>←</span> Back to Rooms
        </button>
      </div>

      {/* Room info header */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {room.room_code.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-surface-900">{room.room_code}</h1>
            <p className="text-surface-500 text-sm">{room.room_name}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.text}`}>
            <span className={`w-2 h-2 rounded-full ${sc.dot}`}></span>
            {room.status}
          </span>
        </div>
        <div className="flex items-center gap-6 mt-3 text-sm text-surface-500 flex-wrap">
          {(room.building || room.floor) && (
            <span><strong className="text-surface-700">Location:</strong> {[room.building, room.floor].filter(Boolean).join(' · ')}</span>
          )}
          <span><strong className="text-surface-700">Capacity:</strong> {room.capacity} seats</span>
          {room.room_type && (
            <span><strong className="text-surface-700">Type:</strong> {room.room_type}</span>
          )}
          <span><strong className="text-surface-700">Dept:</strong> {deptLabels[room.department_availability] ?? room.department_availability}</span>
          <span><strong className="text-surface-700">Assignments:</strong> {entries.length}</span>
        </div>
        {room.notes && (
          <div className="mt-3 text-xs text-surface-400 bg-surface-50 px-3 py-2 rounded-lg">
            <strong className="text-surface-500">Notes:</strong> {room.notes}
          </div>
        )}
      </div>

      {/* Schedule entries table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-surface-50 border-b border-surface-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📅</span>
            <h2 className="text-sm font-semibold text-surface-700">Assigned Schedule Entries</h2>
            <span className="text-xs text-surface-400">({entries.length})</span>
          </div>
          {semesters.length > 0 && (
            <select
              value={selectedSemId}
              onChange={(e) => setSelectedSemId(e.target.value)}
              className="px-2 py-1 border border-surface-300 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 outline-none bg-white"
            >
              <option value="">All Semesters</option>
              {semesters.map(s => (
                <option key={s.id} value={s.id}>
                  {s.semester_type === '1ST_SEMESTER' ? '1st Semester' : s.semester_type === '2ND_SEMESTER' ? '2nd Semester' : s.semester_type === 'SUMMER' ? 'Summer' : s.semester_type}
                  {activeTerm?.semester?.id === s.id ? ' (active)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {entriesLoading ? (
          <div className="text-center py-12 text-surface-400 text-sm">Loading schedule...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-surface-400 text-sm">No schedule entries assigned to this room.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-50/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Type</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Subject</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Personnel</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Section(s)</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Day</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Time</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Pattern</th>
                  <th className="text-left px-4 py-2.5 font-medium text-surface-500 text-xs">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${activityColors[e.activity_type] ?? 'bg-surface-100 text-surface-600'}`}>
                        {e.activity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-surface-700">
                      {e.subject || e.exam_title || <span className="text-surface-400 italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-surface-600">
                      {e.personnel_name || <span className="text-surface-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-surface-600 text-xs">
                      {parseSectionIds(e.section_ids)}
                    </td>
                    <td className="px-4 py-3 text-surface-600 text-xs">
                      {e.day_of_week != null ? DAY_NAMES[e.day_of_week] : '—'}
                    </td>
                    <td className="px-4 py-3 text-surface-600 text-xs whitespace-nowrap">
                      {formatTime(e.start_time)} – {formatTime(e.end_time)}
                    </td>
                    <td className="px-4 py-3 text-surface-500 text-xs">
                      {e.recurrence_pattern.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${entryStatusColors[e.status] ?? ''}`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
