import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../components/ToastProvider'
import { useConfirmDialog } from '../components/ConfirmDialog'
import type { IpcResponse } from '@shared/types'
import { PREDEFINED_SECURITY_QUESTIONS } from '@shared/constants'

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
  const [saving, setSaving] = useState(false)
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

  const updateSetting = async (key: string, value: string) => {
    setSaving(true)
    await window.electronAPI.updateSetting(key, value)
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPwError(null); setPwSuccess(false)
    if (passwordForm.newPassword !== passwordForm.confirm) { setPwError('Passwords do not match.'); return }
    if (passwordForm.newPassword.length < 4) { setPwError('Password must be at least 4 characters.'); return }
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

  if (loading) return <div className="text-center py-12 text-surface-400">Loading settings...</div>

  return (
    <div className="space-y-8 max-w-3xl">
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
    </div>
  )
}
