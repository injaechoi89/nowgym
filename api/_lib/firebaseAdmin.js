import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

function init() {
  if (getApps().length) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 없어요.')
  const serviceAccount = JSON.parse(raw)
  return initializeApp({ credential: cert(serviceAccount) })
}

export const app = init()
export const adb = getFirestore(app)
export const messaging = getMessaging(app)
