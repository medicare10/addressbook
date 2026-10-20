import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app.js'

const PORT = process.env.PORT || 3001

async function start() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI in environment')
    process.exit(1)
  }

  const dbName = process.env.MONGODB_DB || 'addressbook'

  try {
    await mongoose.connect(uri, { dbName })
    console.log(`MongoDB connected (db: ${dbName})`)
  } catch (err) {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`API server listening on http://localhost:${PORT}`)
  })
}

start()
