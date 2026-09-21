import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Firestore 보안 규칙이 "로그인된 사용자만 허용"이라, 우리 앱의 PIN 로그인과는 별개로
// 기기가 Firestore에 접근하려면 최소한 Firebase 익명 로그인이 돼 있어야 합니다.
// (앱 설정값만 알면 누구나 Firestore에 직접 접근하던 문제를 막기 위함)
export function ensureAnonAuth() {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { unsub(); resolve(user); return }
      signInAnonymously(auth).catch(() => { unsub(); resolve(null) })
    })
  })
}
