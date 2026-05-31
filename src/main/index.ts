import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initDatabase, closeDatabase } from './database/connection'
import { runMigrations } from './database/migrator'
import { registerAllHandlers } from './ipc/registry'
import { hasAdminPassword, setSettings } from './services/settings-service'
import { SETTINGS_KEYS, DEFAULTS } from '../shared/constants'
import bcrypt from 'bcryptjs'

/**
 * Seed default admin account and settings if first run.
 * Default password: admin
 */
function seedDefaults(): void {
  if (hasAdminPassword()) return

  const hash = bcrypt.hashSync('admin', DEFAULTS.BCRYPT_COST)
  setSettings({
    [SETTINGS_KEYS.ADMIN_PASSWORD_HASH]: hash,
    [SETTINGS_KEYS.SHS_PERIOD_LENGTH]: String(DEFAULTS.SHS_PERIOD_LENGTH),
    [SETTINGS_KEYS.COLLEGE_PERIOD_LENGTH]: String(DEFAULTS.COLLEGE_PERIOD_LENGTH),
    [SETTINGS_KEYS.SHS_TIME_SLOT_START]: DEFAULTS.TIME_SLOT_START,
    [SETTINGS_KEYS.SHS_TIME_SLOT_END]: DEFAULTS.TIME_SLOT_END,
    [SETTINGS_KEYS.COLLEGE_TIME_SLOT_START]: DEFAULTS.TIME_SLOT_START,
    [SETTINGS_KEYS.COLLEGE_TIME_SLOT_END]: DEFAULTS.TIME_SLOT_END,
    [SETTINGS_KEYS.INSTITUTION_LOGO]: '',
    [SETTINGS_KEYS.FOOTER_CREDIT]: ''
  })
  console.log('Default admin account seeded (password: admin)')
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

  // Load the renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.schedule-manager')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database connection with PRAGMAs
  initDatabase()

  // Run pending migrations
  runMigrations()

  // Seed default admin account if first run
  seedDefaults()

  // Register all IPC handlers
  registerAllHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Focus existing window if second instance attempted
app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

app.on('window-all-closed', () => {
  closeDatabase()
  app.quit()
})
