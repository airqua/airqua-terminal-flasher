type ReleaseInfoType = {
  zipball_url: string
}

export const getFirmwareUrl = async (): Promise<string> => {
  const { zipball_url }: ReleaseInfoType = await fetch(
    'https://api.github.com/repos/airqua/airqua-terminal/releases/latest'
  ).then((r) => r.json())
  return zipball_url
}
