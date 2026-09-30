import { sendPush } from './_lib/notify.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  try {
    const { trainer, monthLabel } = req.body || {}
    if (!trainer || !monthLabel) return res.status(400).json({ error: 'trainer, monthLabel required' })
    await sendPush('원장님', {
      title: '월급 확인 완료',
      body: `${trainer} 선생님이 ${monthLabel} 급여 내역을 확인했어요.`,
      page: 'salary',
    })
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
