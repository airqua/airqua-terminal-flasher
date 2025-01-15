import { FC, useState } from 'react'
import { Button, Flex, Form, Input, Typography } from 'antd'
import { FormType } from '../types/FormType'
import { useHandleStartFlash } from '../hooks/useHandleStartFlash'

export const MainView: FC = () => {
  const [form] = Form.useForm<FormType>()
  const [loading, setLoading] = useState(false)

  const [handleFlash] = useHandleStartFlash({ setLoading })

  // useEffect(() => {
  //   window.electron.ipcRenderer.on('download-arduino-reply-ok', (event, args) => {})
  //
  //   return (): void => window.electron.ipcRenderer.removeAllListeners('download-arduino-reply-ok')
  // }, [])

  return (
    <Flex vertical justify="center">
      <Typography.Title>AirQua Terminal Flasher</Typography.Title>
      <Form<FormType> form={form} layout="vertical" onFinish={handleFlash}>
        <Form.Item<FormType> name="id" label="Sensor identificator">
          <Input />
        </Form.Item>
        <Form.Item<FormType> name="token" label="Token">
          <Input.Password />
        </Form.Item>
        <Form.Item<FormType>>
          <Button type="primary" block htmlType="submit" loading={loading}>
            Flash!
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  )
}
