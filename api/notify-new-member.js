import { sendPush } from './_lib/notify.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' })
  try {
    const { name, trainer, regType } = req.body || {}
    if (!name || !trainer) return res.status(400).json({ error: 'name, trainer required' })
    const label = regType === '재등록' ? '재등록' : '신규 등록'
    const result = await sendPush('원장님', {
      title: `🏋️ ${label} 회원 등록`,
      body: `${trainer} 트레이너 · ${name}님이 ${label}됐어요.`,
      url: '/',
    })
    res.status(200).json({ ok: true, result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
