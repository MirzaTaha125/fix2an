import mongoose from 'mongoose'

const supportMessageSchema = new mongoose.Schema({
	senderRole: { type: String, enum: ['CUSTOMER', 'ADMIN'], required: true },
	senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	body: { type: String, required: true, trim: true, maxlength: 2000 },
	readAt: { type: Date, default: null },
}, { timestamps: true })

const supportTicketSchema = new mongoose.Schema({
	customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	subject: { type: String, required: true, trim: true, maxlength: 120 },
	category: { type: String, default: 'general', trim: true },
	status: {
		type: String,
		enum: ['NEW', 'ONGOING', 'WAITING', 'CLOSED'],
		default: 'NEW',
		index: true,
	},
	messages: { type: [supportMessageSchema], default: [] },
	lastMessageAt: { type: Date, default: Date.now, index: true },
}, {
	timestamps: true,
})

supportTicketSchema.index({ customerId: 1, updatedAt: -1 })

export default mongoose.model('SupportTicket', supportTicketSchema)
