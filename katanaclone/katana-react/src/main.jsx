import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WalletProvider } from './context/WalletContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <WalletProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WalletProvider>
    </AuthProvider>
  </StrictMode>,
)
