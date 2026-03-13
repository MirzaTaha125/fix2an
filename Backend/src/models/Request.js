import mongoose from 'mongoose'

const requestSchema = new mongoose.Schema({
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
	reportId: { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionReport', required: true },
	description: { type: String },
	status: { 
		type: String, 
		default: 'NEW', 
		enum: ['NEW', 'IN_BIDDING', 'BIDDING_CLOSED', 'BOOKED', 'COMPLETED', 'CANCELLED', 'EXPIRED'] 
	},
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	address: { type: String, required: true },
	city: { type: String, required: true },
	postalCode: { type: String, default: '' },
	country: { type: String, default: 'SE' },
	expiresAt: { type: Date, required: true },
}, {
	timestamps: true,
})

export default mongoose.model('Request', requestSchema)
