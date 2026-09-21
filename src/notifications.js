import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebase.js'

const COLLECTION = 'notifications'

// where 하나만 쓰고(복합 인덱스 불필요), 정렬은 받아온 뒤 클라이언트에서 처리합니다.
export function subscribeNotifications(identity, fn) {
  const q = query(collection(db, COLLECTION), where('identity', '==', identity))
  return onSnapshot(q, snap => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.createdAt - a.createdAt)
    fn(list)
  }, () => {})
}

export function markRead(id) {
  updateDoc(doc(db, COLLECTION, id), { read: true }).catch(() => {})
}

export async function markAllRead(ids) {
  if (!ids.length) return
  const batch = writeBatch(db)
  ids.forEach(id => batch.update(doc(db, COLLECTION, id), { read: true }))
  await batch.commit().catch(() => {})
}
