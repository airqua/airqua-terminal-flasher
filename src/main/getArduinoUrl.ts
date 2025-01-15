type ReleaseInfoType = {
  tag_name: string
  assets: {
    name: string
    browser_download_url: string
  }[]
}

const PLATFORM_MAP: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'macOS',
  linux: 'Linux',
  win32: 'Windows'
}

const ARCH_MAP: Partial<Record<NodeJS.Architecture, string>> = {
  arm64: 'ARM64',
  ia32: '32bit',
  x64: '64bit'
}

const EXTENSION_MAP: Partial<Record<NodeJS.Platform, string>> = {
  darwin: 'tar.gz',
  linux: 'tar.gz',
  win32: 'zip'
}

export const getArduinoUrl = async (): Promise<string> => {
  const releaseInfo: ReleaseInfoType = await fetch(
    'https://api.github.com/repos/arduino/arduino-cli/releases/latest'
  ).then((r) => r.json())

  const platform = PLATFORM_MAP[process.platform]
  const arch = ARCH_MAP[process.arch]
  const fileExt = EXTENSION_MAP[process.platform]

  const version = releaseInfo.tag_name.substring(1)
  const asset = releaseInfo.assets.find(
    ({ name }) => name === `arduino-cli_${version}_${platform}_${arch}.${fileExt}`
  )

  if (!asset) throw new Error('arduino_cli release not found')

  return asset.browser_download_url
}
