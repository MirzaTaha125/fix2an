import React, { useState } from 'react'
import { X, Banknote } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { walletAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

export default function WithdrawModal({ isOpen, onClose, onWithdrawSuccess, currentBalance }) {
	const { t } = useTranslation()
	const [amount, setAmount] = useState('')
	const [bankDetails, setBankDetails] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	if (!isOpen) return null

	const handleSubmit = async (e) => {
		e.preventDefault()
		const numAmount = Number(amount)
		if (!numAmount || numAmount <= 0) {
			toast.error('Please enter a valid amount')
			return
		}

		if (numAmount > currentBalance) {
			toast.error('Insufficient funds')
			return
		}

		if (!bankDetails.trim()) {
			toast.error('Please provide your bank details')
			return
		}

		setIsSubmitting(true)
		try {
			await walletAPI.withdraw(numAmount, bankDetails)
			toast.success('Withdrawal request submitted successfully')
			onWithdrawSuccess()
			onClose()
			setAmount('')
			setBankDetails('')
		} catch (error) {
			console.error('Withdrawal error:', error)
			toast.error(error.response?.data?.message || 'Failed to submit withdrawal request')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<AnimatePresence>
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative"
				>
					{/* Header */}
					<div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
								<Banknote size={20} />
							</div>
							<h3 className="text-xl font-bold text-gray-900">Withdraw Funds</h3>
						</div>
						<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
							<X size={20} />
						</button>
					</div>

					{/* Body */}
					<form onSubmit={handleSubmit} className="p-6 space-y-5">
						
						<div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
							<span className="text-orange-800 text-sm font-medium">Available Balance</span>
							<span className="text-orange-600 font-bold text-lg">{currentBalance} SEK</span>
						</div>

						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
										<span className="text-gray-500 font-medium">SEK</span>
									</div>
									<input
										type="number"
										required
										min="1"
										max={currentBalance}
										value={amount}
										onChange={(e) => setAmount(e.target.value)}
										className="block w-full pl-14 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
										placeholder="0.00"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Bank Details / IBAN</label>
								<textarea
									required
									value={bankDetails}
									onChange={(e) => setBankDetails(e.target.value)}
									className="block w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none resize-none"
									rows="3"
									placeholder="Enter your Bank Name, Account Number, or IBAN..."
								/>
							</div>
						</div>

						{/* Actions */}
						<div className="flex gap-3 pt-4 border-t border-gray-100">
							<button
								type="button"
								onClick={onClose}
								className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isSubmitting || !amount || !bankDetails}
								className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? (
									<>
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Processing...
									</>
								) : (
									'Request Withdrawal'
								)}
							</button>
						</div>
					</form>
				</motion.div>
			</div>
		</AnimatePresence>
	)
}
