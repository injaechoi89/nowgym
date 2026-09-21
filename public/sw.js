// 앱 전체에서 쓰는 서비스 워커 하나입니다. (PWA 설치 인식용 + 푸시 알림 처리용을
// 파일 두 개로 따로 등록하면 같은 범위(scope)에 등록된 것끼리 서로 덮어써서
// 푸시가 조용히 무시되는 문제가 있어서 하나로 합쳤습니다.)
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

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
  // notification 필드가 아니라 data 필드로만 보내야, FCM이 자동으로 한 번 띄우고
  // 여기서 또 한 번 띄우는 중복 알림이 안 생깁니다.
  const d = payload.data || {}
  self.registration.showNotification(d.title || '나우짐', {
    body: d.body || '',
    icon: '/icon.png',
    data: { url: d.url || '/' },
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(self.clients.openWindow(url))
})
