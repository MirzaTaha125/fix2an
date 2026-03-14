import mongoose from 'mongoose'

const pendingSchema = new mongoose.Schema({
	email: { type: String, required: true },
	password: { type: String, required: true }, // plain - hashed only when User is created
	name: { type: String },
	phone: { type: String },
	address: { type: String },
	city: { type: String },
	postalCode: { type: String },
	code: { type: String, required: true },
	codeExpires: { type: Date, required: true },
}, {
	timestamps: true,
})

export default mongoose.model('PendingRegistration', pendingSchema)
