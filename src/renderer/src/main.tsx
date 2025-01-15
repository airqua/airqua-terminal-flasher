import React from 'react'
import ReactDOM from 'react-dom/client'
import { App, ConfigProvider } from 'antd'
import { MainView } from './views/MainView'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider>
      <App>
        <MainView />
      </App>
    </ConfigProvider>
  </React.StrictMode>
)
