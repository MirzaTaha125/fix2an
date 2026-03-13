import mongoose from 'mongoose'

const offerSchema = new mongoose.Schema({
	requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true },
	price: { type: Number, required: true },
	note: { type: String },
	availableDates: { type: String },
	estimatedDuration: { type: Number },
	warranty: { type: String },
	status: { 
		type: String, 
		default: 'SENT', 
		enum: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'] 
	},
}, {
	timestamps: true,
})

export default mongoose.model('Offer', offerSchema)
