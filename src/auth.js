import { waitForSynced, setSyncedValue } from './docStore.js'

export const IDENTITIES = ['원장님', '정우', '준혁', '건호', '인재']

// 최초 임시 PIN. 로그인 후 '설정' 메뉴(원장님 전용)에서 바꿀 수 있습니다.
export const DEFAULT_PINS = {
  원장님: '1234',
  정우: '0001',
  준혁: '0002',
  건호: '0003',
  인재: '0004',
}

const PIN_STORE_KEY = 'nowgym-pins'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function getPinHashes() {
  // Firestore의 최초 응답을 기다려서, 다른 기기가 이미 저장해둔 PIN이 있는지 먼저 확인합니다.
  const existing = await waitForSynced(PIN_STORE_KEY, null)
  if (existing) return existing
  const hashes = {}
  for (const id of IDENTITIES) hashes[id] = await sha256(DEFAULT_PINS[id])
  setSyncedValue(PIN_STORE_KEY, null, hashes)
  return hashes
}

export async function verifyPin(identity, pin) {
  const hashes = await getPinHashes()
  const h = await sha256(pin)
  return hashes[identity] === h
}

export async function setPin(identity, newPin) {
  const hashes = await getPinHashes()
  const next = { ...hashes, [identity]: await sha256(newPin) }
  setSyncedValue(PIN_STORE_KEY, null, next)
}
