import mongoose from 'mongoose'

const contactSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    mapLink: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true },
)

contactSchema.path('mapLink').validate((value) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}, 'Map link must be a valid http(s) URL')

contactSchema.index({ owner: 1, name: 1 })

const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema)

export default Contact
