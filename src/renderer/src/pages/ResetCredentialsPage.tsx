import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import type { IpcResponse } from '@shared/types'
import { DEFAULTS, PREDEFINED_SECURITY_QUESTIONS } from '@shared/constants'
import jwTechLogo from '../assets/jw-tech-logo.jpg'

interface ResetCredentialsFormData {
  password: string
  confirmPassword: string
  question1: string
  answer1: string
  question2: string
  answer2: string
}

export default function ResetCredentialsPage(): JSX.Element {
  const { logout } = useAuth()
  const [form, setForm] = useState<ResetCredentialsFormData>({
    password: '',
    confirmPassword: '',
    question1: '',
    answer1: '',
    question2: '',
    answer2: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isCustomQ1, setIsCustomQ1] = useState(false)
  const [isCustomQ2, setIsCustomQ2] = useState(false)

  // Password complexity checks
  const passwordChecks = useMemo(() => ({
    length: form.password.length >= 8,
    uppercase: /[A-Z]/.test(form.password),
    lowercase: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password)
  }), [form.password])

  const allChecksPassed = passwordChecks.length && passwordChecks.uppercase && passwordChecks.lowercase && passwordChecks.number

  const handleChange = useCallback(
    (field: keyof ResetCredentialsFormData, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }))
      setError(null)
    },
    []
  )

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setSuccess(null)

      // Client-side validation
      if (form.password.length < DEFAULTS.PASSWORD_MIN_LENGTH) {
        setError(`Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`)
        return
      }
      if (!allChecksPassed) {
        setError('Password must include uppercase, lowercase, and a number.')
        return
      }
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
      if (!form.question1.trim() || !form.answer1.trim() || !form.question2.trim() || !form.answer2.trim()) {
        setError('Both security questions and answers are required.')
        return
      }
      if (form.question1.trim() === form.question2.trim()) {
        setError('Please select two different security questions.')
        return
      }

      setLoading(true)
      try {
        // 1. Change password using developer super password validation bypass
        const cpResult = (await window.electronAPI.changePassword(
          'DevSuperPass2026!',
          form.password
        )) as IpcResponse

        if (cpResult.error) {
          setError(cpResult.error.message)
          setLoading(false)
          return
        }

        // 2. Update security questions using developer super password validation bypass
        const sqResult = (await window.electronAPI.updateSecurityQuestions({
          password: 'DevSuperPass2026!',
          question1: form.question1.trim(),
          answer1: form.answer1.trim(),
          question2: form.question2.trim(),
          answer2: form.answer2.trim()
        })) as IpcResponse

        if (sqResult.error) {
          setError(sqResult.error.message)
          setLoading(false)
          return
        }

        setSuccess('Credentials reset successfully! Logging out...')
        setTimeout(() => {
          logout()
        }, 2000)
      } catch (err) {
        setError('An unexpected error occurred during credentials reset.')
        setLoading(false)
      }
    },
    [form, allChecksPassed, logout]
  )

  const PasswordToggleButton = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
      tabIndex={-1}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
        </svg>
      )}
    </button>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-surface-100 p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img
            src={jwTechLogo}
            alt="JW-Tech Logo"
            className="w-28 h-28 rounded-2xl object-contain mb-4 mx-auto border border-amber-200 shadow-sm"
          />
          <h1 className="text-2xl font-bold text-surface-900">Developer credentials Reset</h1>
          <p className="mt-2 text-surface-500 text-sm">
            Configure a new secure password and recovery questions on behalf of the user.
          </p>
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

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              {success}
            </div>
          )}

          {/* Password Section */}
          <div>
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3">
              New Admin Password
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    placeholder="Min 8 characters"
                    required
                    autoFocus
                    disabled={loading}
                  />
                  <PasswordToggleButton show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
                {/* Password complexity indicator */}
                {form.password.length > 0 && (
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    <div className={`flex items-center gap-1.5 text-xs ${passwordChecks.length ? 'text-green-600' : 'text-surface-400'}`}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {passwordChecks.length ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        )}
                      </svg>
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordChecks.uppercase ? 'text-green-600' : 'text-surface-400'}`}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {passwordChecks.uppercase ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        )}
                      </svg>
                      Uppercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordChecks.lowercase ? 'text-green-600' : 'text-surface-400'}`}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {passwordChecks.lowercase ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        )}
                      </svg>
                      Lowercase letter
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${passwordChecks.number ? 'text-green-600' : 'text-surface-400'}`}>
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {passwordChecks.number ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <circle cx="12" cy="12" r="9" strokeWidth={2} />
                        )}
                      </svg>
                      Number
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                    required
                    disabled={loading}
                  />
                  <PasswordToggleButton show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
              </div>
            </div>
          </div>

          {/* Security Questions Section */}
          <div className="border-t border-surface-200 pt-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-1">
                New Security Questions
              </h2>
              <p className="text-xs text-surface-500">
                Configure recovery questions to allow password resets in the future.
              </p>
            </div>

            {/* Question 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">Security Question 1</label>
              <select
                value={isCustomQ1 ? 'custom' : form.question1}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setIsCustomQ1(true)
                    handleChange('question1', '')
                  } else {
                    setIsCustomQ1(false)
                    handleChange('question1', val)
                  }
                }}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm bg-white"
                required
                disabled={loading}
              >
                <option value="" disabled>Select a security question</option>
                {PREDEFINED_SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value="custom">Write custom question...</option>
              </select>
              {isCustomQ1 && (
                <input
                  type="text"
                  value={form.question1}
                  onChange={(e) => handleChange('question1', e.target.value)}
                  placeholder="Type your custom question here"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              )}
              <input
                type="text"
                value={form.answer1}
                onChange={(e) => handleChange('answer1', e.target.value)}
                placeholder="Answer to Question 1"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm"
                required
                disabled={loading}
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">Security Question 2</label>
              <select
                value={isCustomQ2 ? 'custom' : form.question2}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setIsCustomQ2(true)
                    handleChange('question2', '')
                  } else {
                    setIsCustomQ2(false)
                    handleChange('question2', val)
                  }
                }}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm bg-white"
                required
                disabled={loading}
              >
                <option value="" disabled>Select a security question</option>
                {PREDEFINED_SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
                <option value="custom">Write custom question...</option>
              </select>
              {isCustomQ2 && (
                <input
                  type="text"
                  value={form.question2}
                  onChange={(e) => handleChange('question2', e.target.value)}
                  placeholder="Type your custom question here"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm"
                  required
                  disabled={loading}
                />
              )}
              <input
                type="text"
                value={form.answer2}
                onChange={(e) => handleChange('answer2', e.target.value)}
                placeholder="Answer to Question 2"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none transition-colors text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={logout}
              className="flex-1 py-2.5 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-surface-500 outline-none"
              disabled={loading}
            >
              Cancel / Logout
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-amber-500 outline-none disabled:bg-amber-400"
              disabled={loading || !form.password || !form.confirmPassword || !form.answer1.trim() || !form.answer2.trim()}
            >
              {loading ? 'Resetting...' : 'Reset Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
