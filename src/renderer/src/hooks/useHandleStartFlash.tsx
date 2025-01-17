import { App } from 'antd'
import { FormType } from '../types/FormType'

type Params = {
  setLoading: (v: boolean) => void
}

export const useHandleStartFlash = ({
  setLoading
}: Params): [(values: FormType) => Promise<void>] => {
  const { modal } = App.useApp()

  return [
    async (values: FormType): Promise<void> => {
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
        window.electron.ipcRenderer.send('flash', values.id, values.token)
      }
    }
  ]
}
