import React, { useState } from 'react'
import { X, CreditCard } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { walletAPI } from '../../services/api'
import { toast } from 'react-hot-toast'

export default function DepositModal({ isOpen, onClose, onDepositSuccess }) {
	const { t } = useTranslation()
	const [amount, setAmount] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	if (!isOpen) return null

	const handleSubmit = async (e) => {
		e.preventDefault()
		const numAmount = Number(amount)
		if (!numAmount || numAmount <= 0) {
			toast.error('Please enter a valid amount')
			return
		}

		setIsSubmitting(true)
		try {
			await walletAPI.deposit(numAmount)
			toast.success('Funds deposited successfully')
			onDepositSuccess()
			onClose()
			setAmount('')
		} catch (error) {
			console.error('Deposit error:', error)
			toast.error(error.response?.data?.message || 'Failed to deposit funds')
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
							<div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
								<CreditCard size={20} />
							</div>
							<h3 className="text-xl font-bold text-gray-900">Deposit Funds</h3>
						</div>
						<button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
							<X size={20} />
						</button>
					</div>

					{/* Body */}
					<form onSubmit={handleSubmit} className="p-6 space-y-6">
						<div className="space-y-4">
							<p className="text-sm text-gray-500">
								Enter the amount you wish to deposit into your wallet. (Mock transaction)
							</p>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<span className="text-gray-500 font-medium">SEK</span>
								</div>
								<input
									type="number"
									required
									min="1"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									className="block w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all outline-none"
									placeholder="0.00"
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
								disabled={isSubmitting || !amount}
								className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{isSubmitting ? (
									<>
										<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Processing...
									</>
								) : (
									'Deposit Now'
								)}
							</button>
						</div>
					</form>
				</motion.div>
			</div>
		</AnimatePresence>
	)
}
