import { adb } from './_lib/firebaseAdmin.js'

export default async function handler(req, res) {
  try {
    const identity = req.query.identity
    if (!identity) return res.status(400).json({ error: 'identity required' })
    await adb.collection('push_tokens').doc(identity).delete()
    res.status(200).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
