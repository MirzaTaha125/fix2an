import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
	requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
	offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	scheduledAt: { type: Date },
	status: { 
		type: String, 
		default: 'CONFIRMED', 
		enum: [
			'CONFIRMED',
			'RESCHEDULED',
			'RECEIVED',
			'IN_PROGRESS',
			'READY_PICKUP',
			'CANCELLED',
			'DONE',
			'NO_SHOW',
		] 
	},
	paymentStatus: {
		type: String,
		default: 'UNPAID',
		enum: ['UNPAID', 'PAID'],
	},
	paidAt: { type: Date },
	finalAmount: { type: Number },
	commissionRate: { type: Number },
	commissionAmount: { type: Number },
	extraApprovals: [{
		description: String,
		price: Number,
		status: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED'], default: 'PENDING' },
		createdAt: { type: Date, default: Date.now },
	}],
	totalAmount: { type: Number, required: true },
	isAgreedToTerms: { type: Boolean, required: true },
	notes: { type: String },
	cancellationReason: { type: String },
	cancelledBy: { 
		type: String, 
		enum: ['CUSTOMER', 'WORKSHOP', 'ADMIN'] 
	},
	cancelledAt: { type: Date },
	reminder24hSentAt: { type: Date },
}, {
	timestamps: true,
})

export default mongoose.model('Booking', bookingSchema)
