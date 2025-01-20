import { download } from 'electron-dl'
import path from 'node:path'
import { decompressFile } from './utils/decompressFile'
import fs from 'node:fs/promises'
import { makeShell } from './makeShell'

const AMDB_FLASH_TOOL_URL =
  'https://github.com/Seeed-Studio/ambd_flash_tool/archive/refs/heads/master.zip'

type Params = {
  log: (message: string) => void
  app: Electron.App
  w: Electron.BrowserWindow
}

export const flashAmdb = ({ log, app, w }: Params): Promise<void> =>
  new Promise((resolve, reject) => {
    log('amdb: download started')
    download(w, AMDB_FLASH_TOOL_URL, {
      directory: path.join(app.getAppPath(), 'arduino-cli/')
    })
      .then((amdbFile) => {
        log(`amdb: download complete with ${amdbFile.getSavePath()}`)
        log('amdb: decomp started')
        return decompressFile(amdbFile.getSavePath(), app.getAppPath()).then((amdbFiles) => {
          void fs.rm(amdbFile.getSavePath())
          log(`amdb: decomp complete with ${amdbFiles.map((f) => f.path).join(',')}`)
        })
      })
      .then(() => {
        const executable =
          process.platform === 'win32'
            ? path.join(
                app.getAppPath(),
                'arduino-cli',
                'ambd_flash_tool-master',
                'ambd_flash_tool.exe'
              )
            : `python3 ${path.join(app.getAppPath(), 'arduino-cli', 'ambd_flash_tool-master', 'ambd_flash_tool.py')}`
        let flashInited = false
        const { shellWrite, shellEnd } = makeShell({
          log,
          onStdout: (data) => {
            if (data.includes('>')) return
            log(`stdout: ${data}`)
            if (!flashInited) {
              shellWrite(`${executable} flash`)
              flashInited = true
              return
            }
            shellEnd('amdb: complete')
            resolve()
          },
          onStderr: (err) => {
            log(`stderr: ${err}`)
            shellEnd('amdb: error')
            reject()
          }
        })
        shellWrite(`${executable} erase`)
      })
      .catch(reject)
  })
