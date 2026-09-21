import { adb } from './_lib/firebaseAdmin.js'
import { sendPush } from './_lib/notify.js'
import { TRAINER_NAMES, kstDateKey } from './_lib/kst.js'

const TYPES = ['clean', 'insta', 'blog', 'review']
const TYPE_LABEL = { clean: '청소', insta: '인스타', blog: '블로그', review: '리뷰' }

// 임시 디버그용: 밤 9시 크론이 왜 안 왔는지 지금 바로 같은 로직을 돌려보기 위한 엔드포인트.
// CRON_SECRET과 무관한, 이 파일에만 있는 별도 토큰으로만 열립니다. 확인 후 바로 삭제 예정.
export default async function handler(req, res) {
  if (req.query.k !== 'nowgym-debug-2026') return res.status(401).json({ error: 'unauthorized' })
  try {
    const todayKey = kstDateKey(0)
    const incompleteByTrainer = {}
    for (const name of TRAINER_NAMES) {
      const missing = []
      for (const type of TYPES) {
        const docId = `${name}_${todayKey}_${type}`
        const snap = await adb.collection('cert_photos').doc(docId).get()
        if (!snap.exists) missing.push(TYPE_LABEL[type])
      }
      if (missing.length) incompleteByTrainer[name] = missing
    }
    const names = Object.keys(incompleteByTrainer)
    for (const name of names) {
      await sendPush(name, { title: '오늘 과업 인증 마감 임박', body: `아직 인증 안 한 항목: ${incompleteByTrainer[name].join(', ')}`, page: 'task' })
    }
    if (names.length) {
      const summary = names.map(n => `${n}(${incompleteByTrainer[n].join(',')})`).join(' / ')
      await sendPush('원장님', { title: '오늘 과업 인증 미완료', body: summary, page: 'task' })
    }
    res.status(200).json({ ok: true, incomplete: incompleteByTrainer, todayKey })
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack })
  }
}
