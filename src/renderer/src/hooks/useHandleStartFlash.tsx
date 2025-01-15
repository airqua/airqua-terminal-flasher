import { App } from 'antd'

type Params = {
  setLoading: (v: boolean) => void
}

export const useHandleStartFlash = ({ setLoading }: Params) => {
  const { modal } = App.useApp()

  return [
    async (): Promise<void> => {
      const confirm = await modal.confirm({
        title: 'The application will download several files',
        content: (
          <ul>
            <li>Arduino CLI</li>
            <li>Latest firmware version</li>
            <li>Libraries</li>
          </ul>
        )
      })
      if (confirm) {
        setLoading(true)
        window.electron.ipcRenderer.send('download-arduino')
      }
    }
  ]
}
