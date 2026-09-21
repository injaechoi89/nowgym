import { adb } from '../_lib/firebaseAdmin.js'
import { sendPush, checkCronAuth } from '../_lib/notify.js'
import { TRAINER_NAMES, kstDateKey } from '../_lib/kst.js'

const TYPES = ['clean', 'insta', 'blog', 'review']
const TYPE_LABEL = { clean: '청소', insta: '인스타', blog: '블로그', review: '리뷰' }

// 매일 밤(KST): 오늘 과업 인증 미완료 항목을 본인 + 원장님에게 알림
export default async function handler(req, res) {
  if (!checkCronAuth(req)) return res.status(401).json({ error: 'unauthorized' })
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
      await sendPush(name, {
        title: '오늘 과업 인증 마감 임박',
        body: `아직 인증 안 한 항목: ${incompleteByTrainer[name].join(', ')}`,
        url: '/',
      })
    }

    if (names.length) {
      const summary = names.map(n => `${n}(${incompleteByTrainer[n].join(',')})`).join(' / ')
      await sendPush('원장님', {
        title: '오늘 과업 인증 미완료',
        body: summary,
        url: '/',
      })
    }

    res.status(200).json({ ok: true, incomplete: incompleteByTrainer })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
