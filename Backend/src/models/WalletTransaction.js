import mongoose from 'mongoose'

const walletTransactionSchema = new mongoose.Schema(
	{
		walletId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Wallet',
			required: true
		},
		amount: {
			type: Number,
			required: true,
			// Can be positive or negative
		},
		type: {
			type: String,
			enum: ['Deposit', 'Withdrawal', 'Payment', 'Refund'],
			required: true
		},
		status: {
			type: String,
			enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
			default: 'Pending'
		},
		description: {
			type: String,
			required: true
		},
		referenceId: {
			// Optional: BookingID, Stripe Charge ID, etc.
			type: mongoose.Schema.Types.ObjectId,
			default: null
		}
	},
	{
		timestamps: true
	}
)

export default mongoose.model('WalletTransaction', walletTransactionSchema)
