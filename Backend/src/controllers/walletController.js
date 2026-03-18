import Wallet from '../models/Wallet.js'
import WalletTransaction from '../models/WalletTransaction.js'
import mongoose from 'mongoose'

// Helper to get or create a wallet for a user
const getOrCreateWallet = async (userId) => {
	let wallet = await Wallet.findOne({ user: userId })
	if (!wallet) {
		wallet = await Wallet.create({
			user: userId,
			balance: 0,
			currency: 'SEK'
		})
	}
	return wallet
}

// Get Current Wallet Balance
export const getMyWallet = async (req, res) => {
	try {
		const userId = req.user._id
		const wallet = await getOrCreateWallet(userId)

		// Get recent transactions (top 5)
		const recentTransactions = await WalletTransaction.find({ walletId: wallet._id })
			.sort({ createdAt: -1 })
			.limit(5)

		res.json({
			wallet,
			recentTransactions
		})
	} catch (error) {
		console.error('[Wallet] Error fetching wallet:', error)
		res.status(500).json({ message: 'Server error fetching wallet', error: error.message })
	}
}

// Get All Transactions (Paginated)
export const getTransactions = async (req, res) => {
	try {
		const userId = req.user._id
		const wallet = await Wallet.findOne({ user: userId })
		if (!wallet) {
			return res.json({ transactions: [], totalPages: 0, currentPage: 1 })
		}

		const page = parseInt(req.query.page) || 1
		const limit = parseInt(req.query.limit) || 10
		const skip = (page - 1) * limit

		const txs = await WalletTransaction.find({ walletId: wallet._id })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
		
		const total = await WalletTransaction.countDocuments({ walletId: wallet._id })

		res.json({
			transactions: txs,
			totalPages: Math.ceil(total / limit),
			currentPage: page
		})
	} catch (error) {
		console.error('[Wallet] Error fetching transactions:', error)
		res.status(500).json({ message: 'Server error fetching transactions', error: error.message })
	}
}

// Deposit Funds (Mocked as Instant Completion for testing purposes)
export const depositFunds = async (req, res) => {
	try {
		const { amount, description = 'Deposit via Credit Card' } = req.body
		
		if (!amount || amount <= 0) {
			return res.status(400).json({ message: 'Invalid deposit amount' })
		}

		const userId = req.user._id
		const wallet = await getOrCreateWallet(userId)

		// 1. Create Transaction Record
		const tx = new WalletTransaction({
			walletId: wallet._id,
			amount: Math.abs(amount),
			type: 'Deposit',
			status: 'Completed', // Ordinarily 'Pending' until payment gateway confirms
			description
		})
		await tx.save()

		// 2. Update Wallet Balance
		wallet.balance += Math.abs(amount)
		await wallet.save()

		res.json({ message: 'Deposit successful', balance: wallet.balance, transaction: tx })
	} catch (error) {
		console.error('[Wallet] Deposit error:', error)
		res.status(500).json({ message: 'Server error during deposit', error: error.message })
	}
}

// Withdraw Funds (Creates a pending request and deducts available balance)
export const withdrawFunds = async (req, res) => {
	try {
		const { amount, bankDetails } = req.body

		if (!amount || amount <= 0) {
			return res.status(400).json({ message: 'Invalid withdrawal amount' })
		}

		const userId = req.user._id
		const wallet = await Wallet.findOne({ user: userId })
		if (!wallet) {
			return res.status(404).json({ message: 'Wallet not found' })
		}

		if (wallet.balance < amount) {
			return res.status(400).json({ message: 'Insufficient funds' })
		}

		// 1. Deduct from balance
		wallet.balance -= amount
		await wallet.save()

		// 2. Create Pending Transaction
		const tx = new WalletTransaction({
			walletId: wallet._id,
			amount: -Math.abs(amount),
			type: 'Withdrawal',
			status: 'Pending', // Awaiting admin approval
			description: `Withdrawal request to ${bankDetails || 'Bank Account'}`
		})
		await tx.save()

		res.json({ message: 'Withdrawal requested successfully', balance: wallet.balance, transaction: tx })
	} catch (error) {
		console.error('[Wallet] Withdrawal error:', error)
		res.status(500).json({ message: 'Server error during withdrawal', error: error.message })
	}
}
