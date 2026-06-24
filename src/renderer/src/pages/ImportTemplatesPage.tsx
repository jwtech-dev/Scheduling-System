import { useState } from 'react'
import { useDepartment } from '../contexts/DepartmentContext'
import { useToast } from '../components/ToastProvider'
import type { IpcResponse, GradeLevel } from '@shared/types'
import { GRADE_LEVEL_LABELS, GRADE_LEVELS } from '@shared/constants'

interface TemplateCard {
  target: string
  label: string
  description: string
  icon: string
  color: { bg: string; icon: string; border: string }
  gradeLevel?: GradeLevel  // SHS-specific: per-grade-level variant
}

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    target: 'PERSONNEL',
    label: 'Personnel',
    description: 'Employee records — names, IDs, department, type, specializations, and credentials.',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    color: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' }
  },
  {
    target: 'SECTIONS',
    label: 'Sections',
    description: 'Section codes, programs, year levels, strand/track, and student counts.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-200' }
  },
  {
    target: 'SUBJECT_BANK',
    label: 'Subject Bank',
    description: 'Subject codes, names, programs, year levels, semesters, and lecture/lab hours.',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    color: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200' }
  },
  {
    target: 'ROOMS',
    label: 'Rooms',
    description: 'Room codes, names, buildings, floors, capacity, type, and department availability.',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    color: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-200' }
  },
  {
    target: 'CALENDAR_EVENTS',
    label: 'Calendar Events',
    description: 'Event titles, types, dates, blocking flags, and descriptions for the academic calendar.',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    color: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-200' }
  }
]

// SHS: separate Calendar Events cards per grade level
const SHS_CALENDAR_CARDS: TemplateCard[] = GRADE_LEVELS.map(gl => ({
  target: 'CALENDAR_EVENTS',
  label: `Calendar — ${GRADE_LEVEL_LABELS[gl]}`,
  description: `Academic calendar events for ${GRADE_LEVEL_LABELS[gl]} — holidays, exams, breaks, school events.`,
  icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  color: gl === 'GRADE_11'
    ? { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' }
    : { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-200' },
  gradeLevel: gl
}))

export default function ImportTemplatesPage(): JSX.Element {
  const { department } = useDepartment()
  const toast = useToast()
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (card: TemplateCard): Promise<void> => {
    const dlKey = card.gradeLevel ? `${card.target}_${card.gradeLevel}` : card.target
    setDownloading(dlKey)
    try {
      const res = (await window.electronAPI.downloadImportTemplate(card.target, department, card.gradeLevel)) as IpcResponse<{ success: boolean }>
      if (res.error) toast.error(res.error.message)
      else if (res.data?.success) toast.success(`${card.label} template saved`)
    } finally {
      setDownloading(null)
    }
  }

  // Build cards: for SHS, replace generic Calendar Events with per-grade-level variants
  const cards = department === 'SHS'
    ? [...TEMPLATE_CARDS.filter(c => c.target !== 'CALENDAR_EVENTS'), ...SHS_CALENDAR_CARDS]
    : TEMPLATE_CARDS

  return (
    <div className="space-y-6">
      {/* Header */}
      <p className="text-sm text-surface-500">
        Download pre-formatted Excel templates to prepare your data for import. Each template includes column headers, data validation, and instructions.
      </p>

      {/* Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => {
          const dlKey = card.gradeLevel ? `${card.target}_${card.gradeLevel}` : card.target
          return (
          <div
            key={dlKey}
            className={`${card.color.bg} border ${card.color.border} rounded-xl p-5 flex flex-col gap-3 transition-all hover:shadow-md`}
          >
            {/* Icon + Label */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-white/80 flex items-center justify-center flex-shrink-0`}>
                <svg className={`w-5 h-5 ${card.color.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-surface-900">{card.label}</h3>
            </div>

            {/* Description */}
            <p className="text-sm text-surface-600 leading-relaxed flex-1">{card.description}</p>

            {/* Download Button */}
            <button
              onClick={() => handleDownload(card)}
              disabled={downloading === dlKey}
              className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white border border-surface-200 rounded-lg text-sm font-medium text-surface-700 hover:text-surface-900 transition-all disabled:opacity-50 shadow-sm hover:shadow"
            >
              {downloading === dlKey ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Template
                </>
              )}
            </button>
          </div>
          )
          })}
      </div>

      {/* Info */}
      <div className="bg-surface-50 border border-surface-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-surface-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-surface-600 space-y-1">
            <p className="font-medium text-surface-700">How to use import templates</p>
            <ol className="list-decimal list-inside space-y-0.5 text-surface-500">
              <li>Download the template for the data you want to import</li>
              <li>Open it in Excel and fill in your data starting from Row 4</li>
              <li>Required columns are marked with <span className="font-medium text-amber-600">*</span> and highlighted in yellow</li>
              <li>Check the <span className="font-medium">Instructions</span> sheet for column details and valid values</li>
              <li>Go to the relevant page (e.g., Personnel) and click <span className="font-medium">Import File</span> to upload</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
