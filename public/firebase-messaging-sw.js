// 앱이 꺼져있거나 백그라운드일 때도 푸시 알림을 받기 위한 서비스 워커입니다.
// Vite가 public/ 파일은 그대로 배포하고 환경변수 치환을 하지 않기 때문에,
// (비밀값이 아닌) Firebase 웹 설정값을 그대로 적어둡니다.
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAupGyfMpbxm9SiasO1DjJoaocFWAIYrBY',
  authDomain: 'nowgym-47bfb.firebaseapp.com',
  projectId: 'nowgym-47bfb',
  storageBucket: 'nowgym-47bfb.firebasestorage.app',
  messagingSenderId: '1015768072768',
  appId: '1:1015768072768:web:c24a85c53f2f2bddb995a5',
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {}
  const url = payload.data && payload.data.url ? payload.data.url : '/'
  self.registration.showNotification(title || '나우짐', {
    body: body || '',
    icon: '/icon.png',
    data: { url },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(self.clients.openWindow(url))
})
