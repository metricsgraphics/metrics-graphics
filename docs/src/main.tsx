import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import 'metrics-graphics/dist/mg.css'
import { HashRouter } from 'react-router-dom'
import App from './App'

ReactDOM.render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
  document.getElementById('root')
)
