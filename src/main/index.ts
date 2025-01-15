import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { download } from 'electron-dl'
import { getArduinoUrl } from './getArduinoUrl'
import path from 'node:path'
import { isNativeError } from 'node:util/types'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 550,
    height: 370,
    title: 'AirQua Terminal Flasher',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('uk.airqua.terminal.flasher')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('download-arduino', async (event) => {
    console.log('download-arduino: started')
    try {
      const url = await getArduinoUrl()
      const file = await download(BrowserWindow.getFocusedWindow()!, url, {
        directory: path.join(app.getAppPath(), 'arduino-cli/')
      })
      event.sender.send('download-arduino-reply-ok', file.getSavePath())
      console.log('download-arduino: complete with ', file.getSavePath())
    } catch (e) {
      console.error('download-arduino: error with ', e)
      event.sender.send('download-arduino-reply-error', isNativeError(e) ? e.message : undefined)
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
