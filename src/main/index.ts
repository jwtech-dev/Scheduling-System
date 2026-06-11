import { app, BrowserWindow, shell, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database/connection'
import { runMigrations } from './database/migrator'
import { registerAllHandlers } from './ipc/registry'
import { clearSession } from './ipc/auth-middleware'
import { hasAdminPassword, setSettings } from './services/settings-service'
import { SETTINGS_KEYS, DEFAULTS } from '../shared/constants'
import bcrypt from 'bcryptjs'

// ── Global Error Handlers ────────────────────────────────────
// Catch unhandled errors to prevent silent crashes.

process.on('uncaughtException', (error) => {
  console.error('[FATAL] Uncaught exception:', error)
  dialog.showErrorBox(
    'Unexpected Error',
    `The application encountered an unexpected error and needs to close.\n\n${error.message}`
  )
  app.quit()
})

process.on('unhandledRejection', (reason) => {
  console.error('[ERROR] Unhandled promise rejection:', reason)
  const message = reason instanceof Error ? reason.message : String(reason)
  dialog.showErrorBox(
    'Unexpected Error',
    `An unhandled error occurred.\n\n${message}`
  )
})

// ── Seed Defaults ────────────────────────────────────────────

/**
 * Seed default admin account and settings if first run.
 */
function seedDefaults(): void {
  if (hasAdminPassword()) return

  setSettings({
    [SETTINGS_KEYS.SHS_PERIOD_LENGTH]: String(DEFAULTS.SHS_PERIOD_LENGTH),
    [SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH]: String(DEFAULTS.COLLEGE_PERIOD_LENGTH),
    [SETTINGS_KEYS.SHS_TIME_SLOT_START]: DEFAULTS.TIME_SLOT_START,
    [SETTINGS_KEYS.SHS_TIME_SLOT_END]: DEFAULTS.TIME_SLOT_END,
    [SETTINGS_KEYS.COLLEGE_TIME_SLOT_START]: DEFAULTS.TIME_SLOT_START,
    [SETTINGS_KEYS.COLLEGE_TIME_SLOT_END]: DEFAULTS.TIME_SLOT_END,
    [SETTINGS_KEYS.INSTITUTION_LOGO]: '',
    [SETTINGS_KEYS.INSTITUTION_NAME]: 'INTEGRATED INNOVATION AND HOSPITALITY COLLEGES, INC.',
    [SETTINGS_KEYS.INSTITUTION_ADDRESS]: 'Buenamar St. Brgy. Novaliches Proper, Novaliches, Quezon City',
    [SETTINGS_KEYS.INSTITUTION_CONTACT]: 'Tel. No. 7754-9645 Mobile No. 0919-893-4789 0917-125-4442',
    [SETTINGS_KEYS.INSTITUTION_EMAIL]: 'iihcolleges@gmail.com',
    [SETTINGS_KEYS.FOOTER_CREDIT]: ''
  })
}

// Single instance lock — only one window at a time
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Open external links in default browser, not in Electron
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Handle renderer process crashes
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[FATAL] Renderer process gone:', details.reason)
    if (details.reason !== 'clean-exit') {
      dialog.showErrorBox(
        'Application Error',
        'The application window crashed unexpectedly. The app will restart.'
      )
      mainWindow?.destroy()
      createWindow()
    }
  })

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app
  .whenReady()
  .then(() => {
    electronApp.setAppUserModelId('com.schedule-manager')

    app.on('browser-window-created', (_, window) => {
      optimizer.watchWindowShortcuts(window)
    })

    // Initialize database connection with PRAGMAs
    try {
      initDatabase()
    } catch (err) {
      console.error('[FATAL] Database initialization failed:', err)
      dialog.showErrorBox(
        'Database Error',
        `Failed to open the database. It may be corrupted or locked.\n\n${err instanceof Error ? err.message : String(err)}`
      )
      app.quit()
      return
    }

    // Run pending migrations
    try {
      runMigrations()
    } catch (err) {
      console.error('[FATAL] Migration failed:', err)
      dialog.showErrorBox(
        'Database Migration Error',
        `A database migration failed. The application cannot start.\n\n${err instanceof Error ? err.message : String(err)}`
      )
      app.quit()
      return
    }

    // Seed default admin account if first run
    seedDefaults()

    // Register all IPC handlers
    registerAllHandlers()

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
  .catch((err) => {
    console.error('[FATAL] App startup failed:', err)
    dialog.showErrorBox(
      'Startup Error',
      `The application failed to start.\n\n${err instanceof Error ? err.message : String(err)}`
    )
    app.quit()
  })

// Focus existing window if second instance attempted
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  try {
    clearSession()
    closeDatabase()
  } catch (err) {
    console.error('[WARN] Error during shutdown:', err)
  }
  app.quit()
})
