import { adb } from '../_lib/firebaseAdmin.js'
import { sendPush, checkCronAuth } from '../_lib/notify.js'
import { TRAINER_NAMES, kstDateKey, kstDate } from '../_lib/kst.js'

const TYPE_LABEL = { clean: '청소', insta: '인스타', blog: '블로그', review: '리뷰' }

async function hasCert(name, dateKey, type) {
  const snap = await adb.collection('cert_photos').doc(`${name}_${dateKey}_${type}`).get()
  return snap.exists
}

async function countCerts(name, type, dateKeys) {
  let count = 0
  for (const k of dateKeys) {
    if (await hasCert(name, k, type)) count++
  }
  return count
}

// 매일 밤(KST) 과업 인증 체크. 항목마다 원래 목표 주기가 달라서 체크 시점도 다르게 둡니다.
// 청소: 매일(월 20회 목표라 거의 매일), 인스타/블로그: 주 1회(일요일 밤에 최근 7일 체크),
// 리뷰: 월 1회(월 마지막 날 밤에 이번 달 전체 체크)
export default async function handler(req, res) {
  if (!checkCronAuth(req)) return res.status(401).json({ error: 'unauthorized' })
  try {
    const today = kstDate(0)
    const todayKey = kstDateKey(0)
    const isSunday = today.dow === 0
    const isMonthEnd = kstDate(1).d === 1 // 내일이 1일이면 오늘이 말일

    const incompleteByTrainer = {}

    for (const name of TRAINER_NAMES) {
      const missing = []
      if (!(await hasCert(name, todayKey, 'clean'))) missing.push(TYPE_LABEL.clean)

      if (isSunday) {
        const last7 = Array.from({ length: 7 }, (_, i) => kstDateKey(-i))
        if ((await countCerts(name, 'insta', last7)) < 1) missing.push(TYPE_LABEL.insta)
        if ((await countCerts(name, 'blog', last7)) < 1) missing.push(TYPE_LABEL.blog)
      }

      if (isMonthEnd) {
        const [y, m] = todayKey.split('-')
        const monthKeys = Array.from({ length: today.d }, (_, i) => `${y}-${m}-${i + 1}`)
        if ((await countCerts(name, 'review', monthKeys)) < 2) missing.push(TYPE_LABEL.review)
      }

      if (missing.length) incompleteByTrainer[name] = missing
    }

    const names = Object.keys(incompleteByTrainer)
    for (const name of names) {
      await sendPush(name, {
        title: '과업 인증 확인 필요',
        body: `미완료 항목: ${incompleteByTrainer[name].join(', ')}`,
        page: 'task',
      })
    }

    if (names.length) {
      const summary = names.map(n => `${n}(${incompleteByTrainer[n].join(',')})`).join(' / ')
      await sendPush('원장님', {
        title: '과업 인증 미완료',
        body: summary,
        page: 'task',
      })
    }

    res.status(200).json({ ok: true, incomplete: incompleteByTrainer })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
