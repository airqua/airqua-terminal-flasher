import path from 'node:path'
import fs from 'node:fs/promises'
import { isNativeError } from 'node:util/types'
import { BrowserWindow } from 'electron'
import { flashAmdb } from './flashAmdb'
import { makeShell } from './makeShell'
import { downloadArduino } from './arduino/downloadArduino'
import { downloadFirmware } from './firmware/downloadFirmware'
import { insertCredentials } from './flash/insertCredentials'

const ARDUINO_CLI_BOARD_URL =
  'https://files.seeedstudio.com/arduino/package_seeeduino_boards_index.json'

export const performFlash = async (
  event: Electron.IpcMainEvent,
  app: Electron.App,
  id: string,
  token: string,
  freshInstall: boolean
): Promise<void> => {
  const log = (m: string): void => event.sender.send('log', m)
  log('starting')
  try {
    const w = BrowserWindow.getFocusedWindow()!

    if (freshInstall) {
      await flashAmdb({
        log,
        app,
        w
      })
    }

    await downloadArduino({ log, app, w })
    await downloadFirmware({ log, app, w })

    log('flash: reading dir for executable and libraries')
    const dir = await fs.readdir(path.join(app.getAppPath(), 'arduino-cli/'))
    const exec = dir.find((s) => s.includes('arduino-cli'))
    if (!exec) throw new Error('exec not found')
    const firmware = dir.find((s) => s.includes('airqua-terminal'))
    if (!firmware) throw new Error('firmware not found')

    const execPath = path.join(app.getAppPath(), 'arduino-cli', exec)
    const librariesPath = path.join(app.getAppPath(), 'arduino-cli', firmware, 'libraries/')
    const firmwareFilePath = path.join(
      app.getAppPath(),
      'arduino-cli',
      firmware,
      'AirQuaTerminal',
      'AirQuaTerminal.ino'
    )

    const { shellWrite, shellEnd } = makeShell({
      log,
      onStdout: (data) => {
        if (data.includes('>')) return
        log(`stdout: ${data}`)
        if (data.includes('Port')) {
          log('shell: includes port')
          // FIXME that's not good
          let found = false
          data.split('\n').forEach((st) => {
            if (st.includes('seeed_wio_terminal')) {
              log(`shell: port ${st.split(' ')[0]}`)
              log('flash: writing core update-index + compile')
              shellWrite(
                `${execPath} compile -b Seeeduino:samd:seeed_wio_terminal ` +
                  `--additional-urls ${ARDUINO_CLI_BOARD_URL} -u -t -p ${st.split(' ')[0]} --libraries ${librariesPath} ` +
                  firmwareFilePath
              )
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
      },
      onStderr: (data) => {
        log(`stderr: ${data}`)
        shellEnd('flash: got error output, killing shell')
        event.sender.send('flash-error')
      }
    })

    await insertCredentials({
      log,
      firmwareFilePath,
      token,
      id
    })

    log('flash: updating index')
    shellWrite(`${execPath} core update-index --additional-urls ${ARDUINO_CLI_BOARD_URL}`)
    log('flash: downloading Seeeduino:samd')
    shellWrite(
      `${execPath} core download Seeeduino:samd --additional-urls ${ARDUINO_CLI_BOARD_URL}`
    )
    log('flash: installing Seeeduino:samd')
    shellWrite(`${execPath} core install Seeeduino:samd --additional-urls ${ARDUINO_CLI_BOARD_URL}`)
    log('flash: searching for board')
    shellWrite(`${execPath} board list --additional-urls ${ARDUINO_CLI_BOARD_URL}`) // getting wio port
  } catch (e) {
    log(`error with ${isNativeError(e) ? e.message : ''}`)
    event.sender.send('flash-error')
  }
}
