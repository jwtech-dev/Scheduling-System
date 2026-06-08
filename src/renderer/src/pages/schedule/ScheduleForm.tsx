import { useState, useRef, useEffect } from 'react'
import type { ScheduleFormData } from '../../hooks/useScheduleData'
import type { ConflictFlag, Room, Personnel, Section } from '@shared/types'
import type { ActivityType, RecurrencePattern, Modality } from '@shared/types'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, RECURRENCE_PATTERN_LABELS } from '@shared/constants'

// ── Multi-select dropdown for sections ──────────────────────
function SectionMultiSelect({
  sections,
  selectedIds,
  onChange
}: {
  sections: Section[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (id: string): void => {
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]
    )
  }

  const filtered = sections.filter(
    (s) => s.section_code.toLowerCase().includes(search.toLowerCase())
  )

  const selectedLabel =
    selectedIds.length === 0
      ? '— Select sections —'
      : selectedIds.length === 1
        ? sections.find((s) => s.id === selectedIds[0])?.section_code ?? '1 selected'
        : `${selectedIds.length} sections selected`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-surface-300 rounded-lg text-sm text-left focus:ring-2 focus:ring-primary-500 outline-none bg-white hover:border-surface-400 transition-colors"
      >
        <span className={selectedIds.length === 0 ? 'text-surface-400' : 'text-surface-900'}>
          {selectedLabel}
        </span>
        <svg className={`w-4 h-4 text-surface-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-surface-200 rounded-lg shadow-lg max-h-56 flex flex-col">
          {sections.length > 5 && (
            <div className="p-2 border-b border-surface-100">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sections..."
                className="w-full px-2 py-1.5 text-sm border border-surface-200 rounded focus:ring-1 focus:ring-primary-500 outline-none"
                autoFocus
              />
            </div>
          )}
          <div className="overflow-y-auto flex-1 p-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-surface-400">No sections found</div>
            ) : (
              filtered.map((s) => (
                <label
                  key={s.id}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded hover:bg-surface-50 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => toggle(s.id)}
                    className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-surface-800">{s.section_code}</span>
                  {s.section_name && (
                    <span className="text-surface-400 text-xs ml-auto truncate max-w-[140px]">{s.section_name}</span>
                  )}
                </label>
              ))
            )}
          </div>
          {selectedIds.length > 0 && (
            <div className="border-t border-surface-100 p-2 flex justify-between items-center">
              <span className="text-xs text-surface-500">{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ScheduleFormProps {
  form: ScheduleFormData
  setForm: (update: ScheduleFormData | ((prev: ScheduleFormData) => ScheduleFormData)) => void
  editingId: string | null
  error: string | null
  conflicts: ConflictFlag[]
  rooms: Room[]
  personnel: Personnel[]
  sections: Section[]
  onSubmit: () => Promise<boolean>
  onCancel: () => void
}

export default function ScheduleForm({
  form,
  setForm,
  editingId,
  error,
  conflicts,
  rooms,
  personnel,
  sections,
  onSubmit,
  onCancel
}: ScheduleFormProps): JSX.Element {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFormSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
      <h2 className="text-lg font-semibold">{editingId ? 'Edit' : 'New'} Schedule Entry</h2>

      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      {conflicts.length > 0 && (
        <div className="space-y-1">
          {conflicts.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                c.severity === 'HARD'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              <span className="font-semibold">{c.severity}:</span> {c.message}
            </div>
          ))}
        </div>
      )}

      {/* Row 1: Activity Type, Modality, Room, Personnel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Activity Type</label>
          <select
            value={form.activity_type}
            onChange={(e) => setForm({ ...form, activity_type: e.target.value as ActivityType })}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Modality</label>
          <select
            value={form.modality}
            onChange={(e) => setForm({ ...form, modality: e.target.value as Modality })}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="F2F">Face-to-Face</option>
            <option value="ONLINE">Online</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Assigned Room</label>
          <select
            value={form.room_id}
            onChange={(e) => setForm({ ...form, room_id: e.target.value })}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">— None —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>{r.room_code} — {r.room_name} ({r.capacity} seats)</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Assigned Instructor</label>
          <select
            value={form.personnel_id}
            onChange={(e) => setForm({ ...form, personnel_id: e.target.value })}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="">— None —</option>
            {personnel.map((p) => (
              <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Subject OR Exam fields + Sections */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {form.activity_type === 'EXAM' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Title *</label>
              <input
                type="text"
                value={form.exam_title}
                onChange={(e) => setForm({ ...form, exam_title: e.target.value })}
                placeholder="e.g. Midterm Exam"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Exam Type *</label>
              <select
                value={form.exam_type}
                onChange={(e) => setForm({ ...form, exam_type: e.target.value })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                required
              >
                <option value="">— Select —</option>
                <option value="MIDTERM">Midterm</option>
                <option value="FINAL">Final</option>
                <option value="QUIZ">Quiz</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </>
        ) : (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-surface-700 mb-1">Subject / Course Name</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="e.g. General Mathematics, English 101"
              className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        )}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-surface-700 mb-1">Assigned Sections</label>
          <SectionMultiSelect
            sections={sections}
            selectedIds={form.section_ids}
            onChange={(ids) => setForm({ ...form, section_ids: ids })}
          />
        </div>
      </div>

      {/* Row 3: Time, Recurrence, Override */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Start Time</label>
          <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">End Time</label>
          <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Recurrence Pattern</label>
          <select value={form.recurrence_pattern} onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value as RecurrencePattern })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
            {Object.entries(RECURRENCE_PATTERN_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">From Date</label>
          <input type="date" value={form.recurrence_start_date} onChange={(e) => setForm({ ...form, recurrence_start_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">To Date</label>
          <input type="date" value={form.recurrence_end_date} onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
          <input type="text" value={form.override_reason} onChange={(e) => setForm({ ...form, override_reason: e.target.value })} placeholder="e.g. Dean-approved room swap" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create Draft'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
