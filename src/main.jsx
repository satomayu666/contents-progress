import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ここで App.jsx を呼び出しています
import './index.css'    // もし CSS ファイルがあれば

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)