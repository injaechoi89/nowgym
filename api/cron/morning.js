import { readStore } from '../_lib/store.js'
import { sendPush, checkCronAuth } from '../_lib/notify.js'
import { TRAINER_NAMES, kstDateKey } from '../_lib/kst.js'

// 매일 아침(KST): (1) 오늘 내 PT 예약 알림, (2) 3일 후 휴일근무 등록 알림
export default async function handler(req, res) {
  if (!checkCronAuth(req)) return res.status(401).json({ error: 'unauthorized' })
  try {
    const todayKey = kstDateKey(0)
    const in3Key = kstDateKey(3)

    const ptData = await readStore('nowgym-pt-schedule', {})
    let ptSent = 0
    for (const name of TRAINER_NAMES) {
      const pts = (ptData[name] || []).filter(p => p.dateKey === todayKey).sort((a, b) => (a.hour < b.hour ? -1 : 1))
      if (!pts.length) continue
      const lines = pts.map(p => `${p.hour} ${p.m}`).join(', ')
      await sendPush(name, { title: `오늘 PT ${pts.length}건`, body: lines, url: '/' })
      ptSent++
    }

    const holRecs = await readStore('nowgym-holiday-work', [])
    let holSent = 0
    for (const rec of holRecs) {
      if (rec.date !== in3Key) continue
      const [, m, d] = in3Key.split('-')
      await sendPush(rec.trainerName, { title: '휴일근무 안내', body: `3일 후 ${m}월 ${d}일에 휴일근무가 등록되어 있어요.`, url: '/' })
      holSent++
    }

    res.status(200).json({ ok: true, ptSent, holSent })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
