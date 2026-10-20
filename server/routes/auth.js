import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  console.error(
    'Missing JWT_SECRET in environment — refusing to start with an insecure default.',
  )
  process.exit(1)
}
const JWT_EXPIRES = '7d'

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES,
  })
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email }
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body || {}

    if (!name?.trim() || !email?.trim() || !password) {
      return res
        .status(400)
        .json({ error: 'Name, email and password are required' })
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() })
    if (existing) {
      return res.status(409).json({ error: 'An account with that email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({
      name: name.trim(),
      email: email.trim(),
      passwordHash,
    })

    const token = signToken(user)
    return res.status(201).json({ user: publicUser(user), token })
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: 'An account with that email already exists' })
    }
    console.error('signup error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
      '+passwordHash',
    )
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken(user)
    return res.json({ user: publicUser(user), token })
  } catch (err) {
    console.error('login error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
