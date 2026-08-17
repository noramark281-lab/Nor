import React, { StrictMode } from 'react'
import * as ReactDOMClient from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

if (typeof window !== 'undefined') {
  (window as any).React = React;
  (window as any).ReactDOM = ReactDOMClient;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

