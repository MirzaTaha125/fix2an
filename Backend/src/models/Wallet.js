import mongoose from 'mongoose'

const walletSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User'
		},
		balance: {
			type: Number,
			default: 0,
			min: [0, 'Wallet balance cannot be negative']
		},
		currency: {
			type: String,
			default: 'SEK'
		},
		status: {
			type: String,
			enum: ['Active', 'Suspended'],
			default: 'Active'
		}
	},
	{
		timestamps: true
	}
)

export default mongoose.model('Wallet', walletSchema)
