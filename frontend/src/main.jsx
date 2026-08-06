import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CamsProvider } from './services/CamsContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CamsProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CamsProvider>
  </React.StrictMode>,
)