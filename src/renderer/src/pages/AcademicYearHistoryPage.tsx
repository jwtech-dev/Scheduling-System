import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDepartment } from '../contexts/DepartmentContext'
import { useHistoryMode } from '../contexts/HistoryModeContext'
import type {
  IpcResponse,
  AcademicYear,
  Semester,
  Section,
  ScheduleEntry,
  CalendarEvent,
  Quarter
} from '@shared/types'
import { GRADE_LEVEL_LABELS } from '@shared/constants'

type TabId = 'overview' | 'semesters' | 'sections' | 'schedules' | 'calendar'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'semesters', label: 'Semesters', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { id: 'sections', label: 'Sections', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'schedules', label: 'Schedules', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'calendar', label: 'Calendar Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
]

export default function AcademicYearHistoryPage(): JSX.Element {
  const { ayId } = useParams<{ ayId: string }>()
  const navigate = useNavigate()
  const { department } = useDepartment()
  const { enterHistoryMode, historyAy, isHistoryMode } = useHistoryMode()

  const [ay, setAy] = useState<AcademicYear | null>(null)
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([])
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [quarters, setQuarters] = useState<Record<string, Quarter[]>>({})
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)

  // Load academic year and semesters on mount
  const loadBase = useCallback(async () => {
    if (!ayId) return
    setLoading(true)
    const [ayResult, semResult] = await Promise.all([
      window.electronAPI.getAcademicYear(ayId) as Promise<IpcResponse<AcademicYear>>,
      window.electronAPI.getAcademicYearSemesters(ayId) as Promise<IpcResponse<Semester[]>>
    ])
    if (ayResult.data) {
      // Redirect non-completed AYs to the detail page
      if (ayResult.data.status !== 'COMPLETED') {
        navigate(`/academic-years/${ayId}`, { replace: true })
        return
      }
      setAy(ayResult.data)
    }
    if (semResult.data) setSemesters(semResult.data)
    setLoading(false)
  }, [ayId, navigate])

  useEffect(() => { loadBase() }, [loadBase])

  // Lazy-load tab data
  const loadTabData = useCallback(async (tab: TabId) => {
    if (!ayId) return
    setTabLoading(true)
    try {
      if (tab === 'sections' && sections.length === 0) {
        const result = (await window.electronAPI.listSections({ department, academic_year_id: ayId })) as IpcResponse<Section[]>
        if (result.data) setSections(result.data)
      } else if (tab === 'schedules' && schedules.length === 0) {
        const result = (await window.electronAPI.listScheduleEntries({ department, academic_year_id: ayId })) as IpcResponse<ScheduleEntry[]>
        if (result.data) setSchedules(result.data)
      } else if (tab === 'calendar' && calendarEvents.length === 0) {
        const result = (await window.electronAPI.listCalendarEvents({ academic_year_id: ayId })) as IpcResponse<CalendarEvent[]>
        if (result.data) setCalendarEvents(result.data)
      } else if (tab === 'semesters' && Object.keys(quarters).length === 0 && semesters.length > 0) {
        // Load quarters for all semesters
        const quartersMap: Record<string, Quarter[]> = {}
        for (const sem of semesters) {
          const result = (await window.electronAPI.listQuarters(sem.id)) as IpcResponse<Quarter[]>
          if (result.data) quartersMap[sem.id] = result.data
        }
        setQuarters(quartersMap)
      }
    } finally {
      setTabLoading(false)
    }
  }, [ayId, department, sections.length, schedules.length, calendarEvents.length, semesters, quarters])

  useEffect(() => {
    if (activeTab !== 'overview') loadTabData(activeTab)
  }, [activeTab, loadTabData])

  // Counts for overview tab
  const counts = useMemo(() => ({
    semesters: semesters.length,
    sections: sections.length,
    schedules: schedules.length,
    calendarEvents: calendarEvents.length
  }), [semesters, sections, schedules, calendarEvents])

  // Load all counts on mount for overview
  useEffect(() => {
    if (!ayId) return
    const loadCounts = async (): Promise<void> => {
      const [secResult, schResult, calResult] = await Promise.all([
        window.electronAPI.listSections({ department, academic_year_id: ayId }) as Promise<IpcResponse<Section[]>>,
        window.electronAPI.listScheduleEntries({ department, academic_year_id: ayId }) as Promise<IpcResponse<ScheduleEntry[]>>,
        window.electronAPI.listCalendarEvents({ academic_year_id: ayId }) as Promise<IpcResponse<CalendarEvent[]>>
      ])
      if (secResult.data) setSections(secResult.data)
      if (schResult.data) setSchedules(schResult.data)
      if (calResult.data) setCalendarEvents(calResult.data)
    }
    loadCounts()
  }, [ayId, department])

  if (loading || !ay) {
    return <div className="flex items-center justify-center py-20 text-surface-400">Loading history...</div>
  }

  return (
    <div className="space-y-6 p-1">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/academic-years')}
          className="flex items-center gap-1.5 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors"
        >
          <span>←</span> Back to Academic Years
        </button>
      </div>

      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50 text-slate-500 flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-surface-900">{ay.label}</h1>
            <p className="text-surface-500 text-sm">{ay.department} Department · History View</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Completed
            </span>
            {/* View in App button */}
            {isHistoryMode && historyAy?.id === ay.id ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Currently Viewing
              </span>
            ) : (
              <button
                onClick={() => {
                  enterHistoryMode(ay)
                  navigate('/')
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View in App
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-3 text-sm text-surface-500 flex-wrap">
          <span><strong className="text-surface-700">Start Date:</strong> {ay.start_date}</span>
          <span><strong className="text-surface-700">End Date:</strong> {ay.end_date}</span>
          <span><strong className="text-surface-700">Semesters:</strong> {semesters.length}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {tabLoading ? (
          <div className="flex items-center justify-center py-12 text-surface-400">Loading...</div>
        ) : activeTab === 'overview' ? (
          <OverviewTab ay={ay} counts={counts} semesters={semesters} />
        ) : activeTab === 'semesters' ? (
          <SemestersTab semesters={semesters} quarters={quarters} department={ay.department} />
        ) : activeTab === 'sections' ? (
          <SectionsTab sections={sections} />
        ) : activeTab === 'schedules' ? (
          <SchedulesTab schedules={schedules} />
        ) : (
          <CalendarTab events={calendarEvents} />
        )}
      </div>
    </div>
  )
}

// ── Overview Tab ──────────────────────────────────────────────

function OverviewTab({ ay, counts, semesters }: {
  ay: AcademicYear
  counts: { semesters: number; sections: number; schedules: number; calendarEvents: number }
  semesters: Semester[]
}): JSX.Element {
  const statCards = [
    { label: 'Semesters', value: counts.semesters, color: 'bg-blue-50 text-blue-700' },
    { label: 'Sections', value: counts.sections, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Schedule Entries', value: counts.schedules, color: 'bg-amber-50 text-amber-700' },
    { label: 'Calendar Events', value: counts.calendarEvents, color: 'bg-violet-50 text-violet-700' }
  ]

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-5`}>
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <h3 className="text-base font-semibold text-surface-900 mb-4">Academic Year Timeline</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="w-24 font-medium text-surface-700">Started</span>
            <span className="text-surface-500">{ay.start_date}</span>
          </div>
          {semesters.map((sem) => (
            <div key={sem.id} className="flex items-center gap-3 text-sm">
              <span className="w-24 font-medium text-surface-700">{sem.semester_type.replace(/_/g, ' ')}</span>
              <span className="text-surface-500">{sem.start_date} — {sem.end_date}</span>
              {sem.grade_level && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                  {GRADE_LEVEL_LABELS[sem.grade_level]}
                </span>
              )}
            </div>
          ))}
          <div className="flex items-center gap-3 text-sm">
            <span className="w-24 font-medium text-surface-700">Ended</span>
            <span className="text-surface-500">{ay.end_date}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Semesters Tab ─────────────────────────────────────────────

function SemestersTab({ semesters, quarters, department }: {
  semesters: Semester[]
  quarters: Record<string, Quarter[]>
  department: string
}): JSX.Element {
  if (semesters.length === 0) {
    return <EmptyState message="No semesters were created for this academic year." />
  }

  return (
    <div className="space-y-4">
      {semesters.map((sem) => (
        <div key={sem.id} className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h4 className="font-semibold text-surface-900">{sem.semester_type.replace(/_/g, ' ')}</h4>
              {sem.grade_level && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                  {GRADE_LEVEL_LABELS[sem.grade_level]}
                </span>
              )}

            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              sem.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
            }`}>
              {sem.status}
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-surface-500">
            <span>{sem.start_date} — {sem.end_date}</span>
          </div>

          {/* Quarters */}
          {quarters[sem.id] && quarters[sem.id].length > 0 && (
            <div className="mt-3 pt-3 border-t border-surface-100">
              <p className="text-xs font-medium text-surface-600 mb-2">Quarters</p>
              <div className="grid grid-cols-4 gap-2">
                {quarters[sem.id].map((q) => (
                  <div key={q.id} className="bg-surface-50 rounded-lg px-3 py-2 text-xs">
                    <span className="font-medium text-surface-700">{q.quarter_label}</span>
                    <p className="text-surface-500 mt-0.5">{q.start_date} — {q.end_date}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Sections Tab ──────────────────────────────────────────────

function SectionsTab({ sections }: { sections: Section[] }): JSX.Element {
  if (sections.length === 0) {
    return <EmptyState message="No sections were created for this academic year." />
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Section Code</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Subject</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Program</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Year Level</th>
            <th className="text-right px-4 py-3 font-medium text-surface-600">Students</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {sections.map((sec) => (
            <tr key={sec.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-4 py-3 font-medium text-surface-900">{sec.section_code}</td>
              <td className="px-4 py-3 text-surface-600">{sec.subject || '—'}</td>
              <td className="px-4 py-3 text-surface-600">{sec.course_program || '—'}</td>
              <td className="px-4 py-3 text-surface-600">{sec.year_level || '—'}</td>
              <td className="px-4 py-3 text-right text-surface-600">{sec.student_count}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  sec.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-surface-100 text-surface-500'
                }`}>
                  {sec.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Schedules Tab ─────────────────────────────────────────────

function SchedulesTab({ schedules }: { schedules: ScheduleEntry[] }): JSX.Element {
  if (schedules.length === 0) {
    return <EmptyState message="No schedule entries were created for this academic year." />
  }

  const activityColors: Record<string, string> = {
    CLASS: 'bg-blue-50 text-blue-600',
    EXAM: 'bg-red-50 text-red-600',
    OFFICE: 'bg-amber-50 text-amber-600',
    MEETING: 'bg-violet-50 text-violet-600',
    EVENT: 'bg-emerald-50 text-emerald-600',
    MAINTENANCE: 'bg-surface-100 text-surface-600'
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Activity</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Subject</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Time</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Recurrence</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Modality</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {schedules.map((entry) => (
            <tr key={entry.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${activityColors[entry.activity_type] || 'bg-surface-100 text-surface-500'}`}>
                  {entry.activity_type}
                </span>
              </td>
              <td className="px-4 py-3 text-surface-600">{entry.subject || entry.exam_title || '—'}</td>
              <td className="px-4 py-3 text-surface-600 font-mono text-xs">{entry.start_time} – {entry.end_time}</td>
              <td className="px-4 py-3 text-surface-600 text-xs">{entry.recurrence_pattern.replace(/_/g, ' ')}</td>
              <td className="px-4 py-3 text-surface-600 text-xs">{entry.modality}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  entry.status === 'PUBLISHED' ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Calendar Tab ──────────────────────────────────────────────

function CalendarTab({ events }: { events: CalendarEvent[] }): JSX.Element {
  if (events.length === 0) {
    return <EmptyState message="No calendar events were created for this academic year." />
  }

  const eventTypeColors: Record<string, string> = {
    HOLIDAY: 'bg-red-50 text-red-600',
    SCHOOL_EVENT: 'bg-emerald-50 text-emerald-600',
    SPECIAL_EVENT: 'bg-amber-50 text-amber-600',
    CLASS: 'bg-sky-50 text-sky-600',
    EXAMINATION: 'bg-purple-50 text-purple-600',
    EXAM_PERIOD: 'bg-amber-50 text-amber-600',
    BREAK: 'bg-blue-50 text-blue-600',
    ENROLLMENT: 'bg-teal-50 text-teal-600',
    INSTITUTIONAL_EVENT: 'bg-emerald-50 text-emerald-600',
    CUSTOM: 'bg-violet-50 text-violet-600'
  }

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-surface-50 border-b border-surface-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Title</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Type</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Start</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">End</th>
            <th className="text-left px-4 py-3 font-medium text-surface-600">Blocking</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {events.map((evt) => (
            <tr key={evt.id} className="hover:bg-surface-50 transition-colors">
              <td className="px-4 py-3 font-medium text-surface-900">{evt.title}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventTypeColors[evt.event_type] || 'bg-surface-100 text-surface-500'}`}>
                  {evt.event_type.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="px-4 py-3 text-surface-600 text-xs">{evt.start_datetime}</td>
              <td className="px-4 py-3 text-surface-600 text-xs">{evt.end_datetime}</td>
              <td className="px-4 py-3">
                {evt.is_blocking ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-medium">Yes</span>
                ) : (
                  <span className="text-xs text-surface-400">No</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Shared Components ─────────────────────────────────────────

function EmptyState({ message }: { message: string }): JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-surface-400">
      <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  )
}
