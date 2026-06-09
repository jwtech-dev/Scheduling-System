import { useState, useEffect, useCallback } from 'react'
import type { IpcResponse } from '@shared/types'

export default function SettingsPage(): JSX.Element {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' })
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    const result = (await window.electronAPI.getAllSettings()) as IpcResponse<Record<string, string>>
    if (result.data) setSettings(result.data)
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

  const handleUploadLogo = async () => {
    const result = (await window.electronAPI.uploadLogo()) as IpcResponse<{ success: boolean }>
    if (result.data?.success) { const lr = (await window.electronAPI.getLogo()) as IpcResponse<{ logo: string | null }>; if (lr.data) setLogo(lr.data.logo) }
  }

  const handleRemoveLogo = async () => {
    await window.electronAPI.removeLogo(); setLogo(null)
  }

  const handleBackup = async () => {
    const result = (await window.electronAPI.createBackup()) as IpcResponse<{ path: string }>
    if (result.data) alert(`Backup saved to: ${result.data.path}`)
    else if (result.error) alert(result.error.message)
  }

  const handleRestore = async () => {
    if (!confirm('This will replace the current database with the backup. Continue?')) return
    const result = (await window.electronAPI.restoreBackup({})) as IpcResponse
    if (result.data) { alert('Backup restored. The app will reload.'); window.location.reload() }
    else if (result.error) alert(result.error.message)
  }

  if (loading) return <div className="text-center py-12 text-surface-400">Loading settings...</div>

  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-surface-900">Settings</h1>

      {/* Period Lengths */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Period Lengths</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">SHS Period (minutes)</label>
            <input type="number" value={settings.shs_period_length ?? '60'} onChange={(e) => updateSetting('shs_period_length', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={15} max={180} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">College Period (minutes)</label>
            <input type="number" value={settings.college_period_length ?? '90'} onChange={(e) => updateSetting('college_period_length', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" min={15} max={180} />
          </div>
        </div>
      </section>

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
            <label className="block text-sm font-medium text-surface-700 mb-1">Contact Info</label>
            <input type="text" value={settings.institution_contact ?? ''} onChange={(e) => updateSetting('institution_contact', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Tel. No. 7754-9645 Mobile No. 0919-893-4789, 0917-125-4442" />
          </div>
        </div>
      </section>

      {/* Document Signatories */}
      <section className="bg-white p-6 rounded-xl border border-surface-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-surface-800">Document Signatories</h2>
        <p className="text-xs text-surface-500">Names and titles shown in the &quot;Prepared by&quot; / &quot;Received by&quot; footer of exports.</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-surface-600">Prepared by</h3>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Full Name</label>
              <input type="text" value={settings.prepared_by_name ?? ''} onChange={(e) => updateSetting('prepared_by_name', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="e.g. MARY RACHELLE L. VILLARAMA, MAEd" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Title / Position</label>
              <input type="text" value={settings.prepared_by_title ?? ''} onChange={(e) => updateSetting('prepared_by_title', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="e.g. SHS Principal" />
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-surface-600">Received by</h3>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Full Name</label>
              <input type="text" value={settings.received_by_name ?? ''} onChange={(e) => updateSetting('received_by_name', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="e.g. Ms. JEAN CLAIRE NOSORA" />
            </div>
            <div>
              <label className="block text-xs text-surface-500 mb-1">Title / Position</label>
              <input type="text" value={settings.received_by_title ?? ''} onChange={(e) => updateSetting('received_by_title', e.target.value)} className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm" placeholder="e.g. Chief Registrar" />
            </div>
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
