import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow } from 'electron'

import { registerAppHandlers } from './ipc/app.handlers'
import { registerDialogHandlers } from './ipc/dialog.handlers'
import { registerProfileHandlers } from './ipc/profile.handlers'
import { registerSshHandlers } from './ipc/ssh.handlers'
import { sshSessionManager } from './services/ssh-session-manager'

const distDir = path.dirname(fileURLToPath(import.meta.url))
const preloadPath = path.join(distDir, 'index.mjs')
const rendererPath = path.join(distDir, '../dist/index.html')

const isDev = !app.isPackaged

function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'TerminalSSH',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void mainWindow.loadFile(rendererPath)
  }

  mainWindow.webContents.on('destroyed', () => {
    sshSessionManager.disconnectAllForWebContents(mainWindow.webContents.id)
  })

  return mainWindow
}

registerAppHandlers()
registerProfileHandlers()
registerDialogHandlers()
registerSshHandlers()

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
