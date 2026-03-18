import express from 'express'
import Booking from '../models/Booking.js'
import Offer from '../models/Offer.js'
import Request from '../models/Request.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { notifyBookingConfirmed, notifyJobCompleteReviewRequest } from '../services/notificationService.js'

const router = express.Router()

// Create a booking
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const { offerId, scheduledAt, notes } = req.body

		if (!offerId || !scheduledAt) {
			return res.status(400).json({ message: 'Offer ID and scheduled date are required' })
		}

		// Get offer and related data
		const offer = await Offer.findById(offerId).populate('requestId').populate('workshopId')
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found' })
		}

		// FIX #5: Verify the logged-in customer owns the request this offer belongs to
		if (offer.requestId.customerId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Forbidden: this offer does not belong to your request' })
		}

		// FIX #4: Atomically claim the offer — prevents double booking race condition
		const claimed = await Offer.findOneAndUpdate(
			{ _id: offerId, status: 'SENT' },
			{ status: 'ACCEPTED' },
			{ new: false }
		)
		if (!claimed) {
			return res.status(409).json({ message: 'This offer has already been booked or is no longer available' })
		}

		// Calculate commission
		const commissionRate = parseFloat(process.env.COMMISSION_RATE) || 0.1
		const totalAmount = offer.price
		const commission = totalAmount * commissionRate
		const workshopAmount = totalAmount - commission

		// Create booking
		const booking = await Booking.create({
			requestId: offer.requestId._id,
			offerId: offer._id,
			customerId: req.user._id,
			workshopId: offer.workshopId._id,
			scheduledAt: new Date(scheduledAt),
			totalAmount,
			commission,
			workshopAmount,
			notes,
		})

		// Update request status
		await Request.findByIdAndUpdate(offer.requestId._id, { status: 'BOOKED' })

		const populatedBooking = await Booking.findById(booking._id)
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')

		notifyBookingConfirmed(populatedBooking).catch(() => {})

		return res.status(201).json(populatedBooking)
	} catch (error) {
		console.error('Booking creation error:', error)
		return res.status(500).json({ message: 'Failed to create booking' })
	}
})

// Get bookings for a customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
	try {
		const { customerId } = req.params

		if (req.user._id.toString() !== customerId && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const bookings = await Booking.find({ customerId })
			.populate('requestId')
			.populate('offerId')
			.populate('workshopId', 'companyName rating')
			.sort({ createdAt: -1 })

		return res.json(bookings)
	} catch (error) {
		console.error('Fetch bookings error:', error)
		return res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// FIX #3: /workshop/me MUST come before /workshop/:workshopId — otherwise Express matches 'me' as the workshopId param
// Get bookings for authenticated workshop user
router.get('/workshop/me', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const Workshop = (await import('../models/Workshop.js')).default
		const workshop = await Workshop.findOne({ userId: req.user._id })

		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const acceptedOffers = await Offer.find({
			workshopId: workshop._id,
			status: 'ACCEPTED',
		}).select('_id')

		const acceptedOfferIds = acceptedOffers.map((offer) => offer._id)

		const bookings = await Booking.find({
			workshopId: workshop._id,
			offerId: { $in: acceptedOfferIds },
		})
			.populate({
				path: 'requestId',
				select: 'description status createdAt',
				populate: { path: 'vehicleId', select: 'make model year' },
			})
			.populate({ path: 'offerId', select: 'price estimatedDuration warranty status createdAt' })
			.populate({ path: 'customerId', select: 'name email phone' })
			.sort({ createdAt: -1 })

		return res.status(200).json(bookings || [])
	} catch (error) {
		console.error('Fetch workshop bookings error:', error)
		return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message })
	}
})

// Get bookings for a workshop by ID (admin or workshop owner)
router.get('/workshop/:workshopId', authenticate, async (req, res) => {
	try {
		const { workshopId } = req.params

		const Workshop = (await import('../models/Workshop.js')).default
		const workshop = await Workshop.findById(workshopId)
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		if (workshop.userId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const bookings = await Booking.find({ workshopId })
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email phone')
			.sort({ createdAt: -1 })

		return res.json(bookings)
	} catch (error) {
		console.error('Fetch workshop bookings error:', error)
		return res.status(500).json({ message: 'Failed to fetch bookings' })
	}
})

// Update booking (cancel / reschedule / complete)
router.patch('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		const { status, scheduledAt, notes } = req.body

		const booking = await Booking.findById(id)
		if (!booking) {
			return res.status(404).json({ message: 'Booking not found' })
		}

		// Only the customer who made the booking or an admin can update it
		if (booking.customerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		// Whitelist allowed status transitions to prevent customers setting arbitrary statuses
		const ALLOWED_STATUSES = ['CANCELLED', 'RESCHEDULED', 'DONE']
		if (status && !ALLOWED_STATUSES.includes(status)) {
			return res.status(400).json({ message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` })
		}

		const updateData = {}
		if (status) {
			updateData.status = status
		} else if (scheduledAt) {
			updateData.status = 'RESCHEDULED'
		}
		if (scheduledAt) {
			updateData.scheduledAt = new Date(scheduledAt)
			updateData.reminder24hSentAt = null
		}
		if (notes !== undefined) updateData.notes = notes

		const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true })
			.populate('requestId')
			.populate('offerId')
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')

		if (updateData.status === 'CANCELLED' && booking.requestId) {
			await Request.findByIdAndUpdate(booking.requestId, { status: 'BIDDING_CLOSED' })
		}

		if (updateData.status === 'DONE' && booking.status !== 'DONE') {
			if (booking.requestId) {
				await Request.findByIdAndUpdate(booking.requestId, { status: 'COMPLETED' })
				notifyJobCompleteReviewRequest(updatedBooking).catch(() => {})
			}

			// Safely credit the workshop's wallet
			try {
				const Workshop = (await import('../models/Workshop.js')).default
				const Wallet = (await import('../models/Wallet.js')).default
				const WalletTransaction = (await import('../models/WalletTransaction.js')).default

				const workshop = await Workshop.findById(booking.workshopId)
				if (workshop && updatedBooking.workshopAmount > 0) {
					let wallet = await Wallet.findOne({ user: workshop.userId })
					if (!wallet) {
						wallet = await Wallet.create({ user: workshop.userId, balance: 0 })
					}

					// Credit the balance
					wallet.balance += updatedBooking.workshopAmount
					await wallet.save()

					// Record the payment
					await WalletTransaction.create({
						walletId: wallet._id,
						amount: updatedBooking.workshopAmount,
						type: 'Payment',
						status: 'Completed',
						description: `Earning from completed booking`,
						referenceId: booking._id
					})
				}
			} catch (walletError) {
				console.error('Failed to credit workshop wallet for booking', booking._id, walletError)
			}
		}

		return res.json(updatedBooking)
	} catch (error) {
		console.error('Update booking error:', error)
		return res.status(500).json({ message: 'Failed to update booking' })
	}
})

export default router
