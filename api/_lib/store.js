import { adb } from './firebaseAdmin.js'

// src/docStore.js와 동일한 저장 방식(app_state 컬렉션, 문서당 json 문자열 한 필드)을 서버에서 읽습니다.
function deserialize(text) {
  return JSON.parse(text, (_key, v) => (v && typeof v === 'object' && v.__isDate ? new Date(v.iso) : v))
}

export async function readStore(key, fallback) {
  const snap = await adb.collection('app_state').doc(key).get()
  if (!snap.exists) return fallback
  const json = snap.data().json
  if (typeof json !== 'string') return fallback
  try {
    return deserialize(json)
  } catch {
    return fallback
  }
}
