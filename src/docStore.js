import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// 모든 기기가 같은 Firestore 문서를 구독해서 실시간으로 값을 공유합니다.
// localStorage는 Firestore 응답이 오기 전 즉시 렌더링용 캐시로만 씁니다.
function serialize(value) {
  return JSON.stringify(value, (_key, v) => (v instanceof Date ? { __isDate: true, iso: v.toISOString() } : v))
}
function deserialize(text) {
  return JSON.parse(text, (_key, v) => (v && typeof v === 'object' && v.__isDate ? new Date(v.iso) : v))
}

const stores = new Map()

function getStore(key, initialValue) {
  if (stores.has(key)) return stores.get(key)

  let value
  try {
    const cached = localStorage.getItem(key)
    value = cached !== null ? deserialize(cached) : (typeof initialValue === 'function' ? initialValue() : initialValue)
  } catch {
    value = typeof initialValue === 'function' ? initialValue() : initialValue
  }

  const listeners = new Set()
  let ready = false
  let skipNextRemoteEcho = false

  const store = {
    get: () => value,
    isReady: () => ready,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
    set(next) {
      value = typeof next === 'function' ? next(value) : next
      const json = serialize(value)
      try { localStorage.setItem(key, json) } catch {
        // 저장 공간 초과 등은 조용히 무시
      }
      listeners.forEach(fn => fn(value))
      if (ready) {
        skipNextRemoteEcho = true
        setDoc(doc(db, 'app_state', key), { json, updatedAt: Date.now() }).catch(() => {})
      }
    },
  }

  onSnapshot(doc(db, 'app_state', key), snap => {
    const wasReady = ready
    ready = true
    if (snap.exists()) {
      const json = snap.data().json
      if (typeof json === 'string') {
        if (skipNextRemoteEcho) {
          skipNextRemoteEcho = false
        } else {
          try {
            value = deserialize(json)
            localStorage.setItem(key, json)
          } catch {
            // 손상된 원격 값은 무시하고 기존 값 유지
          }
        }
      }
    } else if (!wasReady) {
      // Firestore에 아직 문서가 없는 최초 실행 상태 -> 현재(초기) 값으로 시드
      setDoc(doc(db, 'app_state', key), { json: serialize(value), updatedAt: Date.now() }).catch(() => {})
    }
    listeners.forEach(fn => fn(value))
  }, () => {
    ready = true
    listeners.forEach(fn => fn(value))
  })

  stores.set(key, store)
  return store
}

export function getSyncedValue(key, initialValue) {
  return getStore(key, initialValue).get()
}

export function setSyncedValue(key, initialValue, next) {
  getStore(key, initialValue).set(next)
}

export function subscribeSynced(key, initialValue, fn) {
  return getStore(key, initialValue).subscribe(fn)
}

// 최초 동기화(Firestore 응답)가 끝날 때까지 기다렸다가 그 시점의 값을 반환합니다.
// (기본값 시딩 여부를 결정하기 전에, 다른 기기가 이미 저장해둔 값이 있는지 확인하기 위함)
// 네트워크가 느리거나 끊긴 경우 화면이 무한 로딩되지 않도록 타임아웃을 둡니다.
export function waitForSynced(key, initialValue, timeoutMs = 8000) {
  const store = getStore(key, initialValue)
  if (store.isReady()) return Promise.resolve(store.get())
  return new Promise(resolve => {
    let done = false
    const finish = () => { if (done) return; done = true; resolve(store.get()) }
    const unsub = store.subscribe(() => { if (store.isReady()) { unsub(); finish() } })
    setTimeout(() => { unsub(); finish() }, timeoutMs)
  })
}
