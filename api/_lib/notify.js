import { adb, messaging } from './firebaseAdmin.js'

// identities: identity 문자열 하나 또는 배열('원장님' | '정우' | '준혁' | '건호' | '인재')
// page: 앱 내부 메뉴 id(App.jsx의 MENU id) - 알림 눌렀을 때 그 화면으로 이동시키기 위함. 없으면 홈으로.
export async function sendPush(identities, { title, body, url = '/', page = null }) {
  const list = Array.isArray(identities) ? identities : [identities]

  // 알림함(인앱 히스토리)에는 기기에 푸시 토큰이 등록돼 있는지와 상관없이 항상 남깁니다.
  const batch = adb.batch()
  const createdAt = Date.now()
  for (const id of list) {
    const ref = adb.collection('notifications').doc()
    batch.set(ref, { identity: id, title, body, page, createdAt, read: false })
  }
  await batch.commit()

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

  // notification 필드를 같이 보내면 브라우저가 자동으로 한 번 띄우고, 우리 서비스워커가 또 한 번 띄워서
  // 알림이 중복으로 뜨는 문제가 있었습니다. data만 보내고 서비스워커에서 직접 한 번만 띄우도록 합니다.
  const res = await messaging.sendEachForMulticast({
    tokens,
    data: { title, body, url, page: page || '' },
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
