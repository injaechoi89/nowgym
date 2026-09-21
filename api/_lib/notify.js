import { adb, messaging } from './firebaseAdmin.js'

// identities: identity 문자열 하나 또는 배열('원장님' | '정우' | '준혁' | '건호' | '인재')
export async function sendPush(identities, { title, body, url = '/' }) {
  const list = Array.isArray(identities) ? identities : [identities]
  const tokenSet = new Set()
  const invalidByIdentity = {}

  for (const id of list) {
    const snap = await adb.collection('push_tokens').doc(id).get()
    const tokens = snap.exists ? (snap.data().tokens || []) : []
    invalidByIdentity[id] = tokens
    tokens.forEach(t => tokenSet.add(t))
  }

  const tokens = [...tokenSet]
  if (!tokens.length) return { sent: 0 }

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: { url },
    webpush: { fcmOptions: { link: url } },
  })

  // 만료/무효 토큰은 Firestore에서 정리합니다.
  const badTokens = new Set()
  res.responses.forEach((r, i) => {
    if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
      badTokens.add(tokens[i])
    }
  })
  if (badTokens.size) {
    for (const id of list) {
      const kept = (invalidByIdentity[id] || []).filter(t => !badTokens.has(t))
      if (kept.length !== (invalidByIdentity[id] || []).length) {
        await adb.collection('push_tokens').doc(id).set({ tokens: kept, updatedAt: Date.now() }, { merge: true })
      }
    }
  }

  return { sent: res.successCount }
}

export function checkCronAuth(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true // 시크릿을 아직 설정 안 했으면 통과 (초기 설정 단계 배려)
  return req.headers['authorization'] === `Bearer ${secret}`
}
