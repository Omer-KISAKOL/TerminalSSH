import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { app, BrowserWindow, nativeImage } from 'electron'

import { registerAppHandlers } from './ipc/app.handlers'
import { registerDialogHandlers } from './ipc/dialog.handlers'
import { registerProfileHandlers } from './ipc/profile.handlers'
import { registerSshHandlers } from './ipc/ssh.handlers'
import { sshSessionManager } from './services/ssh-session-manager'

const distDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.join(distDir, '..')
const preloadPath = path.join(distDir, 'index.mjs')
const rendererPath = path.join(distDir, '../dist/index.html')
const iconPath = path.join(projectRoot, 'resources/icons/icon.png')

const isDev = !app.isPackaged

function resolveWindowIcon() {
  if (!app.isPackaged) {
    return nativeImage.createFromPath(iconPath)
  }

  const packagedIcon = path.join(process.resourcesPath, 'icons/icon.png')

  if (nativeImage.createFromPath(packagedIcon).isEmpty()) {
    return nativeImage.createFromPath(iconPath)
  }

  return nativeImage.createFromPath(packagedIcon)
}

function createMainWindow(): BrowserWindow {
  const windowIcon = resolveWindowIcon()

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    title: 'TerminalSSH',
    backgroundColor: '#0f1117',
    icon: windowIcon.isEmpty() ? undefined : windowIcon,
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

  const webContentsId = mainWindow.webContents.id

  mainWindow.webContents.on('did-start-loading', () => {
    sshSessionManager.disconnectAllForWebContents(webContentsId)
  })

  mainWindow.webContents.on('destroyed', () => {
    sshSessionManager.disconnectAllForWebContents(webContentsId)
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

app.on('before-quit', () => {
  sshSessionManager.disconnectAll()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
