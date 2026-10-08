import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema({
	requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	price: { type: Number, required: true },
	laborCost: { type: Number, default: 0 },
	partsCost: { type: Number, default: 0 },
	vatRate: { type: Number, default: 15, min: 0, max: 100 },
	commissionRate: { type: Number, min: 0, max: 100 },
	validityDays: { type: Number, default: 14 },
	expiresAt: { type: Date },
	inclusions: { type: String },
	note: { type: String },
	availableDates: { type: String },
	estimatedDuration: { type: Number },
	warranty: { type: String },
	loanerCar: { type: Boolean, default: false },
	originalParts: { type: Boolean, default: false },
	status: { 
		type: String, 
		default: 'SENT', 
		enum: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED'] 
	},
	cancellationReason: { type: String },
	cancelledBy: { type: String, enum: ['CUSTOMER', 'WORKSHOP', 'ADMIN'] },
	cancelledAt: { type: Date },
}, {
	timestamps: true,
})

export default mongoose.model('Offer', offerSchema)
