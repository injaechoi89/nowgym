import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'
import { app, db } from './firebase.js'

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

// identity별 알림 수신 기기 토큰 모음. 문서 하나 = 트레이너(또는 원장님) 한 명.
const COLLECTION = 'push_tokens'

export async function getPushStatus() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

// 사용자가 버튼을 눌렀을 때만 호출합니다. 권한 요청 + FCM 토큰 발급 + Firestore 저장까지 한번에 처리합니다.
export async function enablePush(identity) {
  if (!(await isSupported())) throw new Error('이 브라우저는 푸시 알림을 지원하지 않아요.')
  if (!VAPID_KEY) throw new Error('VAPID 키가 설정되지 않았어요.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('알림 권한이 거부됐어요.')

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const messaging = getMessaging(app)
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
  if (!token) throw new Error('알림 토큰을 발급받지 못했어요.')

  const ref = doc(db, COLLECTION, identity)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    await setDoc(ref, { tokens: arrayUnion(token), updatedAt: Date.now() }, { merge: true })
  } else {
    await setDoc(ref, { tokens: [token], updatedAt: Date.now() })
  }
  return token
}
