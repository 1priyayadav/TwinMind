import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AppStateProvider } from './context/AppStateContext'
import { SettingsProvider } from './hooks/useSettings'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SettingsProvider>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </SettingsProvider>
  </React.StrictMode>,
)
