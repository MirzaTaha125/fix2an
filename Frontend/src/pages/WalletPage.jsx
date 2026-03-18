import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, XCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import DepositModal from '../components/wallet/DepositModal'
import WithdrawModal from '../components/wallet/WithdrawModal'
import { walletAPI } from '../services/api'
import { toast } from 'react-hot-toast'
import moment from 'moment'

export default function WalletPage() {
	const [balance, setBalance] = useState(0)
	const [transactions, setTransactions] = useState([])
	const [loading, setLoading] = useState(true)
	const [isDepositOpen, setIsDepositOpen] = useState(false)
	const [isWithdrawOpen, setIsWithdrawOpen] = useState(false)

	const loadWalletData = async () => {
		try {
			setLoading(true)
			const { data } = await walletAPI.getWallet()
			setBalance(data.wallet.balance)
			window.dispatchEvent(new Event('walletUpdate'))
			
			// We can also load paginated transactions
			const txRes = await walletAPI.getTransactions({ page: 1, limit: 20 })
			setTransactions(txRes.data.transactions)
		} catch (error) {
			console.error('Failed to load wallet:', error)
			toast.error('Failed to load wallet data')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadWalletData()
	}, [])

	const getStatusColor = (status) => {
		switch (status) {
			case 'Completed': return 'text-green-600 bg-green-50 border-green-200'
			case 'Pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
			case 'Failed':
			case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200'
			default: return 'text-gray-600 bg-gray-50 border-gray-200'
		}
	}

	const getStatusIcon = (status) => {
		switch (status) {
			case 'Completed': return <CheckCircle2 size={16} />
			case 'Pending': return <Clock size={16} />
			case 'Failed':
			case 'Cancelled': return <XCircle size={16} />
			default: return null
		}
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col font-sans">
			<Navbar />

			<main className="flex-grow pt-28 pb-20">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="space-y-8"
					>
						{/* Header Section */}
						<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
							<div>
								<h1 className="text-3xl font-bold text-gray-900 mb-2">My Wallet</h1>
								<p className="text-gray-500">Manage your funds, deposits, and payouts securely.</p>
							</div>
						</div>

						{/* Balance Card Section */}
						<div className="bg-gradient-to-br from-[#1C3F94] to-[#2563eb] rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
							{/* Decorative Background Circles */}
							<div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5"></div>
							<div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-white opacity-5"></div>

							<div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
								<div className="flex items-center gap-6">
									<div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
										<Wallet size={32} className="text-white" />
									</div>
									<div>
										<p className="text-blue-100 font-medium mb-1">Available Balance</p>
										{loading ? (
											<div className="h-10 w-48 bg-white/20 animate-pulse rounded-lg"></div>
										) : (
											<h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
												{balance.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} <span className="text-2xl font-semibold opacity-80">SEK</span>
											</h2>
										)}
									</div>
								</div>

								<div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 sm:gap-4 mt-6 md:mt-0">
									<button
										onClick={() => setIsDepositOpen(true)}
										className="w-full sm:w-auto flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#1C3F94] rounded-xl font-bold hover:bg-gray-50 active:scale-[0.98] transition-all shadow-sm"
									>
										<Plus size={20} />
										Deposit
									</button>
									<button
										onClick={() => setIsWithdrawOpen(true)}
										className="w-full sm:w-auto flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 border border-white/20 text-white hover:bg-white/20 active:scale-[0.98] rounded-xl font-bold transition-all backdrop-blur-sm"
									>
										<ArrowUpRight size={20} />
										Withdraw
									</button>
								</div>
							</div>
						</div>

						{/* Transactions Table Section */}
						<div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
							<div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center">
								<h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
							</div>

							{/* Mobile Transactions View */}
							<div className="md:hidden">
								{loading ? (
									<div className="p-4 space-y-4">
										{[...Array(4)].map((_, i) => (
											<div key={i} className="animate-pulse flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl">
												<div className="flex justify-between">
													<div className="h-5 bg-gray-200 rounded w-32"></div>
													<div className="h-5 bg-gray-200 rounded w-20"></div>
												</div>
												<div className="flex justify-between">
													<div className="h-4 bg-gray-200 rounded w-24"></div>
													<div className="h-6 bg-gray-200 rounded w-16"></div>
												</div>
											</div>
										))}
									</div>
								) : transactions.length === 0 ? (
									<div className="py-12 text-center text-gray-500">
										<div className="flex flex-col items-center justify-center gap-3">
											<div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-2">
												<Wallet size={32} />
											</div>
											<p className="text-lg font-medium text-gray-900">No transactions yet</p>
											<p className="text-sm">Your transaction history will appear here.</p>
										</div>
									</div>
								) : (
									<div className="divide-y divide-gray-100">
										{transactions.map((tx) => (
											<div key={tx._id} className="p-5 hover:bg-gray-50/50 transition-colors">
												<div className="flex justify-between items-start mb-3">
													<div>
														<h3 className="font-bold text-gray-900 leading-tight mb-1">{tx.description}</h3>
														<p className="text-xs text-gray-500 font-medium">{moment(tx.createdAt).format('MMM D, YYYY • HH:mm')}</p>
													</div>
													<div className={`text-right font-extrabold whitespace-nowrap text-lg ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
														{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK
													</div>
												</div>
												<div className="flex items-center gap-3">
													<div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[11px] uppercase tracking-wide font-bold">
														{tx.type === 'Deposit' || tx.type === 'Refund' ? <ArrowDownRight size={14} className="text-green-600" /> : <ArrowUpRight size={14} className="text-orange-600" />}
														{tx.type}
													</div>
													<div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-[11px] uppercase tracking-wide font-bold ${getStatusColor(tx.status)}`}>
														{getStatusIcon(tx.status)}
														{tx.status}
													</div>
												</div>
											</div>
										))}
									</div>
								)}
							</div>

							{/* Desktop Transactions View */}
							<div className="hidden md:block overflow-x-auto">
								<table className="w-full text-left border-collapse">
									<thead>
										<tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
											<th className="py-4 px-6 md:px-8 font-bold">Date</th>
											<th className="py-4 px-6 font-bold">Description</th>
											<th className="py-4 px-6 font-bold">Type</th>
											<th className="py-4 px-6 font-bold">Status</th>
											<th className="py-4 px-6 md:px-8 font-bold text-right">Amount</th>
										</tr>
									</thead>
									<tbody>
										{loading ? (
											[...Array(5)].map((_, i) => (
												<tr key={i} className="border-b border-gray-50">
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
													<td className="py-5 px-6 animate-pulse origin-right"><div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div></td>
												</tr>
											))
										) : transactions.length === 0 ? (
											<tr>
												<td colSpan="5" className="py-16 text-center text-gray-500">
													<div className="flex flex-col items-center justify-center gap-3">
														<div className="p-4 bg-gray-50 rounded-full text-gray-400 mb-2">
															<Wallet size={32} />
														</div>
														<p className="text-lg font-bold text-gray-900">No transactions yet</p>
														<p className="text-sm">Your transaction history will appear here.</p>
													</div>
												</td>
											</tr>
										) : (
											transactions.map((tx) => (
												<tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
													<td className="py-5 px-6 md:px-8 whitespace-nowrap text-sm text-gray-500 font-medium">
														{moment(tx.createdAt).format('MMM D, YYYY • HH:mm')}
													</td>
													<td className="py-5 px-6 font-bold text-gray-900">
														{tx.description}
													</td>
													<td className="py-5 px-6">
														<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100/80 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider">
															{tx.type === 'Deposit' || tx.type === 'Refund' ? <ArrowDownRight size={14} className="text-green-600" /> : <ArrowUpRight size={14} className="text-orange-600" />}
															{tx.type}
														</div>
													</td>
													<td className="py-5 px-6">
														<div className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider ${getStatusColor(tx.status)}`}>
															{getStatusIcon(tx.status)}
															{tx.status}
														</div>
													</td>
													<td className={`py-5 px-6 md:px-8 text-right font-extrabold whitespace-nowrap text-[#1C3F94] ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
														{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} SEK
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</motion.div>
				</div>
			</main>

			<Footer />

			<DepositModal
				isOpen={isDepositOpen}
				onClose={() => setIsDepositOpen(false)}
				onDepositSuccess={loadWalletData}
			/>

			<WithdrawModal
				isOpen={isWithdrawOpen}
				onClose={() => setIsWithdrawOpen(false)}
				onWithdrawSuccess={loadWalletData}
				currentBalance={balance}
			/>
		</div>
	)
}
