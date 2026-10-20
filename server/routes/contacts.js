import { Router } from 'express'
import Contact from '../models/Contact.js'
import requireAuth from '../middleware/auth.js'

const router = Router()

router.use(requireAuth)

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function serialize(contact) {
  return {
    id: contact._id,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    mapLink: contact.mapLink,
  }
}

function cleanMapLink(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  try {
    const url = new URL(trimmed)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

router.get('/', async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    const query = { owner: req.user._id }

    if (rawQuery) {
      const pattern = new RegExp(escapeRegex(rawQuery), 'i')
      query.$or = [
        { name: pattern },
        { email: pattern },
        { phone: pattern },
        { address: pattern },
      ]
    }

    const sort = rawQuery
      ? { name: 1 }
      : { name: 1, _id: 1 }

    const contacts = await Contact.find(query).sort(sort).limit(500)

    return res.json({
      contacts: contacts.map(serialize),
      total: contacts.length,
      query: rawQuery,
    })
  } catch (err) {
    console.error('list contacts error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, phone, email, address, mapLink } = req.body || {}

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const link = cleanMapLink(mapLink)
    if (link === null) {
      return res
        .status(400)
        .json({ error: 'Map link must be a valid http(s) URL' })
    }

    const contact = await Contact.create({
      owner: req.user._id,
      name: name.trim(),
      phone: phone?.trim() || '',
      email: email?.trim() || '',
      address: address?.trim() || '',
      mapLink: link,
    })

    return res.status(201).json({ contact: serialize(contact) })
  } catch (err) {
    if (err?.name === 'ValidationError') {
      const first = Object.values(err.errors)[0]
      return res.status(400).json({ error: first?.message || 'Invalid contact' })
    }
    console.error('create contact error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const { address, mapLink } = req.body || {}
    const updates = {}

    if (address !== undefined) updates.address = String(address).trim()

    if (mapLink !== undefined) {
      const link = cleanMapLink(mapLink)
      if (link === null) {
        return res
          .status(400)
          .json({ error: 'Map link must be a valid http(s) URL' })
      }
      updates.mapLink = link
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { $set: updates },
      { new: true, runValidators: true },
    )

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    return res.json({ contact: serialize(contact) })
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(404).json({ error: 'Contact not found' })
    }
    if (err?.name === 'ValidationError') {
      const first = Object.values(err.errors)[0]
      return res.status(400).json({ error: first?.message || 'Invalid contact' })
    }
    console.error('update contact error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Contact.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    })

    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found' })
    }

    return res.json({ ok: true })
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(404).json({ error: 'Contact not found' })
    }
    console.error('delete contact error', err)
    return res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router
