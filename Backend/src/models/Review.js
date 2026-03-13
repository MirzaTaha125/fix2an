import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema({
	bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	rating: { type: Number, required: true, min: 1, max: 5 },
	comment: { type: String },
	isPublished: { type: Boolean, default: true },
}, {
	timestamps: true,
})

export default mongoose.model('Review', reviewSchema)
