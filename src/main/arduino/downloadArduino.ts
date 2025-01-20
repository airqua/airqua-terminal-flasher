import { download } from 'electron-dl'
import { getArduinoUrl } from './getArduinoUrl'
import path from 'node:path'
import { decompressFile } from '../utils/decompressFile'
import fs from 'node:fs/promises'

type Params = {
  log: (message: string) => void
  app: Electron.App
  w: Electron.BrowserWindow
}

export const downloadArduino = async ({ log, app, w }: Params): Promise<void> => {
  log('arduino: download started')
  const arduinoFile = await download(w, await getArduinoUrl(), {
    directory: path.join(app.getAppPath(), 'arduino-cli/')
  })
  log(`arduino: download complete with ${arduinoFile.getSavePath()}`)

  log('arduino: decomp started')
  const arduinoFiles = await decompressFile(arduinoFile.getSavePath(), app.getAppPath())
  await fs.rm(arduinoFile.getSavePath())
  log(`arduino: decomp complete with ${arduinoFiles.map((f) => f.path).join(',')}`)
}
