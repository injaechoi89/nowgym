import { readStore } from '../_lib/store.js'
import { sendPush, checkCronAuth } from '../_lib/notify.js'
import { TRAINER_NAMES, kstDateKey } from '../_lib/kst.js'

// 매주 월요일 아침(KST): 이번 주(월~일) 선생님별 휴가 예정일을 원장님에게 요약
export default async function handler(req, res) {
  if (!checkCronAuth(req)) return res.status(401).json({ error: 'unauthorized' })
  try {
    const weekKeys = Array.from({ length: 7 }, (_, i) => kstDateKey(i))

    const vacData = await readStore('nowgym-vacations', {})
    const lines = []
    for (const name of TRAINER_NAMES) {
      const dates = (vacData[name] || []).filter(k => weekKeys.includes(k))
      if (!dates.length) continue
      const labels = dates.map(k => { const [, m, d] = k.split('-'); return `${m}/${d}` })
      lines.push(`${name}: ${labels.join(', ')}`)
    }

    if (lines.length) {
      await sendPush('원장님', {
        title: '이번 주 선생님 휴가 요약',
        body: lines.join(' / '),
        url: '/',
      })
    }

    res.status(200).json({ ok: true, lines })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
