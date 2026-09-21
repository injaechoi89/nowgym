// 최소한의 서비스 워커. 브라우저가 "설치 가능한 PWA"로 인식해서
// 홈 화면 추가 시 manifest.json의 아이콘을 제대로 쓰도록 하기 위한 용도이며,
// 별도의 오프라인 캐싱은 하지 않습니다.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
