import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { app, db } from './firebase.js'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// identity별 알림 수신 기기 토큰 모음. 문서 하나 = 트레이너(또는 원장님) 한 명.
const COLLECTION = 'push_tokens'

async function saveTokenIfNew(identity, token) {
  const ref = doc(db, COLLECTION, identity)
  const snap = await getDoc(ref)
  const already = snap.exists() && (snap.data().tokens || []).includes(token)
  if (already) return
  if (snap.exists()) {
    await setDoc(ref, { tokens: arrayUnion(token), updatedAt: Date.now() }, { merge: true })
  } else {
    await setDoc(ref, { tokens: [token], updatedAt: Date.now() })
  }
}

// 브라우저 권한이 granted든 아니든, 실제로 FCM 토큰 발급 + Firestore 저장까지 확실히 성공시킵니다.
// (브라우저 권한만 granted고 토큰 저장은 실패한 애매한 상태를 없애기 위한 함수)
async function issueAndSaveToken(identity) {
  if (!(await isSupported())) throw new Error('이 브라우저(또는 이 화면)는 푸시 알림을 지원하지 않아요. 아이폰이라면 홈 화면에 추가한 앱으로 열어서 시도해주세요.')
  if (!VAPID_KEY) throw new Error('VAPID 키가 설정되지 않았어요.')

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
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
