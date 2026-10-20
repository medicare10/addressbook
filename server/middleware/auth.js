import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET

export default async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' })
    }

    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }

    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' })
    }

    req.user = user
    return next()
  } catch (err) {
    console.error('auth middleware error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
}
