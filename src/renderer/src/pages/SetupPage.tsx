import { useState, useCallback } from 'react'
import type { IpcResponse } from '@shared/types'
import { DEFAULTS } from '@shared/constants'

interface SetupFormData {
  adminName: string
  adminEmail: string
  password: string
  confirmPassword: string
  shsPeriodLength: number
  collegePeriodLength: number
  timeSlotStart: string
  timeSlotEnd: string
}

export default function SetupPage(): JSX.Element {
  const [form, setForm] = useState<SetupFormData>({
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: '',
    shsPeriodLength: DEFAULTS.SHS_PERIOD_LENGTH,
    collegePeriodLength: DEFAULTS.COLLEGE_PERIOD_LENGTH,
    timeSlotStart: DEFAULTS.TIME_SLOT_START,
    timeSlotEnd: DEFAULTS.TIME_SLOT_END
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleChange = useCallback(
    (field: keyof SetupFormData, value: string | number) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)

      // Client-side validation
      if (!form.adminName.trim()) {
        setError('Name is required.')
        return
      }
      if (form.password.length < DEFAULTS.PASSWORD_MIN_LENGTH) {
        setError(`Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`)
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      setLoading(true)
      try {
        const result = (await window.electronAPI.completeSetup(form)) as IpcResponse
        if (result.error) {
          setError(result.error.message)
        } else {
          // Redirect to login
          window.location.hash = '/login'
          window.location.reload()
        }
      } catch (err) {
        setError('An unexpected error occurred during setup.')
      } finally {
        setLoading(false)
      }
    },
    [form]
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-surface-900">Schedule Management System</h1>
          <p className="mt-2 text-surface-500">Set up your admin account and scheduling defaults</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg shadow-surface-200/50 border border-surface-200 p-8 space-y-6"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Admin Profile */}
          <div>
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
              Admin Profile
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="e.g. Joshua Colobong"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="e.g. josh@gmail.com"
                />
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div>
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
              Admin Password
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Min 4 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Period Lengths */}
          <div>
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
              Period Lengths (minutes)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">SHS</label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={form.shsPeriodLength}
                  onChange={(e) => handleChange('shsPeriodLength', parseInt(e.target.value) || 60)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">College</label>
                <input
                  type="number"
                  min={15}
                  max={180}
                  value={form.collegePeriodLength}
                  onChange={(e) => handleChange('collegePeriodLength', parseInt(e.target.value) || 90)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div>
            <h2 className="text-sm font-semibold text-surface-700 uppercase tracking-wider mb-3">
              Time Slot Range
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Start</label>
                <input
                  type="time"
                  value={form.timeSlotStart}
                  onChange={(e) => handleChange('timeSlotStart', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">End</label>
                <input
                  type="time"
                  value={form.timeSlotEnd}
                  onChange={(e) => handleChange('timeSlotEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 outline-none"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  )
}
