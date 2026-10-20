import mongoose from 'mongoose'
import app from '../server/app.js'

const uri = process.env.MONGODB_URI
if (!uri) throw new Error('Missing MONGODB_URI environment variable')

const dbName = process.env.MONGODB_DB || 'addressbook'

// Cache the connection promise on globalThis so warm invocations reuse it
// instead of opening a new pool on every request.
const conn = globalThis._mongoConn ??= mongoose
  .connect(uri, { dbName })
  .then(() => mongoose.connection)

await conn

export default app
