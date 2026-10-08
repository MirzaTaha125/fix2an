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
		const { offerId, scheduledAt, notes, isAgreedToTerms } = req.body

		if (!offerId || isAgreedToTerms === undefined) {
			return res.status(400).json({ message: 'Offer ID and agreement confirmation are required' })
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

		const totalAmount = offer.price

		// Create booking
		const booking = await Booking.create({
			requestId: offer.requestId._id,
			offerId: offer._id,
			customerId: req.user._id,
			workshopId: offer.workshopId._id,
			...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
			totalAmount,
			isAgreedToTerms: !!isAgreedToTerms,
			notes,
		})

		// Update request status
		await Request.findByIdAndUpdate(offer.requestId._id, { status: 'BOOKED' })

		// Mark all other "SENT" offers for this request as "EXPIRED"
		await Offer.updateMany(
			{ 
				requestId: offer.requestId._id, 
				status: 'SENT', 
				_id: { $ne: offerId } 
			},
			{ status: 'EXPIRED' }
		)

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
			.populate({ path: 'requestId', populate: { path: 'vehicleId', select: 'make model year registrationNumber' } })
			.populate('offerId')
			.populate('customerId', 'name email phone')
			.populate({
				path: 'workshopId',
				select: 'companyName rating reviewCount email phone address city postalCode userId',
				populate: { path: 'userId', select: 'name image' },
			})
			.sort({ createdAt: -1 })

		const withImages = bookings.map((booking) => {
			const row = booking.toObject()
			const workshopImage = row.workshopId?.userId?.image || ''
			if (row.workshopId && workshopImage) {
				row.workshopId.image = workshopImage
				row.workshopId.logo = workshopImage
			}
			return row
		})

		return res.json(withImages)
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
			status: { $in: ['ACCEPTED', 'DONE', 'CANCELLED'] },
		}).select('_id')

		const acceptedOfferIds = acceptedOffers.map((offer) => offer._id)

		const bookings = await Booking.find({
			workshopId: workshop._id,
			offerId: { $in: acceptedOfferIds },
		})
			.populate({
				path: 'requestId',
				select: 'description status createdAt registrationNumber city postalCode',
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

		const Workshop = (await import('../models/Workshop.js')).default
		let isWorkshopOwner = false
		if (req.user.role === 'WORKSHOP') {
			const workshop = await Workshop.findOne({ userId: req.user._id })
			if (workshop && booking.workshopId.toString() === workshop._id.toString()) {
				isWorkshopOwner = true
			}
		}

		// Customer, workshop owner, or admin may update the booking
		if (
			booking.customerId.toString() !== req.user._id.toString() &&
			req.user.role !== 'ADMIN' &&
			!isWorkshopOwner
		) {
			return res.status(403).json({ message: 'Forbidden' })
		}

		// Whitelist allowed status transitions
		const isCustomerOwner = booking.customerId.toString() === req.user._id.toString()
		const CUSTOMER_STATUSES = ['CANCELLED', 'RESCHEDULED', 'DONE']
		const WORKSHOP_STATUSES = ['CANCELLED', 'RESCHEDULED', 'DONE', 'RECEIVED', 'IN_PROGRESS', 'READY_PICKUP']
		const ALLOWED_STATUSES = isWorkshopOwner || req.user.role === 'ADMIN' ? WORKSHOP_STATUSES : CUSTOMER_STATUSES
		if (status && !ALLOWED_STATUSES.includes(status)) {
			return res.status(400).json({ message: `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}` })
		}

		// Customer may only mark DONE after workshop sets READY_PICKUP (picked up the car)
		if (status === 'DONE' && isCustomerOwner && !isWorkshopOwner && req.user.role !== 'ADMIN') {
			if (booking.status !== 'READY_PICKUP') {
				return res.status(400).json({ message: 'You can only close the case when the car is ready for pickup' })
			}
		}

		const { cancellationReason, extraApprovals, extraApprovalIndex, extraApprovalStatus } = req.body

		const updateData = {}
		if (status) {
			updateData.status = status
			
			// Handle cancellation metadata
			if (status === 'CANCELLED') {
				updateData.cancelledAt = new Date()
				updateData.cancellationReason = cancellationReason || 'No reason provided'
				
				// Identify who cancelled based on role
				const userRole = req.user.role?.toUpperCase()
				if (userRole === 'ADMIN') {
					updateData.cancelledBy = 'ADMIN'
				} else if (userRole === 'WORKSHOP') {
					updateData.cancelledBy = 'WORKSHOP'
				} else {
					updateData.cancelledBy = 'CUSTOMER'
				}
			}
		} else if (scheduledAt && booking.scheduledAt) {
			updateData.status = 'RESCHEDULED'
		}
		if (scheduledAt) {
			updateData.scheduledAt = new Date(scheduledAt)
			updateData.reminder24hSentAt = null
		}
		if (notes !== undefined) updateData.notes = notes
		// Workshop can lock in final amount while car is ready for pickup (before customer closes)
		if (
			req.body.finalAmount != null &&
			(isWorkshopOwner || req.user.role === 'ADMIN') &&
			status !== 'DONE'
		) {
			const lockedAmount = Number(req.body.finalAmount)
			if (Number.isFinite(lockedAmount) && lockedAmount > 0) {
				updateData.finalAmount = Math.round(lockedAmount)
			}
		}
		if (status === 'DONE' && booking.status !== 'DONE') {
			const { getPlatformRates } = await import('../utils/platformSettings.js')
			const { commissionRate } = await getPlatformRates()
			let finalAmount = Number(req.body.finalAmount)
			if ((!Number.isFinite(finalAmount) || finalAmount <= 0) && Number(booking.finalAmount) > 0) {
				finalAmount = Number(booking.finalAmount)
			}
			if ((!Number.isFinite(finalAmount) || finalAmount <= 0) && isCustomerOwner && !isWorkshopOwner) {
				const extrasSum = (booking.extraApprovals || [])
					.filter((e) => e.status === 'APPROVED')
					.reduce((sum, e) => sum + (Number(e.price) || 0), 0)
				finalAmount = (Number(booking.totalAmount) || 0) + extrasSum
			}
			if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
				return res.status(400).json({ message: 'A final job value is required to complete the job' })
			}
			updateData.finalAmount = Math.round(finalAmount)
			updateData.commissionRate = commissionRate
			updateData.commissionAmount = Math.round(finalAmount * commissionRate) / 100
			updateData.paymentStatus = 'PAID'
			updateData.paidAt = new Date()
		}
		if (Array.isArray(extraApprovals) && (isWorkshopOwner || req.user.role === 'ADMIN')) {
			updateData.extraApprovals = extraApprovals
		}
		if (
			typeof extraApprovalIndex === 'number' &&
			['APPROVED', 'DECLINED'].includes(extraApprovalStatus) &&
			booking.customerId.toString() === req.user._id.toString()
		) {
			const extras = Array.isArray(booking.extraApprovals) ? [...booking.extraApprovals.map((e) => e.toObject?.() || e)] : []
			if (extras[extraApprovalIndex]) {
				extras[extraApprovalIndex] = { ...extras[extraApprovalIndex], status: extraApprovalStatus }
				updateData.extraApprovals = extras
			}
		}
		
		if (updateData.status === 'CANCELLED') {
			if (booking.offerId) {
				const Offer = (await import('../models/Offer.js')).default
				await Offer.findByIdAndUpdate(booking.offerId, {
					status: 'CANCELLED',
					cancellationReason: updateData.cancellationReason,
					cancelledBy: updateData.cancelledBy,
					cancelledAt: updateData.cancelledAt
				})
			}
		}

		const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, { new: true })
			.populate('customerId', 'name email phone')
			.populate('workshopId', 'companyName email phone')
			.populate('offerId')
			.populate('requestId')

		if (updateData.status === 'CANCELLED' && booking.requestId) {
			// Revert request to IN_BIDDING
			await Request.findByIdAndUpdate(booking.requestId, { status: 'IN_BIDDING' })
			
			// Actually, if it was cancelled by the workshop, it should stay DECLINED/CANCELLED.
			// But if we want it to be bookable again, we set it to SENT.
			// Given the user's request, let's keep the cancelling workshop's offer as DECLINED
			// and restore all EXPIRED ones to SENT.
			
			// Mark the offer for THIS booking as CANCELLED
			await Offer.findByIdAndUpdate(booking.offerId, { status: 'CANCELLED' })
			
			// Restore all other "EXPIRED" offers back to "SENT"
			await Offer.updateMany(
				{ 
					requestId: booking.requestId, 
					status: 'EXPIRED' 
				},
				{ status: 'SENT' }
			)
		}

		if (updateData.status === 'DONE' && booking.status !== 'DONE') {
			if (booking.requestId) {
				await Request.findByIdAndUpdate(booking.requestId, { status: 'COMPLETED' })
				notifyJobCompleteReviewRequest(updatedBooking).catch(() => {})
			}

		}

		return res.json(updatedBooking)
	} catch (error) {
		console.error('Update booking error:', error)
		return res.status(500).json({ message: 'Failed to update booking' })
	}
})

export default router
