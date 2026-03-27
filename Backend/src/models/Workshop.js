import mongoose from 'mongoose'

const workshopSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
	companyName: { type: String, required: true },
	organizationNumber: { type: String, required: true },
	address: { type: String, required: true },
	city: { type: String, required: true },
	postalCode: { type: String, required: true },
	country: { type: String, default: 'SE' },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	phone: { type: String, required: true },
	email: { type: String, required: true },
	website: { type: String },
	description: { type: String },
	openingHours: { type: String },
	brandsHandled: { type: String },
	isVerified: { type: Boolean, default: false },
	verificationStatus: { 
		type: String, 
		enum: ['PENDING', 'APPROVED', 'REJECTED'], 
		default: 'PENDING' 
	},
	rejectionReason: { type: String },
	isActive: { type: Boolean, default: true },
	rating: { type: Number, default: 0 },
	reviewCount: { type: Number, default: 0 },
	documents: [{
		fileName: String,
		fileUrl: String,
		mimeType: String,
	}],
}, {
	timestamps: true,
})

export default mongoose.model('Workshop', workshopSchema)
