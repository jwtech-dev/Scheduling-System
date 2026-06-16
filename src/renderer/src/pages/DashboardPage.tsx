import { useState, useEffect } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import type { IpcResponse, ActiveTerm, ScheduleEntry, Room, Personnel, Section } from '@shared/types'
import { CONFLICT_CODES } from '@shared/constants'

// Build a set of HARD conflict code strings for fast lookup
const HARD_CONFLICT_CODES = new Set(
  Object.values(CONFLICT_CODES)
    .filter((c) => c.severity === 'HARD')
    .map((c) => c.code)
)

interface Stats {
  totalEntries: number
  draftEntries: number
  publishedEntries: number
  totalRooms: number
  totalPersonnel: number
  totalSections: number
  conflictEntries: number
}

export default function DashboardPage(): JSX.Element {
  const { department } = useDepartment()
  const [activeTerm, setActiveTerm] = useState<ActiveTerm | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalEntries: 0, draftEntries: 0, publishedEntries: 0,
    totalRooms: 0, totalPersonnel: 0, totalSections: 0, conflictEntries: 0
  })
  const [loading, setLoading] = useState(true)
  const [questionsConfigured, setQuestionsConfigured] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const termResult = (await window.electronAPI.getActiveTerm(department)) as IpcResponse<ActiveTerm>
      if (termResult.data) setActiveTerm(termResult.data)

      // Check if security questions are configured
      try {
        const configRes = (await window.electronAPI.checkSecurityQuestionsConfigured()) as IpcResponse<{ configured: boolean }>
        if (configRes.data) {
          setQuestionsConfigured(configRes.data.configured)
        }
      } catch (e) {
        console.error('Failed to check security questions configuration', e)
      }

      // Load stats
      const [entriesRes, roomsRes, personnelRes, sectionsRes] = await Promise.all([
        window.electronAPI.listScheduleEntries({ department }) as Promise<IpcResponse<ScheduleEntry[]>>,
        window.electronAPI.listRooms({}) as Promise<IpcResponse<Room[]>>,
        window.electronAPI.listPersonnel({ department, is_shared: true }) as Promise<IpcResponse<Personnel[]>>,
        window.electronAPI.listSections({ department }) as Promise<IpcResponse<Section[]>>
      ])

      const entries = entriesRes.data ?? []
      setStats({
        totalEntries: entries.length,
        draftEntries: entries.filter(e => e.status === 'DRAFT').length,
        publishedEntries: entries.filter(e => e.status === 'PUBLISHED').length,
        totalRooms: (roomsRes.data ?? []).length,
        totalPersonnel: (personnelRes.data ?? []).length,
        totalSections: new Set((sectionsRes.data ?? []).map(s => s.section_code)).size,
        conflictEntries: entries.filter(e => {
          try {
            const flags: string[] = JSON.parse(e.conflict_flags || '[]')
            return flags.some(f => HARD_CONFLICT_CODES.has(f))
          } catch { return false }
        }).length
      })
      setLoading(false)
    }
    load()
  }, [department])

  const cards = [
    { label: 'Total Entries', value: stats.totalEntries, color: 'bg-blue-50 text-blue-700', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { label: 'Drafts', value: stats.draftEntries, color: 'bg-amber-50 text-amber-700', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { label: 'Published', value: stats.publishedEntries, color: 'bg-green-50 text-green-700', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Conflicts', value: stats.conflictEntries, color: stats.conflictEntries > 0 ? 'bg-red-50 text-red-700' : 'bg-surface-50 text-surface-500', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
    { label: 'Rooms', value: stats.totalRooms, color: 'bg-purple-50 text-purple-700', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { label: 'Personnel', value: stats.totalPersonnel, color: 'bg-cyan-50 text-cyan-700', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { label: 'Sections', value: stats.totalSections, color: 'bg-indigo-50 text-indigo-700', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' }
  ]

  return (
    <div className="space-y-8">
      {/* Active Term Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
        {activeTerm?.academicYear ? (
          <p className="mt-1 text-surface-500">
            {activeTerm.academicYear.label}
            {activeTerm.semester && ` · ${activeTerm.semester.semester_type.replace('_', ' ')}`}
            {activeTerm.quarter && ` · ${activeTerm.quarter}`}
          </p>
        ) : (
          <p className="mt-1 text-amber-600 text-sm">No active term set. Go to Academic Years to set one.</p>
        )}
      </div>

      {loading ? <div className="text-center py-12 text-surface-400">Loading dashboard...</div> : (
        <>
          {!questionsConfigured && (
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <p className="font-semibold text-sm">Security recovery questions are not configured</p>
                  <p className="text-xs text-amber-700 mt-0.5">Please set them up now to ensure you can recover your password if you ever forget it.</p>
                </div>
              </div>
              <a
                href="#/settings"
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Configure Now
              </a>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            {cards.map((card) => (
              <div key={card.label} className={`rounded-xl p-5 ${card.color} border border-black/5`}>
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                  </svg>
                  <div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-xs font-medium opacity-75">{card.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-surface-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'New Schedule Entry', href: '#/schedule', color: 'bg-primary-600 hover:bg-primary-700 text-white' },
                { label: 'Import CSV', href: '#/import', color: 'bg-surface-100 hover:bg-surface-200 text-surface-700' },
                { label: 'View Audit Log', href: '#/audit', color: 'bg-surface-100 hover:bg-surface-200 text-surface-700' },
                { label: 'Export Schedule', href: '#/settings', color: 'bg-surface-100 hover:bg-surface-200 text-surface-700' }
              ].map((action) => (
                <a key={action.label} href={action.href} className={`px-4 py-3 rounded-lg text-sm font-medium text-center transition-colors ${action.color}`}>
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
