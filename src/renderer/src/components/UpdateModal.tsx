// ============================================================
// UpdateModal — Global In-App Update Notification
// ============================================================
// Self-managing modal that appears when a new version is detected.
// Handles the full lifecycle: notification → download → install.
// Mounted at app root level (outside auth) so it works pre-login.

import { useState, useEffect, useCallback, useRef } from 'react'
import type { UpdateInfo, UpdateDownloadProgress } from '@shared/types'
import type { IpcResponse } from '@shared/types'

type ModalView = 'notify' | 'downloading' | 'installing' | 'error'

export default function UpdateModal(): JSX.Element | null {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [progress, setProgress] = useState<UpdateDownloadProgress | null>(null)
  const [view, setView] = useState<ModalView>('notify')
  const [visible, setVisible] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const hasShownRef = useRef(false)

  // ── Subscribe to push events from main process ─────────────
  useEffect(() => {
    const unsubStatus = window.electronAPI.onUpdateStatusChanged((data) => {
      const info = data as UpdateInfo
      setUpdateInfo(info)

      switch (info.status) {
        case 'available':
          // Show modal only if not dismissed and not already shown this session
          if (!info.isDismissed && !hasShownRef.current) {
            setView('notify')
            setVisible(true)
            hasShownRef.current = true
          }
          break
        case 'downloading':
          setView('downloading')
          break
        case 'downloaded':
          setView('installing')
          // Auto-install after a brief moment so user sees "Installing..."
          setTimeout(() => {
            window.electronAPI.installUpdate()
          }, 1500)
          break
        case 'error':
          setErrorMsg(info.error ?? 'An unknown error occurred')
          setView('error')
          break
        case 'up-to-date':
        case 'checking':
          // Don't show modal for these
          break
      }
    })

    const unsubProgress = window.electronAPI.onUpdateDownloadProgress((data) => {
      setProgress(data as UpdateDownloadProgress)
    })

    // Fetch initial status (in case update was detected before modal mounted)
    window.electronAPI.getUpdateStatus().then((result) => {
      const res = result as IpcResponse<UpdateInfo>
      if (res.data) {
        setUpdateInfo(res.data)
        if (res.data.status === 'available' && !res.data.isDismissed && !hasShownRef.current) {
          setView('notify')
          setVisible(true)
          hasShownRef.current = true
        }
      }
    })

    return () => {
      unsubStatus()
      unsubProgress()
    }
  }, [])

  // ── Actions ────────────────────────────────────────────────

  const handleUpdateNow = useCallback(async () => {
    setView('downloading')
    setProgress(null)
    await window.electronAPI.downloadUpdate()
  }, [])

  const handleRemindLater = useCallback(async () => {
    await window.electronAPI.dismissUpdate()
    setVisible(false)
  }, [])

  const handleRetry = useCallback(async () => {
    setErrorMsg(null)
    setView('downloading')
    setProgress(null)
    await window.electronAPI.downloadUpdate()
  }, [])

  // ── Render ─────────────────────────────────────────────────

  if (!visible) return null

  const percent = progress?.percent ?? 0
  const currentVersion = updateInfo?.currentVersion ?? '—'
  const newVersion = updateInfo?.availableVersion ?? '—'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-[modal-overlay-in_0.2s_ease-out]">
      <div
        className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-[26rem] animate-[modal-dialog-in_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              {view === 'error' ? (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">
                {view === 'error' ? 'Update Failed' : view === 'installing' ? 'Installing Update' : 'Update Available'}
              </h2>
              <p className="text-xs text-surface-500">
                {view === 'error'
                  ? 'Something went wrong'
                  : view === 'installing'
                    ? 'The app will restart shortly'
                    : `v${currentVersion} → v${newVersion}`}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Notify view */}
          {view === 'notify' && (
            <>
              <p className="text-sm text-surface-600">
                A new version of Schedule Manager is available. Update now to get the latest features and improvements.
              </p>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={handleRemindLater}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors"
                >
                  Remind Me Tomorrow
                </button>
                <button
                  type="button"
                  onClick={handleUpdateNow}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
                >
                  Update Now
                </button>
              </div>
            </>
          )}

          {/* Downloading view */}
          {view === 'downloading' && (
            <div className="space-y-3">
              <p className="text-sm text-surface-600">Downloading update…</p>
              <div className="space-y-1.5">
                <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-surface-400 text-right">
                  {percent > 0 ? `${Math.round(percent)}%` : 'Starting…'}
                </p>
              </div>
            </div>
          )}

          {/* Installing view */}
          {view === 'installing' && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-surface-600">Installing update and restarting…</p>
            </div>
          )}

          {/* Error view */}
          {view === 'error' && (
            <>
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {errorMsg}
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-surface-100">
                <button
                  type="button"
                  onClick={() => setVisible(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 bg-white border border-surface-300 hover:bg-surface-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
