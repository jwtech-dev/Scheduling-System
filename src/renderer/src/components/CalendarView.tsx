import { useState, useMemo } from 'react'
import type { CalendarEvent } from '@shared/types'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  HOLIDAY: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  EXAM_PERIOD: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  BREAK: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  INSTITUTIONAL_EVENT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  CUSTOM: { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-200' }
}

const DEFAULT_COLOR = { bg: 'bg-surface-50', text: 'text-surface-600', border: 'border-surface-200' }

const EVENT_TYPE_DOT_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-red-500',
  EXAM_PERIOD: 'bg-purple-500',
  BREAK: 'bg-blue-500',
  INSTITUTIONAL_EVENT: 'bg-green-500',
  CUSTOM: 'bg-surface-400'
}

interface CalendarViewProps {
  events: CalendarEvent[]
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

export default function CalendarView({ events }: CalendarViewProps): JSX.Element {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const grid = useMemo(() => getMonthGrid(viewYear, viewMonth), [viewYear, viewMonth])

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

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const todayKey = formatDateKey(today)

  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-surface-200 bg-surface-50/50">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors"
            title="Previous month"
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
            className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-500 hover:text-surface-700 transition-colors"
            title="Next month"
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

          return (
            <div
              key={idx}
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
      <div className="flex items-center gap-4 px-5 py-2.5 border-t border-surface-200 bg-surface-50/50">
        <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-wider">Legend:</span>
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
