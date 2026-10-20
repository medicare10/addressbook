import 'dotenv/config'
import mongoose from 'mongoose'
import Contact from './models/Contact.js'
import User from './models/User.js'

const SEED = [
  { name: 'Rosa Adler', phone: '(415) 555-0132', email: 'rosa@adler.co', address: '14 Cider Lane, Sausalito' },
  { name: 'Marcus Bell', phone: '(212) 555-0177', email: 'm.bell@bellworks.com', address: '88 Greene St, New York' },
  { name: 'Priya Chandra', phone: '(650) 555-0119', email: 'priya.chandra@gmail.com', address: '9 Sequoia Ave, Menlo Park' },
  { name: 'David Okafor', phone: '(312) 555-0143', email: 'dokafor@northside.org', address: '2200 W Belden, Chicago' },
  { name: 'Elena Vasquez', phone: '(512) 555-0188', email: 'elena@vasquez.studio', address: '701 E 6th St, Austin' },
  { name: 'Tomas Fischer', phone: '(206) 555-0164', email: 'tomas@fischer.dev', address: '1110 N Ballard Rd, Seattle' },
  { name: 'Amara Nwosu', phone: '(404) 555-0155', email: 'amara.nwosu@outlook.com', address: '330 Peachtree St NE, Atlanta' },
  { name: 'Hiroshi Tanaka', phone: '(415) 555-0198', email: 'h.tanaka@meridian.jp', address: '1 Ferry Building, San Francisco' },
  { name: 'Sofia Rossi', phone: '(617) 555-0126', email: 'sofia@rossi.design', address: '42 Newbury St, Boston' },
  { name: 'Liam Byrne', phone: '(702) 555-0111', email: 'liam.byrne@hey.com', address: '1100 Sahara Ave, Las Vegas' },
  { name: 'Nadia Haddad', phone: '(646) 555-0173', email: 'nadia@haddadlaw.com', address: '275 Park Ave, New York' },
  { name: 'Owen Kowalski', phone: '(720) 555-0139', email: 'owen.k@peakclimb.net', address: '1600 Blake St, Denver' },
]

async function run() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('Missing MONGODB_URI in environment')
    process.exit(1)
  }

  const dbName = process.env.MONGODB_DB || 'addressbook'
  await mongoose.connect(uri, { dbName })

  const email = (process.env.SEED_OWNER_EMAIL || 'medicaremedi10@gmail.com').toLowerCase()
  const owner = await User.findOne({ email })

  if (!owner) {
    console.error(`No user found for ${email}. Sign up first, then re-run the seed.`)
    process.exit(1)
  }

  await Contact.deleteMany({ owner: owner._id })
  await Contact.insertMany(SEED.map((c) => ({ ...c, owner: owner._id })))

  console.log(`Seeded ${SEED.length} contacts for ${email}`)
  await mongoose.disconnect()
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
