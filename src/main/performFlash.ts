import { download } from 'electron-dl'
import path from 'node:path'
import fs from 'node:fs/promises'
import child_process from 'node:child_process'
import { isNativeError } from 'node:util/types'
import { getArduinoUrl } from './utils/getArduinoUrl'
import { BrowserWindow } from 'electron'
import { getFirmwareUrl } from './utils/getFirmwareUrl'
import { decompressFile } from './utils/decompressFile'

const ARDUINO_CLI_BOARD_URL =
  'https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json'

export const performFlash = async (
  event: Electron.IpcMainEvent,
  app: Electron.App,
  id: string,
  token: string
): Promise<void> => {
  const log = (m: string): void => event.sender.send('log', m)
  log('starting')
  try {
    const w = BrowserWindow.getFocusedWindow()!

    log('dl: started arduino')
    const arduinoFile = await download(w, await getArduinoUrl(), {
      directory: path.join(app.getAppPath(), 'arduino-cli/')
    })
    log(`dl: arduino complete with ${arduinoFile.getSavePath()}`)

    log('decomp: started arduino')
    const arduinoFiles = await decompressFile(arduinoFile.getSavePath(), app.getAppPath())
    await fs.rm(arduinoFile.getSavePath())
    log(`decomp: arduino complete with ${arduinoFiles.map((f) => f.path).join(',')}`)

    log('dl: started firmware')
    const firmwareFile = await download(w, await getFirmwareUrl(), {
      directory: path.join(app.getAppPath(), 'arduino-cli/')
    })
    log(`dl: firmware complete with ${firmwareFile.getSavePath()}`)

    log('decomp: started firmware')
    const firmwareFiles = await decompressFile(firmwareFile.getSavePath(), app.getAppPath())
    await fs.rm(firmwareFile.getSavePath())
    log(`decomp: firmware complete with ${firmwareFiles.map((f) => f.path).join(',')}`)

    log('flash: reading dir for executable and libraries')
    const dir = await fs.readdir(path.join(app.getAppPath(), 'arduino-cli/'))
    const exec = dir.find((s) => s.includes('arduino-cli'))
    if (!exec) throw new Error('exec not found')
    const firmware = dir.find((s) => s.includes('airqua-terminal'))
    if (!firmware) throw new Error('firmware not found')

    const shell =
      process.platform === 'win32'
        ? child_process.spawn('cmd.exe', ['/K'], {
            shell: true
          })
        : child_process.spawn('sh', { shell: true })
    let ended = false
    shell.stdout.setEncoding('utf-8')
    shell.stdin.setDefaultEncoding('utf-8')
    const shellWrite = (data: string): unknown => !ended && shell.stdin.write(data + '\r\n')
    const shellEnd = (m: string): void => {
      log(m)
      ended = true
      shell.kill()
    }

    const handlePortReceived = (port: string): void => {
      log('flash: writing core update-index + compile')
      shellWrite(
        `${path.join(app.getAppPath(), 'arduino-cli', exec)} core update-index --additional-urls ${ARDUINO_CLI_BOARD_URL}`
      )
      shellWrite(
        `${path.join(app.getAppPath(), 'arduino-cli', exec)} compile -b Seeeduino:samd:seeed_wio_terminal ` +
          `--additional-urls ${ARDUINO_CLI_BOARD_URL} -u -t -p ${port} --libraries ${path.join(app.getAppPath(), 'arduino-cli', firmware, 'libraries/')} ` +
          path.join(app.getAppPath(), 'arduino-cli', firmware)
      )
    }

    shell.stdout.on('data', (data) => {
      if (data.includes('>')) return
      log(`stdout: ${data}`)
      if (data.includes('Port')) {
        log('shell: includes port')
        // FIXME that's not good
        let found = false
        data.split('\n').forEach((st) => {
          if (st.includes('seeed_wio_terminal')) {
            log(`shell: port${st.split(' ')[0]}`)
            handlePortReceived(st.split(' ')[0])
            found = true
          }
        })
        if (!found) {
          shellEnd('Wio Terminal is not connected')
          event.sender.send('flash-error')
        }
      } else if (data.includes('Verify successful')) {
        shellEnd('Flash complete')
        event.sender.send('flash-success')
      }
    })

    shell.stderr.on('data', (data) => {
      log(`stderr: ${data}`)
      shellEnd('flash: got error output, killing shell')
      event.sender.send('flash-error')
    })

    log('flash: inserting credentials')
    const sketchFilePath = path.join(
      path.join(app.getAppPath(), 'arduino-cli', firmware, 'AirQuaTerminal.ino')
    )
    const sketchFile = await fs.readFile(sketchFilePath, 'utf-8')
    await fs.writeFile(
      sketchFilePath,
      sketchFile.replace('INSERT_TOKEN_HERE', token).replace('INSERT_ID_HERE', id),
      'utf-8'
    )
    log('flash: success inserting credentials')

    log('flash: searching for board')
    shellWrite(
      `${path.join(app.getAppPath(), 'arduino-cli', exec)} board list --additional-urls ${ARDUINO_CLI_BOARD_URL}`
    ) // getting wio port
  } catch (e) {
    log(`error with ${isNativeError(e) ? e.message : ''}`)
    event.sender.send('flash-error')
  }
}
