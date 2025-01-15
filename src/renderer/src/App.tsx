import { FC } from 'react'
import { Button, Flex, Form, Input, Typography } from 'antd'

const App: FC = () => {
  const [form] = Form.useForm()

  return (
    <Flex vertical justify="center">
      <Typography.Title>AirQua Terminal Flasher</Typography.Title>
      <Form form={form} layout="vertical">
        <Form.Item label="Sensor identificator">
          <Input />
        </Form.Item>
        <Form.Item label="Token">
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" block htmlType="submit">
            Flash!
          </Button>
        </Form.Item>
      </Form>
    </Flex>
  )
}

export default App
