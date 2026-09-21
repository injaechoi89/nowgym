import { getAuth } from 'firebase-admin/auth'
import { app } from './_lib/firebaseAdmin.js'

export default async function handler(req, res) {
  if (req.query.k !== 'nowgym-debug-2026') return res.status(401).json({ error: 'unauthorized' })
  try {
    const auth = getAuth(app)
    const list = await auth.listUsers(50)
    res.status(200).json({ count: list.users.length, anonymous: list.users.filter(u => u.providerData.length === 0).length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
