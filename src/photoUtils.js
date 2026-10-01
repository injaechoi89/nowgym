export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 이미지를 축소·압축하고, timestamp가 true면 청소 인증 사진처럼 우측하단에 촬영 시각을 찍어줍니다.
export function processImage(dataUrl, { maxWidth = 700, quality = 0.6, timestamp = false } = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.max(1, Math.round(img.width * scale))
      const h = Math.max(1, Math.round(img.height * scale))
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, w, h)
      if (timestamp) {
        const now = new Date()
        const wd = ['일','월','화','수','목','금','토'][now.getDay()]
        const h24 = now.getHours()
        const ampm = h24 < 12 ? '오전' : '오후'
        const h12 = h24 % 12 === 0 ? 12 : h24 % 12
        const mm = String(now.getMinutes()).padStart(2, '0')
        const dateLine = `${now.getFullYear()}년 ${now.getMonth()+1}월 ${now.getDate()}일 (${wd})`
        const timeLine = `${ampm} ${h12}:${mm}`
        const fontSize = Math.max(13, Math.round(w * 0.045))
        const boxH = Math.round(fontSize * 2.8)
        const pad = Math.round(fontSize * 0.6)
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, h - boxH, w, boxH)
        ctx.fillStyle = '#fff'
        ctx.textBaseline = 'middle'
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.fillText(dateLine, pad, h - boxH + fontSize * 1.05)
        ctx.fillText(timeLine, pad, h - boxH + fontSize * 2.15)
      }
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

import { collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'
import { db } from './firebase.js'

// 사진 한 장 = Firestore 문서 한 개 (컬렉션 cert_photos). 문서당 1MB 제한을 사진 개수와
// 무관하게 지키기 위해, 예전처럼 전체 사진을 문서 하나에 몰아넣지 않습니다.
// 청소(clean)는 slot 0/1 두 장까지 허용합니다. slot 0은 기존 문서 ID를 그대로 써서
// 예전에 저장된 청소 인증 사진과 호환되도록 하고, slot 1만 접미사를 붙입니다.
const COLLECTION = 'cert_photos'
const LOCAL_KEY = 'nowgym-cert-photos'
const docId = (trainer, dateKey, type, slot = 0) => slot ? `${trainer}_${dateKey}_${type}_${slot+1}` : `${trainer}_${dateKey}_${type}`

let cache = {}
try {
  const raw = localStorage.getItem(LOCAL_KEY)
  cache = raw ? JSON.parse(raw) : {}
} catch {
  cache = {}
}

const listeners = new Set()
function notify() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(cache)) } catch {
    // 저장 공간 초과 등은 조용히 무시 (Firestore가 원본이라 앱 동작엔 영향 없음)
  }
  listeners.forEach(fn => fn(cache))
}

function setInCache(trainer, dateKey, type, dataUrl, slot = 0) {
  const trData = { ...(cache[trainer] || {}) }
  const dayData = { ...(trData[dateKey] || {}) }
  if (type === 'clean') {
    const arr = [...(dayData.clean || [])]
    arr[slot] = dataUrl
    dayData.clean = arr
  } else {
    dayData[type] = dataUrl
  }
  trData[dateKey] = dayData
  cache = { ...cache, [trainer]: trData }
}

function removeFromCache(trainer, dateKey, type, slot = 0) {
  if (!cache[trainer]?.[dateKey]) return
  const dayData = { ...cache[trainer][dateKey] }
  if (type === 'clean') {
    const arr = [...(dayData.clean || [])]
    arr[slot] = undefined
    while (arr.length && arr[arr.length - 1] == null) arr.pop()
    if (arr.length) dayData.clean = arr
    else delete dayData.clean
  } else {
    delete dayData[type]
  }
  cache = { ...cache, [trainer]: { ...cache[trainer], [dateKey]: dayData } }
}

let started = false
function ensureStarted() {
  if (started) return
  started = true
  onSnapshot(collection(db, COLLECTION), snap => {
    snap.docChanges().forEach(change => {
      const d = change.doc.data()
      const slot = d.slot || 0
      if (change.type === 'removed') removeFromCache(d.trainer, d.dateKey, d.type, slot)
      else setInCache(d.trainer, d.dateKey, d.type, d.dataUrl, slot)
    })
    notify()
  }, () => {})
}

export function getCertPhotos() {
  ensureStarted()
  return cache
}

export function subscribeCertPhotos(fn) {
  ensureStarted()
  listeners.add(fn)
  return () => listeners.delete(fn)
}

// 성공하면 true, 로컬 저장 공간 초과 등으로 실패하면 false를 반환합니다.
// slot은 청소(clean) 사진을 2장까지 올릴 때 0 또는 1을 쓰고, 다른 항목은 항상 0(기본값)입니다.
export function saveCertPhoto(trainer, dateKey, type, dataUrl, slot = 0) {
  ensureStarted()
  setInCache(trainer, dateKey, type, dataUrl, slot)
  notify()
  setDoc(doc(db, COLLECTION, docId(trainer, dateKey, type, slot)), { trainer, dateKey, type, dataUrl, slot, updatedAt: Date.now() }).catch(() => {})
  return true
}

export function deleteCertPhoto(trainer, dateKey, type, slot = 0) {
  ensureStarted()
  removeFromCache(trainer, dateKey, type, slot)
  notify()
  deleteDoc(doc(db, COLLECTION, docId(trainer, dateKey, type, slot))).catch(() => {})
}
