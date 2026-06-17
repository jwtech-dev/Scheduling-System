import { useState, useCallback, useEffect, useRef } from 'react'
import type { IpcResponse } from '@shared/types'
import jwTechLogo from '../assets/jw-tech-logo.jpg'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps): JSX.Element {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Recovery Flow State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryStep, setRecoveryStep] = useState(1) // 1 = answers, 2 = new password
  const [recoveryQuestions, setRecoveryQuestions] = useState<{ q1: string; q2: string } | null>(null)
  const [recoveryForm, setRecoveryForm] = useState({
    answer1: '',
    answer2: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [recoveryError, setRecoveryError] = useState<string | null>(null)
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  const [showRecoveryPassword, setShowRecoveryPassword] = useState(false)
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false)

  // Countdown timer for rate-limiting
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current)
        countdownRef.current = null
      }
      if (countdown === 0) setCountdown(null)
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev !== null && prev > 0 ? prev - 1 : null))
    }, 1000)
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [countdown])

  const handleForgotPasswordClick = async () => {
    setError(null)
    setSuccessMessage(null)
    setRecoveryError(null)
    try {
      const res = (await window.electronAPI.checkSecurityQuestionsConfigured()) as IpcResponse<{ configured: boolean }>
      if (res.data?.configured) {
        const questionsRes = (await window.electronAPI.getSecurityQuestions()) as IpcResponse<{ question1: string; question2: string }>
        if (questionsRes.data) {
          setRecoveryQuestions({
            q1: questionsRes.data.question1,
            q2: questionsRes.data.question2
          })
          setShowRecoveryModal(true)
          setRecoveryStep(1)
          setRecoveryForm({ answer1: '', answer2: '', newPassword: '', confirmPassword: '' })
        } else {
          setError(questionsRes.error?.message || 'Failed to load recovery questions.')
        }
      } else {
        setError('Security questions have not been set up for this account. Please log in and configure them under Settings.')
      }
    } catch {
      setError('An unexpected error occurred while loading recovery details.')
    }
  }

  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecoveryError(null)
    setRecoveryLoading(true)
    try {
      const result = (await window.electronAPI.verifySecurityAnswers({
        answer1: recoveryForm.answer1,
        answer2: recoveryForm.answer2
      })) as IpcResponse
      if (result.error) {
        setRecoveryError(result.error.message)
      } else {
        setRecoveryStep(2)
      }
    } catch {
      setRecoveryError('Failed to verify answers.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecoveryError(null)
    if (recoveryForm.newPassword !== recoveryForm.confirmPassword) {
      setRecoveryError('Passwords do not match.')
      return
    }
    if (recoveryForm.newPassword.length < 8) {
      setRecoveryError('Password must be at least 8 characters.')
      return
    }
    if (!/[A-Z]/.test(recoveryForm.newPassword) || !/[a-z]/.test(recoveryForm.newPassword) || !/[0-9]/.test(recoveryForm.newPassword)) {
      setRecoveryError('Password must include uppercase, lowercase, and a number.')
      return
    }

    setRecoveryLoading(true)
    try {
      const result = (await window.electronAPI.resetPassword({
        answer1: recoveryForm.answer1,
        answer2: recoveryForm.answer2,
        newPassword: recoveryForm.newPassword
      })) as IpcResponse
      if (result.error) {
        setRecoveryError(result.error.message)
      } else {
        setShowRecoveryModal(false)
        setPassword('')
        setError(null)
        setSuccessMessage('Password reset successfully. Please log in with your new password.')
      }
    } catch {
      setRecoveryError('An unexpected error occurred.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const handleRecoveryFormChange = (field: string, val: string) => {
    setRecoveryForm(prev => ({ ...prev, [field]: val }))
    setRecoveryError(null)
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setSuccessMessage(null)
      setLoading(true)

      try {
        const result = (await window.electronAPI.login(password)) as IpcResponse
        if (result.error) {
          const msg = result.error.message
          setError(msg)
          setPassword('')

          // Read rate-limit countdown from structured error details
          const details = result.error.details as { remaining_seconds?: number } | undefined
          if (details?.remaining_seconds) {
            setCountdown(details.remaining_seconds)
          } else {
            // Fallback: parse from message for backwards compatibility
            const match = msg.match(/Try again in (\d+)/i)
            if (match) {
              setCountdown(parseInt(match[1], 10))
            }
          }
        } else {
          onLogin()
        }
      } catch {
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    },
    [password, onLogin]
  )

  const isRateLimited = countdown !== null && countdown > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-surface-100 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src={jwTechLogo}
            alt="JW-Tech Logo"
            className="w-32 h-32 rounded-2xl object-contain mb-4 mx-auto"
          />
          <h1 className="text-2xl font-bold text-surface-900">Welcome Back</h1>
          <p className="mt-2 text-surface-500">Enter your password to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-lg shadow-surface-200/50 border border-surface-200 p-8 space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm animate-shake">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {successMessage}
            </div>
          )}

          {isRateLimited && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm text-center">
              <span className="font-medium">Too many attempts.</span> Try again in{' '}
              <span className="font-mono font-bold text-amber-900">{countdown}s</span>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-surface-700">Password</label>
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline focus:outline-none"
                tabIndex={-1}
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                  setSuccessMessage(null)
                }}
                className="w-full px-3 py-2.5 pr-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-lg"
                placeholder="Enter your password"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
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
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password || isRateLimited}
            className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 outline-none"
          >
            {loading ? 'Logging in...' : isRateLimited ? `Wait ${countdown}s` : 'Log In'}
          </button>
        </form>
      </div>

      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-surface-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-surface-100 pb-3">
              <h3 className="text-lg font-bold text-surface-900">Reset Password</h3>
              <button
                onClick={() => { setShowRecoveryModal(false); setPassword('') }}
                className="text-surface-400 hover:text-surface-600 transition-colors"
                disabled={recoveryLoading}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {recoveryError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {recoveryError}
              </div>
            )}

            {recoveryStep === 1 && recoveryQuestions && (
              <form onSubmit={handleVerifyAnswers} className="space-y-4">
                <p className="text-sm text-surface-500">
                  Answer your security questions to verify your identity.
                </p>

                {/* Question 1 */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">
                    Question 1
                  </label>
                  <p className="text-sm font-medium text-surface-900 bg-surface-50 p-2.5 rounded-lg border border-surface-200">
                    {recoveryQuestions.q1}
                  </p>
                  <input
                    type="text"
                    value={recoveryForm.answer1}
                    onChange={(e) => handleRecoveryFormChange('answer1', e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors text-sm"
                    required
                    autoFocus
                  />
                </div>

                {/* Question 2 */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">
                    Question 2
                  </label>
                  <p className="text-sm font-medium text-surface-900 bg-surface-50 p-2.5 rounded-lg border border-surface-200">
                    {recoveryQuestions.q2}
                  </p>
                  <input
                    type="text"
                    value={recoveryForm.answer2}
                    onChange={(e) => handleRecoveryFormChange('answer2', e.target.value)}
                    placeholder="Your answer"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors text-sm"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowRecoveryModal(false); setPassword('') }}
                    className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-surface-500 outline-none"
                    disabled={recoveryLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-primary-400"
                    disabled={recoveryLoading || !recoveryForm.answer1.trim() || !recoveryForm.answer2.trim()}
                  >
                    {recoveryLoading ? 'Verifying...' : 'Next'}
                  </button>
                </div>
              </form>
            )}

            {recoveryStep === 2 && (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                <p className="text-sm text-surface-500">
                  Identity verified. Enter a new secure password.
                </p>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showRecoveryPassword ? 'text' : 'password'}
                      value={recoveryForm.newPassword}
                      onChange={(e) => handleRecoveryFormChange('newPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-sm"
                      placeholder="Min 8 characters with Uppercase, Lowercase, and Number"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryPassword(!showRecoveryPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showRecoveryPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showRecoveryConfirmPassword ? 'text' : 'password'}
                      value={recoveryForm.confirmPassword}
                      onChange={(e) => handleRecoveryFormChange('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 pr-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryConfirmPassword(!showRecoveryConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-surface-400 hover:text-surface-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showRecoveryConfirmPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="flex-1 py-2 bg-surface-100 hover:bg-surface-200 text-surface-700 font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-surface-500 outline-none"
                    disabled={recoveryLoading}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg text-sm transition-colors focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-primary-400"
                    disabled={recoveryLoading || !recoveryForm.newPassword || !recoveryForm.confirmPassword}
                  >
                    {recoveryLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
