import mongoose from 'mongoose'

const pendingGuestRequestSchema = new mongoose.Schema({
	email: { type: String, required: true, lowercase: true, trim: true },
	token: { type: String, required: true, unique: true },
	expiresAt: { type: Date, required: true },
	requestData: {
		reportIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'InspectionReport' }],
		description: { type: String, required: true },
		registrationNumber: { type: String, default: '' },
		latitude: { type: Number, required: true },
		longitude: { type: Number, required: true },
		address: { type: String, required: true },
		city: { type: String, required: true },
		postalCode: { type: String, default: '' },
		country: { type: String, default: 'SE' },
		expiresAt: { type: Date, required: true },
		vehicle: {
			make: { type: String, required: true },
			model: { type: String, required: true },
			year: { type: Number, required: true },
			makeSlug: { type: String },
			modelSlug: { type: String },
		},
	},
}, {
	timestamps: true,
})

export default mongoose.model('PendingGuestRequest', pendingGuestRequestSchema)
