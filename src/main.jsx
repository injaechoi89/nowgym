import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { listenForegroundPush } from './push.js'
import { ensureAnonAuth } from './firebase.js'

// Firestore 규칙이 로그인된 사용자만 허용하도록 바뀌어서, 화면을 그리기 전에
// 먼저 익명 로그인이 끝나길 기다립니다 (보통 1초 이내).
ensureAnonAuth().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
})

// 홈 화면에 추가할 때 브라우저가 manifest 아이콘을 제대로 쓰도록, 서비스 워커를 등록합니다.
// (예전에 sw.js와 firebase-messaging-sw.js를 따로 등록했던 기기에 낡은 등록이 남아있으면
// 같은 범위(scope)끼리 충돌해서 푸시가 씹힐 수 있어서, 다른 스크립트로 등록된 건 먼저 정리합니다.)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations()
      for (const r of regs) {
        if (!r.active || !r.active.scriptURL.endsWith('/sw.js')) await r.unregister()
      }
    } catch {
      // 정리 실패해도 등록은 계속 진행
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

// 앱이 켜져 있는 동안(포그라운드) 받은 푸시 알림도 화면에 띄워줍니다.
listenForegroundPush().catch(() => {})
