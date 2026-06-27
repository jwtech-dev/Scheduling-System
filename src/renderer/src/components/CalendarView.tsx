import { useState, useMemo } from 'react'
import type { AcademicYear, CalendarEvent, Semester } from '@shared/types'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HOLIDAY: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  SCHOOL_EVENT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  SPECIAL_EVENT: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  CLASS: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  EXAMINATION: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  EXAM_PERIOD: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  BREAK: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ENROLLMENT: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  INSTITUTIONAL_EVENT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  CUSTOM: { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-200' }
}

const DEFAULT_COLOR = { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-200' }

const EVENT_TYPE_DOT_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-red-500',
  SCHOOL_EVENT: 'bg-green-500',
  SPECIAL_EVENT: 'bg-amber-500',
  CLASS: 'bg-sky-500',
  EXAMINATION: 'bg-purple-500',
  EXAM_PERIOD: 'bg-purple-500',
  BREAK: 'bg-blue-500',
  ENROLLMENT: 'bg-teal-500',
  INSTITUTIONAL_EVENT: 'bg-green-500',
  CUSTOM: 'bg-surface-400'
}

/** Semester visual config — colors for each semester type */
const SEMESTER_COLORS: Record<string, { bg: string; border: string; label: string; dot: string }> = {
  '1ST_SEMESTER': { bg: 'rgba(59, 130, 246, 0.08)', border: 'rgba(59, 130, 246, 0.25)', label: '1st Semester', dot: 'bg-blue-500' },
  '2ND_SEMESTER': { bg: 'rgba(168, 85, 247, 0.08)', border: 'rgba(168, 85, 247, 0.25)', label: '2nd Semester', dot: 'bg-purple-500' },
  'SUMMER': { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', label: 'Summer', dot: 'bg-amber-500' }
}

interface CalendarViewProps {
  events: CalendarEvent[]
  semesters?: Semester[]
  activeSemesterId?: string
  academicYear?: AcademicYear | null
}

/** Get all dates in a month grid (includes padding days from prev/next months) */
function getMonthGrid(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const startPadding = firstDay.getDay() // 0=Sun
  const totalDays = lastDay.getDate()
  const totalCells = Math.ceil((startPadding + totalDays) / 7) * 7

  const dates: Date[] = []
  for (let i = 0; i < totalCells; i++) {
    const d = new Date(year, month, 1 - startPadding + i)
    dates.push(d)
  }
  return dates
}

/** Check if a date falls within an event's date range */
function isDateInEvent(date: Date, event: CalendarEvent): boolean {
  const dateStr = formatDateKey(date)
  const start = event.start_datetime.slice(0, 10)
  const end = event.end_datetime.slice(0, 10)
  return dateStr >= start && dateStr <= end
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarView({ events, semesters = [], activeSemesterId, academicYear }: CalendarViewProps): JSX.Element {
  const today = new Date()

  // If there's an active semester, navigate to its start month initially
  const initialSemester = semesters.find(s => s.id === activeSemesterId) ?? semesters.find(s => s.is_active)
  const initialDate = initialSemester?.start_date ? new Date(initialSemester.start_date) : today

  const [viewYear, setViewYear] = useState(initialDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth())

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

  // Build a map of date → semester type for background coloring
  const dateSemesterMap = useMemo(() => {
    const map: Record<string, string> = {} // dateKey → semester_type
    for (const sem of semesters) {
      if (!sem.start_date || !sem.end_date) continue
      const start = new Date(sem.start_date)
      const end = new Date(sem.end_date)
      const cursor = new Date(start)
      while (cursor <= end) {
        const key = formatDateKey(cursor)
        map[key] = sem.semester_type
        cursor.setDate(cursor.getDate() + 1)
      }
    }
    return map
  }, [semesters])

  // Build a map of date → events for fast lookup
  const dateEventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const date of grid) {
      const key = formatDateKey(date)
      const matching = events.filter((ev) => isDateInEvent(date, ev))
      if (matching.length > 0) {
        map[key] = matching
      }
    }
    return map
  }, [grid, events])

  // Compute min/max month boundaries from the academic year
  const ayMinMonth = useMemo(() => {
    if (!academicYear?.start_date) return null
    const d = new Date(academicYear.start_date)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [academicYear])

  const ayMaxMonth = useMemo(() => {
    if (!academicYear?.end_date) return null
    const d = new Date(academicYear.end_date)
    return { year: d.getFullYear(), month: d.getMonth() }
  }, [academicYear])

  const canGoPrev = !ayMinMonth || viewYear > ayMinMonth.year || (viewYear === ayMinMonth.year && viewMonth > ayMinMonth.month)
  const canGoNext = !ayMaxMonth || viewYear < ayMaxMonth.year || (viewYear === ayMaxMonth.year && viewMonth < ayMaxMonth.month)

  const goToPrevMonth = () => {
    if (!canGoPrev) return
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (!canGoNext) return
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    let targetYear = today.getFullYear()
    let targetMonth = today.getMonth()
    // Clamp to AY range if today is outside it
    if (ayMinMonth && (targetYear < ayMinMonth.year || (targetYear === ayMinMonth.year && targetMonth < ayMinMonth.month))) {
      targetYear = ayMinMonth.year
      targetMonth = ayMinMonth.month
    }
    if (ayMaxMonth && (targetYear > ayMaxMonth.year || (targetYear === ayMaxMonth.year && targetMonth > ayMaxMonth.month))) {
      targetYear = ayMaxMonth.year
      targetMonth = ayMaxMonth.month
    }
    setViewYear(targetYear)
    setViewMonth(targetMonth)
  }

  /** Navigate to the start of a specific semester */
  const goToSemester = (sem: Semester) => {
    if (!sem.start_date) return
    const d = new Date(sem.start_date)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const todayKey = formatDateKey(today)

  // Which semesters are available for tab navigation
  const semesterTabs = semesters
    .filter(s => s.start_date && s.end_date)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  // Determine which semester the current view month belongs to (for active tab highlight)
  const currentViewSemester = useMemo(() => {
    const viewStart = formatDateKey(new Date(viewYear, viewMonth, 1))
    const viewEnd = formatDateKey(new Date(viewYear, viewMonth + 1, 0))
    // Find the semester whose range overlaps with the current view month
    for (const sem of semesterTabs) {
      if (sem.start_date <= viewEnd && sem.end_date >= viewStart) {
        return sem.id
      }
    }
    return null
  }, [viewYear, viewMonth, semesterTabs])

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      {/* Semester tabs */}
      {semesterTabs.length > 0 && (
        <div className="flex items-center gap-1 px-5 py-2.5 border-b border-surface-200 bg-surface-50/50">
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider mr-2">Semester:</span>
          {semesterTabs.map(sem => {
            const semColor = SEMESTER_COLORS[sem.semester_type]
            const isActive = currentViewSemester === sem.id
            const startStr = new Date(sem.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const endStr = new Date(sem.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            return (
              <button
                key={sem.id}
                onClick={() => goToSemester(sem)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                    : 'text-surface-500 hover:bg-surface-100 hover:text-surface-700'
                  }
                `}
              >
                <span className={`w-2 h-2 rounded-full ${semColor?.dot ?? 'bg-surface-400'}`} />
                <span>{semColor?.label ?? sem.semester_type.replace(/_/g, ' ')}</span>
                <span className="text-[10px] text-surface-400 ml-1">({startStr} – {endStr})</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            disabled={!canGoPrev}
            className={`p-1.5 rounded-lg transition-colors ${
              canGoPrev
                ? 'hover:bg-surface-200 text-surface-500 hover:text-surface-700 cursor-pointer'
                : 'text-surface-300 cursor-not-allowed'
            }`}
            title={canGoPrev ? 'Previous month' : 'Start of academic year'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-surface-800 min-w-[160px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h3>
          <button
            onClick={goToNextMonth}
            disabled={!canGoNext}
            className={`p-1.5 rounded-lg transition-colors ${
              canGoNext
                ? 'hover:bg-surface-200 text-surface-500 hover:text-surface-700 cursor-pointer'
                : 'text-surface-300 cursor-not-allowed'
            }`}
            title={canGoNext ? 'Next month' : 'End of academic year'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <button
          onClick={goToToday}
          className="px-3 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-md border border-primary-200 transition-colors"
        >
          Today
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-surface-200">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-surface-500 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {grid.map((date, idx) => {
          const key = formatDateKey(date)
          const isCurrentMonth = date.getMonth() === viewMonth
          const isToday = key === todayKey
          const dayEvents = dateEventMap[key] || []
          const maxVisible = 2
          const overflow = dayEvents.length - maxVisible

          // Semester background
          const semType = dateSemesterMap[key]
          const semColor = semType ? SEMESTER_COLORS[semType] : null
          const semBgStyle = semColor && isCurrentMonth
            ? { backgroundColor: semColor.bg }
            : undefined

          return (
            <div
              key={idx}
              style={semBgStyle}
              className={`
                min-h-[90px] border-b border-r border-surface-100 p-1.5
                ${!isCurrentMonth ? 'bg-surface-50/60' : ''}
                ${idx % 7 === 0 ? 'border-l border-surface-100' : ''}
              `}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-0.5">
                <span
                  className={`
                    inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                    ${isToday
                      ? 'bg-primary-600 text-white'
                      : isCurrentMonth
                        ? 'text-surface-700'
                        : 'text-surface-300'
                    }
                  `}
                >
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && !isCurrentMonth && (
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-300" />
                )}
              </div>

              {/* Event pills */}
              {isCurrentMonth && (
                <div className="space-y-0.5">
                  {dayEvents.slice(0, maxVisible).map((ev) => {
                    const colors = EVENT_TYPE_COLORS[ev.event_type] || DEFAULT_COLOR
                    return (
                      <div
                        key={ev.id}
                        className={`
                          px-1.5 py-0.5 rounded text-[10px] leading-tight font-medium truncate
                          border ${colors.bg} ${colors.text} ${colors.border}
                        `}
                        title={`${ev.title} (${ev.start_datetime.slice(0, 10)} – ${ev.end_datetime.slice(0, 10)})`}
                      >
                        {ev.title}
                      </div>
                    )
                  })}
                  {overflow > 0 && (
                    <div className="px-1.5 text-[10px] text-surface-400 font-medium">
                      +{overflow} more
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-surface-200 bg-surface-50/50 flex-wrap">
        {/* Semester legends */}
        {semesterTabs.length > 0 && (
          <>
            <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Semesters:</span>
            {semesterTabs.map(sem => {
              const sc = SEMESTER_COLORS[sem.semester_type]
              return (
                <div key={sem.id} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${sc?.dot ?? 'bg-surface-400'}`} style={{ opacity: 0.4 }} />
                  <span className="text-[10px] text-surface-500">{sc?.label ?? sem.semester_type.replace(/_/g, ' ')}</span>
                </div>
              )
            })}
            <span className="text-surface-200 mx-1">|</span>
          </>
        )}
        <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Events:</span>
        {Object.entries(EVENT_TYPE_DOT_COLORS).map(([type, dotColor]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
            <span className="text-[10px] text-surface-500">
              {type === 'INSTITUTIONAL_EVENT' ? 'Institutional' : type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
