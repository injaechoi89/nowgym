import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { listenForegroundPush } from './push.js'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)

// 홈 화면에 추가할 때 브라우저가 manifest 아이콘을 제대로 쓰도록, 최소한의 서비스 워커를 등록합니다.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// 앱이 켜져 있는 동안(포그라운드) 받은 푸시 알림도 화면에 띄워줍니다.
listenForegroundPush().catch(() => {})
