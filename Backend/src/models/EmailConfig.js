import mongoose from 'mongoose'

const emailConfigSchema = new mongoose.Schema({
	host: { type: String, default: '' },
	port: { type: Number, default: 587 },
	user: { type: String, default: '' },
	password: { type: String, default: '' },
	from: { type: String, default: '' },
	secure: { type: Boolean, default: false },
}, {
	timestamps: true,
})

// Single document - use a fixed ID or findOne
export default mongoose.model('EmailConfig', emailConfigSchema)
