import { useState } from 'react'
import type { ScheduleFormData } from '../../hooks/useScheduleData'
import type { ConflictFlag, Room, Personnel, Section } from '@shared/types'
import type { ActivityType, PatternMode, Modality } from '@shared/types'
import { ACTIVITY_TYPES, ACTIVITY_TYPE_LABELS, PATTERN_MODE_LABELS, DAY_LABELS, DAYS_IN_ORDER } from '@shared/constants'
import MultiSelectDropdown from '../../components/MultiSelectDropdown'

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

/** Get the full day name for a date string (YYYY-MM-DD) */
function getDayName(dateStr: string): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

/** Ordinal suffix for a number (1st, 2nd, 3rd, etc.) */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
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

  const toggleDay = (day: number): void => {
    setForm((prev) => {
      const days = prev.selected_days.includes(day)
        ? prev.selected_days.filter((d) => d !== day)
        : [...prev.selected_days, day]
      return { ...prev, selected_days: days }
    })
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
          <MultiSelectDropdown
            options={sections.map(s => ({ value: s.id, label: `${s.section_code}${s.subject ? ` — ${s.subject}` : ''}` }))}
            selected={form.section_ids}
            onChange={(ids) => setForm({ ...form, section_ids: ids })}
            placeholder="Select sections..."
          />
        </div>
      </div>

      {/* Row 3: Time, Pattern Mode, Dates */}
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
          <label className="block text-sm font-medium text-surface-700 mb-1">Pattern</label>
          <select
            value={form.pattern_mode}
            onChange={(e) => {
              const mode = e.target.value as PatternMode
              setForm({
                ...form,
                pattern_mode: mode,
                // Reset sub-fields when switching modes
                selected_days: mode === 'WEEKLY' ? [1, 3, 5] : [],
                day_of_month: mode === 'MONTHLY' ? 1 : null
              })
            }}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
          >
            {(Object.entries(PATTERN_MODE_LABELS) as [PatternMode, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">From Date</label>
          <input type="date" value={form.recurrence_start_date} onChange={(e) => setForm({ ...form, recurrence_start_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
        </div>
        {form.pattern_mode !== 'ONCE' && (
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">To Date</label>
            <input type="date" value={form.recurrence_end_date} onChange={(e) => setForm({ ...form, recurrence_end_date: e.target.value })} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Override Reason</label>
          <input type="text" value={form.override_reason} onChange={(e) => setForm({ ...form, override_reason: e.target.value })} placeholder="e.g. Dean-approved room swap" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
      </div>

      {/* Pattern sub-controls */}
      {form.pattern_mode === 'WEEKLY' && (
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-2">Schedule Days</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_IN_ORDER.map((day) => {
              const isSelected = form.selected_days.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-surface-600 border-surface-300 hover:border-primary-400 hover:text-primary-600'
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              )
            })}
          </div>
          {form.selected_days.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">Select at least one day</p>
          )}
        </div>
      )}

      {form.pattern_mode === 'ONCE' && form.recurrence_start_date && (
        <div className="flex items-center gap-2 text-sm text-surface-600">
          <span className="font-medium">Falls on:</span>
          <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full font-medium">
            {getDayName(form.recurrence_start_date)}
          </span>
        </div>
      )}

      {form.pattern_mode === 'MONTHLY' && (
        <div>
          <label className="block text-sm font-medium text-surface-700 mb-1">Day of Month</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={31}
              value={form.day_of_month ?? 1}
              onChange={(e) => setForm({ ...form, day_of_month: parseInt(e.target.value, 10) || 1 })}
              className="w-20 px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            <span className="text-sm text-surface-500">
              Every {ordinal(form.day_of_month ?? 1)} of the month
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting || (form.pattern_mode === 'WEEKLY' && form.selected_days.length === 0)}
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
