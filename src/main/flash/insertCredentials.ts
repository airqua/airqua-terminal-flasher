import fs from 'node:fs/promises'

type Params = {
  log: (message: string) => void
  firmwareFilePath: string
  token: string
  id: string
}

export const insertCredentials = async ({
  log,
  firmwareFilePath,
  token,
  id
}: Params): Promise<void> => {
  log('flash: inserting credentials')
  const sketchFile = await fs.readFile(firmwareFilePath, 'utf-8')
  await fs.writeFile(
    firmwareFilePath,
    sketchFile.replace('INSERT_TOKEN_HERE', token).replace('INSERT_ID_HERE', id),
    'utf-8'
  )
  log('flash: success inserting credentials')
}
