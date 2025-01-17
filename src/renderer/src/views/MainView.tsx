import { FC, useEffect, useRef, useState } from 'react'
import { App, Button, Flex, Form, Input, Typography } from 'antd'
import { FormType } from '../types/FormType'
import { useHandleStartFlash } from '../hooks/useHandleStartFlash'
import { TextAreaRef } from 'antd/es/input/TextArea'

export const MainView: FC = () => {
  const { message } = App.useApp()
  console.log(message)
  const [form] = Form.useForm<FormType>()
  const [loading, setLoading] = useState(false)

  const [handleFlash] = useHandleStartFlash({ setLoading })

  const logsRef = useRef<TextAreaRef>(null)
  const [logs, setLogs] = useState('')
  useEffect(() => {
    const removeLog = window.electron.ipcRenderer.on('log', (_, log) => {
      setLogs((l) => l + `${log}\n`)
      if (logsRef.current?.resizableTextArea) {
        logsRef.current.resizableTextArea.textArea.scrollTop =
          logsRef.current.resizableTextArea.textArea.scrollHeight
      }
    })
    const removeFlashSuccess = window.electron.ipcRenderer.on('flash-success', () => {
      setLoading(false)
      void message.success('Flash completed!')
    })
    const removeFlashError = window.electron.ipcRenderer.on('flash-error', (_, msg) => {
      setLoading(false)
      void message.error(`Error encountered while flashing: ${msg}, please see logs`)
    })

    return (): void => {
      removeLog()
      removeFlashSuccess()
      removeFlashError()
    }
  }, [message])

  return (
    <Flex vertical>
      <Flex vertical>
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
      <Input.TextArea
        ref={logsRef}
        value={logs}
        disabled
        rows={5}
        autoSize={false}
        style={{ resize: 'none' }}
      />
    </Flex>
  )
}
