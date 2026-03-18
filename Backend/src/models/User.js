import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
	name: { type: String },
	email: { type: String, required: true, unique: true },
	password: { type: String },
	emailVerified: { type: Date },
	emailVerificationCode: { type: String },
	emailVerificationCodeExpires: { type: Date },
	image: { type: String },
	role: { type: String, default: 'CUSTOMER', enum: ['CUSTOMER', 'WORKSHOP', 'ADMIN'] },
	phone: { type: String },
	address: { type: String },
	city: { type: String },
	postalCode: { type: String },
	country: { type: String, default: 'SE' },
	latitude: { type: Number },
	longitude: { type: Number },
	isActive: { type: Boolean, default: true },
	twoFactorEnabled: { type: Boolean, default: false },
	twoFactorSecret: { type: String },
	resetPasswordCode: { type: String },
	resetPasswordExpires: { type: Date },
}, {
	timestamps: true,
})

userSchema.pre('save', async function(next) {
	if (!this.isModified('password')) return next()
	this.password = await bcrypt.hash(this.password, 12)
	next()
})

export default mongoose.model('User', userSchema)
