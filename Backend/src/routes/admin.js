import express from 'express'
import User from '../models/User.js'
import Workshop from '../models/Workshop.js'
import Request from '../models/Request.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import Payout from '../models/Payout.js'
import EmailConfig from '../models/EmailConfig.js'
import { notifyWorkshopWelcome } from '../services/notificationService.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { expireRequests } from '../utils/expireRequests.js'

const router = express.Router()

// All admin routes require authentication and ADMIN role
router.use(authenticate)
router.use(requireRole('ADMIN'))

// Get admin stats
router.get('/stats', async (req, res) => {
	try {
		const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' })
		const totalWorkshops = await Workshop.countDocuments()
		const pendingWorkshops = await Workshop.countDocuments({ isVerified: false })
		const totalRequests = await Request.countDocuments()
		const totalBookings = await Booking.countDocuments()
		
		// Calculate revenue from completed bookings
		const bookings = await Booking.find({ status: 'DONE' })
		const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.commission || 0), 0)
		
		// Monthly revenue (current month)
		const now = new Date()
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
		const monthlyBookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startOfMonth }
		})
		const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + (booking.commission || 0), 0)

		res.json({
			totalCustomers,
			totalWorkshops,
			pendingWorkshops,
			totalRequests,
			totalBookings,
			totalRevenue,
			monthlyRevenue,
		})
	} catch (error) {
		console.error('Admin stats error:', error)
		res.status(500).json({ message: 'Failed to fetch stats' })
	}
})

// Get all users (customers)
router.get('/users', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, role, isActive } = req.query
		const query = {}
		
		if (role) {
			query.role = role
		} else {
			query.role = 'CUSTOMER' // Default to customers
		}
		
		if (isActive !== undefined && isActive !== '' && isActive !== 'all') {
			query.isActive = isActive === 'true'
		}
		
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const users = await User.find(query)
			.select('-password')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get counts for each user
		const usersWithCounts = await Promise.all(
			users.map(async (user) => {
				const requestCount = await Request.countDocuments({ customerId: user._id })
				const bookingCount = await Booking.countDocuments({ customerId: user._id })
				return {
					...user,
					id: user._id,
					_count: {
						requests: requestCount,
						bookings: bookingCount,
					},
				}
			})
		)

		const total = await User.countDocuments(query)

		res.json({
			users: usersWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin users error:', error)
		res.status(500).json({ message: 'Failed to fetch users' })
	}
})

// Update user status
router.patch('/users/:id', async (req, res) => {
	try {
		const { id } = req.params
		const { isActive } = req.body

		const user = await User.findByIdAndUpdate(
			id,
			{ isActive },
			{ new: true }
		)

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		res.json(user)
	} catch (error) {
		console.error('Update user error:', error)
		res.status(500).json({ message: 'Failed to update user' })
	}
})

// Get pending workshops
router.get('/pending-workshops', async (req, res) => {
	try {
		const workshops = await Workshop.find({ isVerified: false })
			.populate('userId', 'name email')
			.lean()

		const workshopsWithIds = workshops.map((w) => ({
			...w,
			id: w._id,
			email: w.email || w.userId?.email,
			createdAt: w.createdAt,
			documents: w.documents || [],
		}))

		res.json(workshopsWithIds)
	} catch (error) {
		console.error('Pending workshops error:', error)
		res.status(500).json({ message: 'Failed to fetch pending workshops' })
	}
})

// Get all workshops
router.get('/workshops', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, verified, active } = req.query
		const query = {}

		if (verified !== undefined) {
			query.isVerified = verified === 'true'
		}
		if (active !== undefined) {
			query.isActive = active === 'true'
		}
		if (search) {
			query.$or = [
				{ companyName: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const workshops = await Workshop.find(query)
			.populate('userId', 'name email')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get counts for each workshop
		const workshopsWithCounts = await Promise.all(
			workshops.map(async (workshop) => {
				const offerCount = await Offer.countDocuments({ workshopId: workshop._id })
				const bookingCount = await Booking.countDocuments({ workshopId: workshop._id })
				return {
					...workshop,
					id: workshop._id,
					documents: workshop.documents || [],
					_count: {
						offers: offerCount,
						bookings: bookingCount,
						reviews: workshop.reviewCount || 0,
					},
				}
			})
		)

		const total = await Workshop.countDocuments(query)

		res.json({
			workshops: workshopsWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin workshops error:', error)
		res.status(500).json({ message: 'Failed to fetch workshops' })
	}
})

// Get single workshop by ID
router.get('/workshops/:id', async (req, res) => {
	try {
		const { id } = req.params
		const workshop = await Workshop.findById(id)
			.populate('userId', 'name email')
			.lean()

		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const workshopWithId = {
			...workshop,
			id: workshop._id,
			documents: workshop.documents || [],
		}

		res.json(workshopWithId)
	} catch (error) {
		console.error('Get workshop by ID error:', error)
		res.status(500).json({ message: 'Failed to fetch workshop' })
	}
})

// Update workshop status
router.patch('/workshops', async (req, res) => {
	try {
		const { id, isVerified, isActive } = req.body

		const updateData = {}
		if (isVerified !== undefined) updateData.isVerified = isVerified
		if (isActive !== undefined) updateData.isActive = isActive

		const previous = await Workshop.findById(id).select('isVerified').lean()
		const workshop = await Workshop.findByIdAndUpdate(id, updateData, { new: true })

		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		if (isVerified === true && previous && !previous.isVerified) {
			notifyWorkshopWelcome(workshop._id).catch(() => {})
		}

		res.json(workshop)
	} catch (error) {
		console.error('Update workshop error:', error)
		res.status(500).json({ message: 'Failed to update workshop' })
	}
})

// Get all requests
router.get('/requests', async (req, res) => {
	try {
		// Mark any newly-expired requests before returning
		await expireRequests()

		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}
		if (search) {
			query.$or = [
				{ address: { $regex: search, $options: 'i' } },
				{ city: { $regex: search, $options: 'i' } },
			]
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const requests = await Request.find(query)
			.populate('customerId', 'name email')
			.populate('vehicleId', 'make model year')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		// Get offer counts
		const requestsWithCounts = await Promise.all(
			requests.map(async (request) => {
				const offerCount = await Offer.countDocuments({ requestId: request._id })
				return {
					...request,
					id: request._id,
					customer: request.customerId,
					vehicle: request.vehicleId,
					_count: {
						offers: offerCount,
					},
				}
			})
		)

		const total = await Request.countDocuments(query)

		res.json({
			requests: requestsWithCounts,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin requests error:', error)
		res.status(500).json({ message: 'Failed to fetch requests' })
	}
})

// Get all offers
router.get('/offers', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const offers = await Offer.find(query)
			.populate('workshopId', 'companyName')
			.populate('requestId', 'vehicleId')
			.populate({
				path: 'requestId',
				populate: { path: 'vehicleId', select: 'make model year' }
			})
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		const offersWithData = offers.map((offer) => ({
			...offer,
			id: offer._id,
			workshop: offer.workshopId,
			request: offer.requestId,
		}))

		const total = await Offer.countDocuments(query)

		res.json({
			offers: offersWithData,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin offers error:', error)
		res.status(500).json({ message: 'Failed to fetch offers' })
	}
})

// Get all bookings
router.get('/bookings', async (req, res) => {
	try {
		const { search, page = 1, limit = 20, status } = req.query
		const query = {}

		if (status && status !== 'all') {
			query.status = status
		}

		const skip = (parseInt(page) - 1) * parseInt(limit)
		const bookings = await Booking.find(query)
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')
			.skip(skip)
			.limit(parseInt(limit))
			.lean()

		const bookingsWithData = bookings.map((booking) => ({
			...booking,
			id: booking._id,
			customer: booking.customerId,
			workshop: booking.workshopId,
		}))

		const total = await Booking.countDocuments(query)

		res.json({
			bookings: bookingsWithData,
			total,
			page: parseInt(page),
			limit: parseInt(limit),
		})
	} catch (error) {
		console.error('Admin bookings error:', error)
		res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// Get payouts (simplified - generate on demand)
router.get('/payouts', async (req, res) => {
	try {
		const { month, year } = req.query
		
		if (!month || !year) {
			return res.json({ reports: [] })
		}

		// Get all bookings for the month/year that are DONE
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
		const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

		const bookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startDate, $lte: endDate }
		})
			.populate('workshopId', 'companyName')
			.lean()

		// Group by workshop
		const workshopMap = new Map()
		bookings.forEach((booking) => {
			const workshopId = booking.workshopId?._id?.toString()
			if (!workshopId) return

			if (!workshopMap.has(workshopId)) {
				workshopMap.set(workshopId, {
					workshopId,
					workshop: booking.workshopId,
					month: parseInt(month),
					year: parseInt(year),
					totalJobs: 0,
					totalAmount: 0,
					commission: 0,
					workshopAmount: 0,
					isPaid: false,
				})
			}

			const report = workshopMap.get(workshopId)
			report.totalJobs++
			report.totalAmount += booking.totalAmount || 0
			report.commission += booking.commission || 0
			report.workshopAmount += (booking.totalAmount || 0) - (booking.commission || 0)
		})

		// Fetch persisted payout status
		const payouts = await Payout.find({
			month: parseInt(month),
			year: parseInt(year),
			workshopId: { $in: Array.from(workshopMap.keys()) },
		}).lean()
		const payoutByWorkshop = new Map(payouts.map(p => [p.workshopId.toString(), p]))

		const reports = Array.from(workshopMap.values()).map((report, index) => {
			const persisted = payoutByWorkshop.get(report.workshopId)
			return {
				...report,
				id: `payout-${report.workshopId}-${month}-${year}-${index}`,
				isPaid: persisted?.isPaid ?? report.isPaid,
				paidAt: persisted?.paidAt,
			}
		})

		res.json({ reports })
	} catch (error) {
		console.error('Admin payouts error:', error)
		res.status(500).json({ message: 'Failed to fetch payouts' })
	}
})

// Generate payouts (same as get, but POST)
router.post('/payouts', async (req, res) => {
	try {
		const { month, year } = req.body
		
		if (!month || !year) {
			return res.status(400).json({ message: 'Month and year are required' })
		}

		// Same logic as GET
		const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
		const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

		const bookings = await Booking.find({
			status: 'DONE',
			createdAt: { $gte: startDate, $lte: endDate }
		})
			.populate('workshopId', 'companyName')
			.lean()

		const workshopMap = new Map()
		bookings.forEach((booking) => {
			const workshopId = booking.workshopId?._id?.toString()
			if (!workshopId) return

			if (!workshopMap.has(workshopId)) {
				workshopMap.set(workshopId, {
					workshopId,
					workshop: booking.workshopId,
					month: parseInt(month),
					year: parseInt(year),
					totalJobs: 0,
					totalAmount: 0,
					commission: 0,
					workshopAmount: 0,
					isPaid: false,
				})
			}

			const report = workshopMap.get(workshopId)
			report.totalJobs++
			report.totalAmount += booking.totalAmount || 0
			report.commission += booking.commission || 0
			report.workshopAmount += (booking.totalAmount || 0) - (booking.commission || 0)
		})

		const reports = Array.from(workshopMap.values()).map((report, index) => ({
			...report,
			id: `payout-${report.workshopId}-${month}-${year}-${index}`,
		}))

		res.json({ reports, count: reports.length })
	} catch (error) {
		console.error('Generate payouts error:', error)
		res.status(500).json({ message: 'Failed to generate payouts' })
	}
})

// Get email config (password/privateKey not returned)
router.get('/email-config', async (req, res) => {
	try {
		const doc = await EmailConfig.findOne().lean()
		if (!doc) {
			return res.json({
				provider: 'smtp',
				host: '', port: 587, user: '', from: '', secure: false, hasPassword: false,
				emailjsUserId: '', emailjsServiceId: '', emailjsTemplateId: '', hasEmailjsPrivateKey: false,
			})
		}
		res.json({
			provider: doc.provider || 'smtp',
			host: doc.host || '',
			port: doc.port ?? 587,
			user: doc.user || '',
			from: doc.from || doc.user || '',
			secure: doc.secure ?? false,
			hasPassword: !!(doc.password && doc.password.length > 0),
			emailjsUserId: doc.emailjsUserId || '',
			emailjsServiceId: doc.emailjsServiceId || '',
			emailjsTemplateId: doc.emailjsTemplateId || '',
			hasEmailjsPrivateKey: !!(doc.emailjsPrivateKey && doc.emailjsPrivateKey.length > 0),
		})
	} catch (error) {
		console.error('Get email config error:', error)
		res.status(500).json({ message: 'Failed to fetch email config' })
	}
})

// Update email config
router.patch('/email-config', async (req, res) => {
	try {
		const { provider, host, port, user, password, from, secure, emailjsUserId, emailjsServiceId, emailjsTemplateId, emailjsPrivateKey } = req.body
		const update = {}
		if (provider !== undefined) update.provider = provider === 'emailjs' ? 'emailjs' : 'smtp'
		if (host !== undefined) update.host = String(host)
		if (port !== undefined) update.port = parseInt(port, 10) || 587
		if (user !== undefined) update.user = String(user)
		if (password !== undefined && password !== '') update.password = String(password)
		if (from !== undefined) update.from = String(from)
		if (secure !== undefined) update.secure = !!secure
		if (emailjsUserId !== undefined) update.emailjsUserId = String(emailjsUserId)
		if (emailjsServiceId !== undefined) update.emailjsServiceId = String(emailjsServiceId)
		if (emailjsTemplateId !== undefined) update.emailjsTemplateId = String(emailjsTemplateId)
		if (emailjsPrivateKey !== undefined && emailjsPrivateKey !== '') update.emailjsPrivateKey = String(emailjsPrivateKey)

		const doc = await EmailConfig.findOneAndUpdate({}, { $set: update }, { upsert: true, new: true }).lean()

		res.json({
			provider: doc.provider || 'smtp',
			host: doc.host || '',
			port: doc.port ?? 587,
			user: doc.user || '',
			from: doc.from || doc.user || '',
			secure: doc.secure ?? false,
			hasPassword: !!(doc.password && doc.password.length > 0),
			emailjsUserId: doc.emailjsUserId || '',
			emailjsServiceId: doc.emailjsServiceId || '',
			emailjsTemplateId: doc.emailjsTemplateId || '',
			hasEmailjsPrivateKey: !!(doc.emailjsPrivateKey && doc.emailjsPrivateKey.length > 0),
		})
	} catch (error) {
		console.error('Update email config error:', error)
		res.status(500).json({ message: 'Failed to update email config' })
	}
})

// Mark payout as paid
router.patch('/payouts/:id/mark-paid', async (req, res) => {
	try {
		// Parse id format: payout-{workshopId}-{month}-{year}-{index}
		const match = req.params.id.match(/^payout-([a-f0-9]+)-(\d+)-(\d+)-(\d+)$/)
		if (!match) {
			return res.status(400).json({ message: 'Invalid payout ID format' })
		}
		const [, workshopId, month, year] = match

		await Payout.findOneAndUpdate(
			{ workshopId, month: parseInt(month), year: parseInt(year) },
			{ isPaid: true, paidAt: new Date() },
			{ upsert: true, new: true }
		)
		res.json({ message: 'Payout marked as paid' })
	} catch (error) {
		console.error('Mark payout paid error:', error)
		res.status(500).json({ message: 'Failed to mark payout as paid' })
	}
})

export default router

