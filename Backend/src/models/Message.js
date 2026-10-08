import mongoose from 'mongoose'

const attachmentSchema = new mongoose.Schema({
	fileName: { type: String, required: true, trim: true },
	fileUrl: { type: String, required: true, trim: true },
	fileSize: { type: Number, default: 0 },
	mimeType: { type: String, default: '' },
}, { _id: false })

const messageSchema = new mongoose.Schema({
	requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true, index: true },
	workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true, index: true },
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	senderRole: { type: String, enum: ['CUSTOMER', 'WORKSHOP'], required: true },
	body: { type: String, default: '', trim: true, maxlength: 1000 },
	attachments: { type: [attachmentSchema], default: [] },
	readAt: { type: Date, default: null },
}, {
	timestamps: true,
})

messageSchema.index({ requestId: 1, workshopId: 1, createdAt: 1 })

export default mongoose.model('Message', messageSchema)
