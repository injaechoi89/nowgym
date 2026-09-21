import { doc, getDoc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging'
import { app, db } from './firebase.js'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// identity별 알림 수신 기기 토큰 모음. 문서 하나 = 트레이너(또는 원장님) 한 명.
const COLLECTION = 'push_tokens'
// 이 기기에서 마지막으로 저장한 토큰을 기억해뒀다가, 다음에 발급받은 토큰이 다르면
// (같은 기기인데 값만 바뀐 것) 옛날 값은 지우고 새 값으로 교체합니다.
// 이게 없으면 알림 켤 때마다 토큰이 계속 쌓여서 한 기기에 알림이 여러 번 오게 됩니다.
const LAST_TOKEN_KEY = 'nowgym-push-last-token'

async function saveTokenIfNew(identity, token) {
  let prevToken = null
  try { prevToken = localStorage.getItem(LAST_TOKEN_KEY) } catch { /* noop */ }

  const ref = doc(db, COLLECTION, identity)
  const snap = await getDoc(ref)
  const tokens = snap.exists() ? (snap.data().tokens || []) : []

  if (prevToken && prevToken !== token && tokens.includes(prevToken)) {
    await setDoc(ref, { tokens: arrayRemove(prevToken), updatedAt: Date.now() }, { merge: true })
  }
  if (!tokens.includes(token)) {
    await setDoc(ref, { tokens: arrayUnion(token), updatedAt: Date.now() }, { merge: true })
  }
  try { localStorage.setItem(LAST_TOKEN_KEY, token) } catch { /* noop */ }
}

// 브라우저 권한이 granted든 아니든, 실제로 FCM 토큰 발급 + Firestore 저장까지 확실히 성공시킵니다.
// (브라우저 권한만 granted고 토큰 저장은 실패한 애매한 상태를 없애기 위한 함수)
async function issueAndSaveToken(identity) {
  if (!(await isSupported())) throw new Error('이 브라우저(또는 이 화면)는 푸시 알림을 지원하지 않아요. 아이폰이라면 홈 화면에 추가한 앱으로 열어서 시도해주세요.')
  if (!VAPID_KEY) throw new Error('VAPID 키가 설정되지 않았어요.')

  const registration = await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready
  const messaging = getMessaging(app)
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
  if (!token) throw new Error('알림 토큰을 발급받지 못했어요.')

  await saveTokenIfNew(identity, token)
  return token
}

// 버튼을 눌렀을 때: 권한 요청부터 시작.
export async function enablePush(identity) {
  if (!('Notification' in window)) throw new Error('이 브라우저는 알림을 지원하지 않아요.')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('알림 권한이 거부됐어요.')
  await issueAndSaveToken(identity)
}

// 앱이 화면에 열려 있는 상태(포그라운드)에서는 브라우저가 알림을 자동으로 띄워주지 않아서,
// 직접 받아서 알림창을 띄워줘야 합니다. (백그라운드일 때는 sw.js가 처리)
export async function listenForegroundPush() {
  if (!(await isSupported())) return
  const messaging = getMessaging(app)
  onMessage(messaging, async (payload) => {
    if (Notification.permission !== 'granted') return
    const d = payload.data || {}
    // iOS Safari는 페이지에서 바로 new Notification()을 지원하지 않아서,
    // 항상 서비스 워커의 showNotification을 통해서만 띄웁니다 (아이폰/안드로이드 공통으로 동작).
    const registration = await navigator.serviceWorker.ready
    registration.showNotification(d.title || '나우짐', { body: d.body || '', icon: '/icon.png', data: { url: d.url || '/' } })
  })
}

// 화면 진입 시: 이미 권한은 허용됐는데 토큰 저장이 안 된 애매한 상태라면 조용히 복구를 시도합니다.
export async function checkAndHealPush(identity) {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission !== 'granted') return Notification.permission // 'default' | 'denied'
  try {
    await issueAndSaveToken(identity)
    return 'granted'
  } catch {
    return 'error'
  }
}
