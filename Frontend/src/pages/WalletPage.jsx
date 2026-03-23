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
import { useAuth } from '../context/AuthContext'



export default function WalletPage() {
	const { user } = useAuth()
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
		<div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans mb-16 md:mb-0 relative">
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
								<h1 className="text-xl md:text-xl font-bold text-gray-900 mb-2">My Wallet</h1>
								<p className="text-sm md:text-base text-gray-500">Manage your funds, deposits, and payouts securely.</p>
							</div>
						</div>

						{/* Balance Card Section */}
						<div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 md:gap-0 w-full mb-8">
							<div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
								<h2 className="text-xl text-gray-400 font-semibold uppercase tracking-widest text-xs mb-3">Total Balance</h2>
								{loading ? (
									<div className="h-10 sm:h-14 w-48 sm:w-64 bg-gray-50 animate-pulse rounded-full"></div>
								) : (
									<div className="flex items-end justify-center md:justify-start gap-2">
										<p className="text-5xl md:text-6xl font-extrabold text-[#05324f] tracking-tight leading-none">
											{balance.toLocaleString('sv-SE', { minimumFractionDigits: 2 })}
										</p>
										<span className="text-2xl font-medium text-gray-400 mb-1 md:mb-1.5">SEK</span>
									</div>
								)}
							</div>

							<div className="flex flex-row items-center justify-center gap-3 w-full md:w-auto">
								<button
									onClick={() => setIsDepositOpen(true)}
									className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-[#34C759] hover:bg-[#2FB350] text-white rounded-xl font-bold transition-all shadow-md shadow-[#34C759]/20"
								>
									<Plus size={16} />
									<span>Deposit</span>
								</button>
								<button
									onClick={() => setIsWithdrawOpen(true)}
									className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-sm bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-[#05324f] rounded-xl font-bold transition-all shadow-sm shadow-gray-200/50"
								>
									<ArrowUpRight size={16} />
									<span>Withdraw</span>
								</button>
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
											<div key={i} className="animate-pulse flex flex-col gap-3 p-5 border border-gray-50 rounded-2xl">
												<div className="flex justify-between">
													<div className="h-4 bg-gray-100 rounded w-28"></div>
													<div className="h-4 bg-gray-100 rounded w-20"></div>
												</div>
												<div className="flex justify-between">
													<div className="h-4 bg-gray-100 rounded w-20"></div>
													<div className="h-5 bg-gray-100 rounded w-16"></div>
												</div>
											</div>
										))}
									</div>
								) : transactions.length === 0 ? (
									<div className="py-16 text-center text-gray-400">
										<Wallet size={48} className="mx-auto mb-4 text-gray-200 stroke-1" />
										<p className="text-lg font-medium text-gray-600">No transactions</p>
										<p className="text-sm">Activity will show up here</p>
									</div>
								) : (
									<div className="divide-y divide-gray-50">
										{transactions.map((tx) => (
											<div key={tx._id} className="p-5 flex items-center justify-between hover:bg-gray-50/30 transition-colors">
												<div className="flex items-center gap-4">
													<div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'Deposit' || tx.type === 'Refund' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-orange-50 text-orange-500'}`}>
														{tx.type === 'Deposit' || tx.type === 'Refund' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
													</div>
													<div className="flex flex-col">
														<span className="font-semibold text-gray-900 text-[15px]">{tx.description}</span>
														<span className="text-xs text-gray-400 font-medium">{moment(tx.createdAt).format('MMM D, HH:mm')}</span>
													</div>
												</div>
												<div className="flex flex-col items-end gap-1">
													<span className={`font-bold text-[15px] ${tx.amount > 0 ? 'text-[#34C759]' : 'text-gray-900'}`}>
														{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('sv-SE', { minimumFractionDigits: 2 })}
													</span>
													<div className={`text-[10px] uppercase tracking-wider font-bold ${getStatusColor(tx.status).replace('border-', '')} bg-transparent`}>
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
										<tr className="bg-[#f8fafc] text-gray-400 text-[11px] uppercase tracking-widest border-b border-gray-100">
											<th className="py-4 px-6 md:px-8 font-semibold">Date</th>
											<th className="py-4 px-6 font-semibold">Description</th>
											<th className="py-4 px-6 font-semibold">Status</th>
											<th className="py-4 px-6 md:px-8 font-semibold text-right">Amount</th>
										</tr>
									</thead>
									<tbody>
										{loading ? (
											[...Array(5)].map((_, i) => (
												<tr key={i} className="border-b border-gray-50">
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-100 rounded w-24"></div></td>
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-100 rounded w-48"></div></td>
													<td className="py-5 px-6 animate-pulse"><div className="h-4 bg-gray-100 rounded w-20"></div></td>
													<td className="py-5 px-6 animate-pulse origin-right"><div className="h-4 bg-gray-100 rounded w-24 ml-auto"></div></td>
												</tr>
											))
										) : transactions.length === 0 ? (
											<tr>
												<td colSpan="4" className="py-20 text-center text-gray-400">
													<div className="flex flex-col items-center justify-center gap-3">
														<Wallet size={48} className="text-gray-200 stroke-1 mb-2" />
														<p className="text-lg font-medium text-gray-600">No transactions</p>
														<p className="text-sm">Activity will show up here</p>
													</div>
												</td>
											</tr>
										) : (
											transactions.map((tx) => (
												<tr key={tx._id} className="border-b border-gray-50/50 hover:bg-gray-50/30 transition-colors group cursor-default">
													<td className="py-5 px-6 md:px-8 whitespace-nowrap text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors">
														{moment(tx.createdAt).format('MMM D, YYYY • HH:mm')}
													</td>
													<td className="py-5 px-6">
														<div className="flex items-center gap-3">
															<div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'Deposit' || tx.type === 'Refund' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-orange-50 text-orange-500'}`}>
																{tx.type === 'Deposit' || tx.type === 'Refund' ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
															</div>
															<span className="font-semibold text-gray-900">{tx.description}</span>
														</div>
													</td>
													<td className="py-5 px-6">
														<div className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${getStatusColor(tx.status).replace('border-', '')} bg-transparent`}>
															{tx.status}
														</div>
													</td>
													<td className={`py-5 px-6 md:px-8 text-right font-bold whitespace-nowrap text-base tracking-tight ${tx.amount > 0 ? 'text-[#34C759]' : 'text-gray-900'}`}>
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

			{user?.role === 'WORKSHOP' ?  : }
		</div>
	)
}
