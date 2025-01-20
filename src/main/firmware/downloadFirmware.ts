import { download } from 'electron-dl'
import path from 'node:path'
import { decompressFile } from '../utils/decompressFile'
import fs from 'node:fs/promises'
import { getFirmwareUrl } from './getFirmwareUrl'

type Params = {
  log: (message: string) => void
  app: Electron.App
  w: Electron.BrowserWindow
}

export const downloadFirmware = async ({ log, app, w }: Params): Promise<void> => {
  log('firmware: download started')
  const firmwareFile = await download(w, await getFirmwareUrl(), {
    directory: path.join(app.getAppPath(), 'arduino-cli/')
  })
  log(`firmware: download complete with ${firmwareFile.getSavePath()}`)

  log('firmware: decomp started')
  const firmwareFiles = await decompressFile(firmwareFile.getSavePath(), app.getAppPath())
  await fs.rm(firmwareFile.getSavePath())
  log(`firmware: decomp complete with ${firmwareFiles.map((f) => f.path).join(',')}`)
}
