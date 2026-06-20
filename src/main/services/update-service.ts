// ============================================================
// Update Service — In-App Auto-Update via electron-updater
// ============================================================
// Manages update lifecycle: check → download → install.
// Pushes real-time status/progress events to the renderer via
// webContents.send (push-based IPC).

import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'

// ── Types ────────────────────────────────────────────────────

export type UpdateStatus =
  | 'checking'
  | 'up-to-date'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateInfo {
  status: UpdateStatus
  currentVersion: string
  availableVersion?: string
  error?: string
}

export interface UpdateDownloadProgress {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

// ── Push event channel names ─────────────────────────────────
// These are used with webContents.send / ipcRenderer.on (not invoke/handle).
const PUSH_CHANNELS = {
  STATUS_CHANGED: 'updater:status-changed',
  DOWNLOAD_PROGRESS: 'updater:download-progress'
} as const

// ── Module state ─────────────────────────────────────────────

let currentStatus: UpdateStatus = 'up-to-date'
let availableVersion: string | undefined
let lastError: string | undefined
let dismissedUntil: number | null = null // epoch ms — suppress modal until this time
let mainWindowRef: BrowserWindow | null = null

// ── Helpers ──────────────────────────────────────────────────

function sendToRenderer(channel: string, data: unknown): void {
  try {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send(channel, data)
    }
  } catch (err) {
    console.error('[UPDATER] Failed to send to renderer:', err)
  }
}

function setStatus(status: UpdateStatus, version?: string, error?: string): void {
  currentStatus = status
  if (version !== undefined) availableVersion = version
  if (error !== undefined) lastError = error

  const info = getUpdateStatus()
  sendToRenderer(PUSH_CHANNELS.STATUS_CHANGED, info)
}

// ── Public API ───────────────────────────────────────────────

/**
 * Initialize the auto-updater. Call once after the main window is created.
 * In dev mode (app.isPackaged === false), the updater is not activated —
 * the service still works but reports 'up-to-date' without hitting GitHub.
 */
export function initAutoUpdater(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow

  if (!app.isPackaged) {
    console.log('[UPDATER] Dev mode — updater disabled. Status will be simulated.')
    return
  }

  // Disable auto-download — user must explicitly click "Update Now"
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  // ── Event listeners ──────────────────────────────────────

  autoUpdater.on('checking-for-update', () => {
    setStatus('checking')
  })

  autoUpdater.on('update-available', (info) => {
    setStatus('available', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    setStatus('up-to-date')
  })

  autoUpdater.on('download-progress', (progress) => {
    currentStatus = 'downloading'
    const progressData: UpdateDownloadProgress = {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    }
    sendToRenderer(PUSH_CHANNELS.DOWNLOAD_PROGRESS, progressData)
  })

  autoUpdater.on('update-downloaded', () => {
    setStatus('downloaded')
  })

  autoUpdater.on('error', (err) => {
    setStatus('error', undefined, err?.message ?? 'Unknown update error')
  })

  // ── Initial check on startup ─────────────────────────────
  // Small delay to let the window fully render before checking
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('[UPDATER] Startup check failed:', err)
    })
  }, 3000)
}

/**
 * Manually check for updates. Called from renderer via IPC.
 */
export function checkForUpdates(): UpdateInfo {
  if (!app.isPackaged) {
    setStatus('up-to-date')
    return getUpdateStatus()
  }

  autoUpdater.checkForUpdates().catch((err) => {
    console.error('[UPDATER] Manual check failed:', err)
    setStatus('error', undefined, err?.message ?? 'Failed to check for updates')
  })

  // Return immediately — real status comes via push events
  return getUpdateStatus()
}

/**
 * Start downloading the available update.
 */
export function downloadUpdate(): UpdateInfo {
  if (!app.isPackaged) {
    return getUpdateStatus()
  }

  if (currentStatus !== 'available') {
    return getUpdateStatus()
  }

  setStatus('downloading')
  autoUpdater.downloadUpdate().catch((err) => {
    console.error('[UPDATER] Download failed:', err)
    setStatus('error', undefined, err?.message ?? 'Download failed')
  })

  return getUpdateStatus()
}

/**
 * Install a downloaded update and restart the app.
 */
export function installUpdate(): void {
  if (currentStatus === 'downloaded') {
    autoUpdater.quitAndInstall()
  }
}

/**
 * Get current update status (synchronous snapshot).
 */
export function getUpdateStatus(): UpdateInfo {
  return {
    status: currentStatus,
    currentVersion: app.getVersion(),
    ...(availableVersion ? { availableVersion } : {}),
    ...(lastError ? { error: lastError } : {})
  }
}

/**
 * Dismiss the update modal for 24 hours.
 */
export function dismissUpdate(): void {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000
  dismissedUntil = Date.now() + TWENTY_FOUR_HOURS
}

/**
 * Check whether the update modal should be suppressed.
 * Returns true if the user clicked "Remind Me Tomorrow" within the last 24h.
 */
export function isDismissed(): boolean {
  if (dismissedUntil === null) return false
  if (Date.now() >= dismissedUntil) {
    dismissedUntil = null // Expired — clear it
    return false
  }
  return true
}
