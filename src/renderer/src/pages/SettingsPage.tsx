import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse, UpdateInfo, UpdateDownloadProgress } from '@shared/types'
import { PREDEFINED_SECURITY_QUESTIONS, DEFAULTS } from '@shared/constants'

/* ── Contact number helpers ── */

function parseContactString(contact: string): { telNumbers: string[]; mobileNumbers: string[] } {
  const telNumbers: string[] = []
  const mobileNumbers: string[] = []
  if (!contact.trim()) return { telNumbers: [''], mobileNumbers: [''] }

  // Extract tel numbers: "Tel. No. XXXX" or "Tel No. XXXX" patterns
  const telRegex = /Tel\.?\s*No\.?\s*([\d\s\-()]+)/gi
  let match: RegExpExecArray | null
  while ((match = telRegex.exec(contact)) !== null) {
    const num = match[1].trim()
    if (num) telNumbers.push(num)
  }

  // Extract mobile numbers: "Mobile No. XXXX" or "Mobile No. XXXX, XXXX" patterns
  const mobileRegex = /Mobile\s*No\.?\s*([\d\s\-(),]+)/gi
  while ((match = mobileRegex.exec(contact)) !== null) {
    const raw = match[1].trim()
    // Split by comma in case multiple are listed after one "Mobile No."
    const nums = raw.split(',').map(n => n.trim()).filter(Boolean)
    mobileNumbers.push(...nums)
  }

  return {
    telNumbers: telNumbers.length > 0 ? telNumbers : [''],
    mobileNumbers: mobileNumbers.length > 0 ? mobileNumbers : ['']
  }
}

function composeContactString(telNumbers: string[], mobileNumbers: string[]): string {
  const parts: string[] = []
  const validTels = telNumbers.filter(n => n.trim())
  const validMobiles = mobileNumbers.filter(n => n.trim())
  if (validTels.length > 0) {
    parts.push(validTels.map(t => `Tel. No. ${t}`).join(' '))
  }
  if (validMobiles.length > 0) {
    parts.push(`Mobile No. ${validMobiles.join(', ')}`)
  }
  return parts.join(' ')
}

export default function SettingsPage(): JSX.Element {
  const toast = useToast()
  const { confirm } = useConfirmDialog()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [telNumbers, setTelNumbers] = useState<string[]>([''])
  const [mobileNumbers, setMobileNumbers] = useState<string[]>([''])
  const [isCustomQ1, setIsCustomQ1] = useState(false)
  const [isCustomQ2, setIsCustomQ2] = useState(false)
  const [isLocked, setIsLocked] = useState(true)

  const [questionsForm, setQuestionsForm] = useState({
    password: '',
    question1: '',
    answer1: '',
    question2: '',
    answer2: ''
  })

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.getAllSettings()) as IpcResponse<Record<string, string>>
    if (result.data) {
      setSettings(result.data)
      const parsed = parseContactString(result.data.institution_contact ?? '')
      setTelNumbers(parsed.telNumbers)
      setMobileNumbers(parsed.mobileNumbers)

      const q1 = result.data.security_question_1 ?? ''
      const q2 = result.data.security_question_2 ?? ''
      setIsCustomQ1(q1 !== '' && !PREDEFINED_SECURITY_QUESTIONS.includes(q1))
      setIsCustomQ2(q2 !== '' && !PREDEFINED_SECURITY_QUESTIONS.includes(q2))
      setIsLocked(!!(q1 && q2))

      setQuestionsForm(prev => ({
        ...prev,
        question1: q1,
        question2: q2,
        password: '',
        answer1: '',
        answer2: ''
      }))
    }
    const logoResult = (await window.electronAPI.getLogo()) as IpcResponse<{ logo: string | null }>
    if (logoResult.data) setLogo(logoResult.data.logo)
    setLoading(false)
  }, [])

  useEffect(() => { loadSettings() }, [loadSettings])

  // ── Debounced settings persistence ─────────────────────────
  // Batches IPC calls per key with a 500ms debounce window.
  // Flushes any pending writes on beforeunload to prevent data loss.
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pendingWrites = useRef<Record<string, string>>({})

  const flushPendingWrites = useCallback(() => {
    for (const [key, value] of Object.entries(pendingWrites.current)) {
      window.electronAPI.updateSetting(key, value)
    }
    pendingWrites.current = {}
    for (const timer of Object.values(debounceTimers.current)) {
      clearTimeout(timer)
    }
    debounceTimers.current = {}
  }, [])

  useEffect(() => {
    const handleBeforeUnload = (): void => { flushPendingWrites() }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      flushPendingWrites()
    }
  }, [flushPendingWrites])

  const updateSetting = (key: string, value: string): void => {
    // Update local state immediately for responsive UI
    setSettings(prev => ({ ...prev, [key]: value }))

    // Clear any existing debounce timer for this key
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key])
    }

    // Track the pending value
    pendingWrites.current[key] = value

    // Debounce the IPC call
    debounceTimers.current[key] = setTimeout(() => {
      window.electronAPI.updateSetting(key, pendingWrites.current[key])
      delete pendingWrites.current[key]
      delete debounceTimers.current[key]
    }, 500)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(null); setPwSuccess(false)
    if (passwordForm.newPassword !== passwordForm.confirm) { setPwError('Passwords do not match.'); return }
    if (passwordForm.newPassword.length < DEFAULTS.PASSWORD_MIN_LENGTH) { setPwError(`Password must be at least ${DEFAULTS.PASSWORD_MIN_LENGTH} characters.`); return }
    const result = (await window.electronAPI.changePassword(passwordForm.current, passwordForm.newPassword)) as IpcResponse
    if (result.error) setPwError(result.error.message)
    else { setPwSuccess(true); setPasswordForm({ current: '', newPassword: '', confirm: '' }) }
  }

  const handleUpdateSecurityQuestions = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!questionsForm.question1.trim() || !questionsForm.answer1.trim() || !questionsForm.question2.trim() || !questionsForm.answer2.trim()) {
      toast.error('All questions and answers are required.')
      return
    }
    if (questionsForm.question1.trim() === questionsForm.question2.trim()) {
      toast.error('Security questions must be different.')
      return
    }

    try {
      const result = (await window.electronAPI.updateSecurityQuestions({
        password: questionsForm.password,
        question1: questionsForm.question1,
        answer1: questionsForm.answer1,
        question2: questionsForm.question2,
        answer2: questionsForm.answer2
      })) as IpcResponse

      if (result.error) {
        toast.error(result.error.message)
      } else {
        toast.success('Security questions updated successfully.')
        setQuestionsForm(prev => ({
          ...prev,
          password: '',
          answer1: '',
          answer2: ''
        }))
        // Refresh settings
        loadSettings()
      }
    } catch {
      toast.error('An unexpected error occurred.')
    }
  }

  const handleCancelEditQuestions = () => {
    const q1 = settings.security_question_1 ?? ''
    const q2 = settings.security_question_2 ?? ''
    setIsCustomQ1(q1 !== '' && !PREDEFINED_SECURITY_QUESTIONS.includes(q1))
    setIsCustomQ2(q2 !== '' && !PREDEFINED_SECURITY_QUESTIONS.includes(q2))
    setQuestionsForm({
      password: '',
      question1: q1,
      answer1: '',
      question2: q2,
      answer2: ''
    })
    setIsLocked(true)
  }

  const handleUploadLogo = async () => {
    const result = (await window.electronAPI.uploadLogo()) as IpcResponse<{ success: boolean }>
    if (result.data?.success) { const lr = (await window.electronAPI.getLogo()) as IpcResponse<{ logo: string | null }>; if (lr.data) setLogo(lr.data.logo) }
  }

  const handleRemoveLogo = async () => {
    await window.electronAPI.removeLogo(); setLogo(null)
  }

  const handleBackup = async () => {
    const result = (await window.electronAPI.createBackup()) as IpcResponse<{ path: string }>
    if (result.data) toast.success(`Backup saved to: ${result.data.path}`)
    else if (result.error) toast.error(result.error.message)
  }

  const handleRestore = async () => {
    const confirmed = await confirm({
      title: 'Restore Backup',
      message: 'This will replace the current database with the backup. All unsaved changes will be lost.',
      variant: 'danger',
      confirmLabel: 'Restore'
    })
    if (!confirmed) return
    const result = (await window.electronAPI.restoreBackup({})) as IpcResponse
    if (result.data) { toast.success('Backup restored. The app will reload.'); setTimeout(() => window.location.reload(), 1500) }
    else if (result.error) toast.error(result.error.message)
  }

  // Reset App state
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [resetInput, setResetInput] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const RESET_PHRASE = 'Reset "Schedule Manager"'

  const handleResetStep1 = async () => {
    const confirmed = await confirm({
      title: '⚠️ Reset Application',
      message: 'Are you sure you want to reset the app? This will permanently delete ALL data including accounts, subjects, sections, schedules, and settings. This action CANNOT be undone.',
      variant: 'danger',
      confirmLabel: 'Continue to Reset'
    })
    if (!confirmed) return
    setResetInput('')
    setShowResetConfirm(true)
  }

  const handleResetStep2 = async () => {
    if (resetInput !== RESET_PHRASE) return
    setIsResetting(true)
    try {
      const result = (await window.electronAPI.resetApp()) as IpcResponse
      if (result.error) { toast.error(result.error.message); return }
      toast.success('App has been reset. Reloading...')
      setTimeout(() => window.location.reload(), 1500)
    } finally {
      setIsResetting(false)
      setShowResetConfirm(false)
    }
  }

  // ── Update state ─────────────────────────────────────────────
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateProgress, setUpdateProgress] = useState<UpdateDownloadProgress | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Fetch initial update status
    window.electronAPI.getUpdateStatus().then((result) => {
      const res = result as IpcResponse<UpdateInfo>
      if (res.data) setUpdateInfo(res.data)
    })

    // Subscribe to push events
    const unsubStatus = window.electronAPI.onUpdateStatusChanged((data) => {
      const info = data as UpdateInfo
      setUpdateInfo(info)
      if (info.status !== 'checking') setIsChecking(false)
    })
    const unsubProgress = window.electronAPI.onUpdateDownloadProgress((data) => {
      setUpdateProgress(data as UpdateDownloadProgress)
    })

    return () => {
      unsubStatus()
      unsubProgress()
    }
  }, [])

  const handleCheckForUpdates = async () => {
    setIsChecking(true)
    await window.electronAPI.checkForUpdates()
    // Real status will arrive via push event
  }

  const handleDownloadUpdate = async () => {
    setUpdateProgress(null)
    await window.electronAPI.downloadUpdate()
  }

  if (loading) return <div className="text-center py-12 text-surface-400">Loading settings...</div>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>



      {/* Institution Logo */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Institution Logo</h2>
        <div className="flex items-center gap-4">
          {logo ? <img src={logo} alt="Logo" className="w-16 h-16 object-contain rounded-lg border border-surface-200" /> : <div className="w-16 h-16 bg-surface-100 rounded-lg flex items-center justify-center text-surface-400 text-xs">No logo</div>}
          <div className="flex gap-2">
            <button onClick={handleUploadLogo} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Upload</button>
            {logo && <button onClick={handleRemoveLogo} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200">Remove</button>}
          </div>
        </div>
      </section>

      {/* Institution Details */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Institution Details</h2>
        <p className="text-xs text-surface-500">Used in the header area of exam schedule exports.</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Institution Name</label>
            <input type="text" value={settings.institution_name ?? ''} onChange={(e) => updateSetting('institution_name', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. INTEGRATED INNOVATION AND HOSPITALITY COLLEGES, INC." />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Address</label>
            <input type="text" value={settings.institution_address ?? ''} onChange={(e) => updateSetting('institution_address', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Buenavista St., Brgy. Novaliches Proper, Novaliches, Quezon City" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Tel No.</label>
            <div className="space-y-2">
              {telNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => {
                      const updated = [...telNumbers]
                      updated[idx] = e.target.value
                      setTelNumbers(updated)
                      updateSetting('institution_contact', composeContactString(updated, mobileNumbers))
                    }}
                    className="flex-1 px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 7754-9645"
                  />
                  {telNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = telNumbers.filter((_, i) => i !== idx)
                        setTelNumbers(updated)
                        updateSetting('institution_contact', composeContactString(updated, mobileNumbers))
                      }}
                      className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setTelNumbers([...telNumbers, ''])}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                Add Tel No.
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-2">Mobile No.</label>
            <div className="space-y-2">
              {mobileNumbers.map((num, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={num}
                    onChange={(e) => {
                      const updated = [...mobileNumbers]
                      updated[idx] = e.target.value
                      setMobileNumbers(updated)
                      updateSetting('institution_contact', composeContactString(telNumbers, updated))
                    }}
                    className="flex-1 px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 0919-893-4789"
                  />
                  {mobileNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = mobileNumbers.filter((_, i) => i !== idx)
                        setMobileNumbers(updated)
                        updateSetting('institution_contact', composeContactString(telNumbers, updated))
                      }}
                      className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMobileNumbers([...mobileNumbers, ''])}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-2 py-1 rounded-md transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                Add Mobile No.
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <input type="text" value={settings.institution_email ?? ''} onChange={(e) => updateSetting('institution_email', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. iihcolleges@gmail.com" />
          </div>
        </div>
      </section>



      {/* Footer Credit */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Footer Credit</h2>
        <input type="text" value={settings.footer_credit ?? ''} onChange={(e) => updateSetting('footer_credit', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. © 2025 Your Institution" maxLength={200} />
      </section>

      {/* Change Password */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Change Password</h2>
        {pwError && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{pwError}</div>}
        {pwSuccess && <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">Password changed successfully.</div>}
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm(f => ({ ...f, current: e.target.value }))} placeholder="Current password" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
          <div className="grid grid-cols-2 gap-3">
            <input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="New password" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
            <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Confirm new password" className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" required />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">Change Password</button>
        </form>
      </section>

      {/* Security Questions */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-surface-800">Security Questions</h2>
            <p className="text-xs text-surface-500">
              Configure security questions to recover your password. Requires verifying your current password.
            </p>
          </div>
          {isLocked && (
            <button
              type="button"
              onClick={() => setIsLocked(false)}
              className="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 text-surface-700 rounded-lg text-sm font-medium transition-colors"
            >
              Edit Security Questions
            </button>
          )}
        </div>
        <form onSubmit={handleUpdateSecurityQuestions} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Question 1 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">Security Question 1</label>
              <select
                value={isCustomQ1 ? 'custom' : questionsForm.question1}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setIsCustomQ1(true)
                    setQuestionsForm(prev => ({ ...prev, question1: '' }))
                  } else {
                    setIsCustomQ1(false)
                    setQuestionsForm(prev => ({ ...prev, question1: val }))
                  }
                }}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white disabled:bg-surface-50 disabled:text-surface-500"
                required
                disabled={isLocked}
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
                  value={questionsForm.question1}
                  onChange={(e) => setQuestionsForm(prev => ({ ...prev, question1: e.target.value }))}
                  placeholder="Type your custom question here"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:bg-surface-50 disabled:text-surface-500"
                  required
                  disabled={isLocked}
                />
              )}
              <input
                type="text"
                value={isLocked ? '••••••••' : questionsForm.answer1}
                onChange={(e) => setQuestionsForm(prev => ({ ...prev, answer1: e.target.value }))}
                placeholder={isLocked ? 'Answer configured' : 'Answer to Question 1 (will be hidden once saved)'}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:bg-surface-50 disabled:text-surface-400"
                required
                disabled={isLocked}
              />
            </div>

            {/* Question 2 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-surface-600 uppercase tracking-wider">Security Question 2</label>
              <select
                value={isCustomQ2 ? 'custom' : questionsForm.question2}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'custom') {
                    setIsCustomQ2(true)
                    setQuestionsForm(prev => ({ ...prev, question2: '' }))
                  } else {
                    setIsCustomQ2(false)
                    setQuestionsForm(prev => ({ ...prev, question2: val }))
                  }
                }}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm bg-white disabled:bg-surface-50 disabled:text-surface-500"
                required
                disabled={isLocked}
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
                  value={questionsForm.question2}
                  onChange={(e) => setQuestionsForm(prev => ({ ...prev, question2: e.target.value }))}
                  placeholder="Type your custom question here"
                  className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:bg-surface-50 disabled:text-surface-500"
                  required
                  disabled={isLocked}
                />
              )}
              <input
                type="text"
                value={isLocked ? '••••••••' : questionsForm.answer2}
                onChange={(e) => setQuestionsForm(prev => ({ ...prev, answer2: e.target.value }))}
                placeholder={isLocked ? 'Answer configured' : 'Answer to Question 2 (will be hidden once saved)'}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm disabled:bg-surface-50 disabled:text-surface-400"
                required
                disabled={isLocked}
              />
            </div>
          </div>

          {!isLocked && (
            <div className="border-t border-surface-100 pt-3 space-y-3">
              <input
                type="password"
                value={questionsForm.password}
                onChange={(e) => setQuestionsForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Confirm current admin password to save"
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                  Save Security Questions
                </button>
                {settings.security_question_1 && settings.security_question_2 && (
                  <button
                    type="button"
                    onClick={handleCancelEditQuestions}
                    className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </section>

      {/* Backup */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Backup & Restore</h2>
        <p className="text-sm text-surface-500">Last backup: {settings.last_backup_date ? new Date(settings.last_backup_date).toLocaleDateString() : 'Never'}</p>
        <div className="flex gap-2">
          <button onClick={handleBackup} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">Create Backup</button>
          <button onClick={handleRestore} className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium">Restore from Backup</button>
        </div>
      </section>

      {/* Updates */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-surface-800">Updates</h2>
            <p className="text-sm text-surface-500 mt-0.5">
              Current version: <span className="font-mono font-medium text-surface-700">v{updateInfo?.currentVersion ?? '—'}</span>
            </p>
          </div>
          {/* Status badge */}
          {updateInfo && updateInfo.status !== 'checking' && updateInfo.status !== 'downloading' && updateInfo.status !== 'downloaded' && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              updateInfo.status === 'up-to-date'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : updateInfo.status === 'available'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : updateInfo.status === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-surface-50 text-surface-600 border border-surface-200'
            }`}>
              {updateInfo.status === 'up-to-date' && (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>Up to date</>
              )}
              {updateInfo.status === 'available' && (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Update available — v{updateInfo.availableVersion}</>
              )}
              {updateInfo.status === 'error' && (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>Check failed</>
              )}
            </span>
          )}
        </div>

        {/* Download progress */}
        {(updateInfo?.status === 'downloading') && (
          <div className="space-y-1.5">
            <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(updateProgress?.percent ?? 0, 100)}%` }}
              />
            </div>
            <p className="text-xs text-surface-400">
              {updateProgress && updateProgress.percent > 0
                ? `Downloading… ${Math.round(updateProgress.percent)}%`
                : 'Starting download…'}
            </p>
          </div>
        )}

        {/* Installing indicator */}
        {updateInfo?.status === 'downloaded' && (
          <div className="flex items-center gap-2 text-sm text-primary-700">
            <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            Installing update and restarting…
          </div>
        )}

        {/* Error message */}
        {updateInfo?.status === 'error' && updateInfo.error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {updateInfo.error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCheckForUpdates}
            disabled={isChecking || updateInfo?.status === 'downloading' || updateInfo?.status === 'downloaded'}
            className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg hover:bg-surface-200 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isChecking && (
              <div className="w-3.5 h-3.5 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
            )}
            {isChecking ? 'Checking…' : 'Check for Updates'}
          </button>
          {updateInfo?.status === 'available' && (
            <button
              onClick={handleDownloadUpdate}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium transition-colors"
            >
              Update Now
            </button>
          )}
        </div>
      </section>

      {/* Reset App */}
      <section className="bg-white p-6 rounded-xl border border-red-200 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-red-800">Danger Zone</h2>
            <p className="text-sm text-surface-500 mt-0.5">Reset the app to its initial state. This will permanently delete all data including accounts, subjects, sections, schedules, and settings.</p>
          </div>
        </div>
        <button onClick={handleResetStep1} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors">Reset App</button>
      </section>

      {/* Reset Type-Confirm Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]" onClick={() => setShowResetConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[26rem] animate-[modal-dialog-in_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-surface-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-surface-900">Confirm Reset</h2>
                  <p className="text-xs text-surface-500">This action is irreversible.</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-surface-600">To confirm, type <strong className="text-red-700 select-all">{RESET_PHRASE}</strong> below:</p>
              <input
                type="text"
                value={resetInput}
                onChange={(e) => setResetInput(e.target.value)}
                placeholder={RESET_PHRASE}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button type="button" onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors">Cancel</button>
                <button
                  type="button"
                  onClick={handleResetStep2}
                  disabled={resetInput !== RESET_PHRASE || isResetting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed shadow-sm transition-colors"
                >
                  {isResetting ? 'Resetting...' : 'Reset Everything'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
