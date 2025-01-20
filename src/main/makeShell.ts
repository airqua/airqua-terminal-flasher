import child_process from 'node:child_process'

type Params = {
  log: (message: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStdout: (data: any) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onStderr: (data: any) => void
}

type Return = {
  shellWrite: (data: string) => unknown
  shellEnd: (m: string) => void
}

export const makeShell = ({ log, onStdout, onStderr }: Params): Return => {
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

  shell.stdout.on('data', onStdout)
  shell.stderr.on('data', onStderr)

  return { shellWrite, shellEnd }
}
