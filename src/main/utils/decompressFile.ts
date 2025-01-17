import decompress from 'decompress'
import p from 'node:path'

export const decompressFile = (path: string, appPath: string): Promise<decompress.File[]> =>
  decompress(path, p.join(appPath, 'arduino-cli/'))
