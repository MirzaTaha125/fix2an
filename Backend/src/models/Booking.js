import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema({
	requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
	offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	scheduledAt: { type: Date, required: true },
	status: { 
		type: String, 
		default: 'CONFIRMED', 
		enum: ['CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'DONE', 'NO_SHOW'] 
	},
	totalAmount: { type: Number, required: true },
	notes: { type: String },
	reminder24hSentAt: { type: Date },
}, {
	timestamps: true,
})

export default mongoose.model('Booking', bookingSchema)
