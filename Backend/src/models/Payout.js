import mongoose from 'mongoose'

const payoutSchema = new mongoose.Schema({
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	month: { type: Number, required: true },
	year: { type: Number, required: true },
	isPaid: { type: Boolean, default: false },
	paidAt: { type: Date },
}, {
	timestamps: true,
})

// Compound index for unique lookup
payoutSchema.index({ workshopId: 1, month: 1, year: 1 }, { unique: true })

export default mongoose.model('Payout', payoutSchema)
