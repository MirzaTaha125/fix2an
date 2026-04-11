import express from 'express'
import Request from '../models/Request.js'
import Workshop from '../models/Workshop.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import Review from '../models/Review.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { expireRequests } from '../utils/expireRequests.js'
import { expireOffers } from '../utils/expireOffers.js'
import { notifyUploadReceived, notifyWorkshopsNewRequest } from '../services/notificationService.js'

const router = express.Router()

// Create a request
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const {
			vehicleId,
			reportIds,
			description,
			latitude,
			longitude,
			address,
			city,
			postalCode,
			country = 'SE',
			expiresAt,
		} = req.body

		if (!vehicleId || !reportIds || !latitude || !longitude || !address || !city || !expiresAt) {
			return res.status(400).json({ message: 'Missing required fields' })
		}

		const request = await Request.create({
			customerId: req.user._id,
			vehicleId,
			reportIds,
			description,
			latitude,
			longitude,
			address,
			city,
			postalCode,
			country,
			expiresAt: new Date(expiresAt),
		})

		const populatedRequest = await Request.findById(request._id)
			.populate('customerId', 'name email')
			.populate('vehicleId')
			.populate('reportIds')
			.populate('reportId')

		// Notifications (fire-and-forget)
		notifyUploadReceived(request.customerId).catch(() => {})
		notifyWorkshopsNewRequest().catch(() => {})

		return res.status(201).json(populatedRequest)
	} catch (error) {
		console.error('Request creation error:', error)
		return res.status(500).json({ message: 'Failed to create request' })
	}
})

// Get requests for a customer
router.get('/customer/:customerId', authenticate, async (req, res) => {
	try {
		const { customerId } = req.params

		// Ensure expired requests and offers are marked before returning results
		await expireRequests()
		await expireOffers()

		const requests = await Request.find({ customerId })
			.populate('vehicleId')
			.populate('reportIds')
			.populate('reportId')
			.populate('customerId', 'name email')
			.sort({ createdAt: -1 })

		// Populate offers and bookings for each request
		const requestsWithOffersAndBookings = await Promise.all(
			requests.map(async (request) => {
				const offers = await Offer.find({ requestId: request._id })
					.populate('workshopId', 'companyName rating reviewCount email phone')
					.sort({ createdAt: -1 })

				const bookings = await Booking.find({ requestId: request._id })
					.populate({
						path: 'workshopId',
						select: 'companyName rating reviewCount email phone userId',
						populate: { path: 'userId', select: 'name' }
					})
					.populate('offerId', '_id id status price')
					.sort({ createdAt: -1 })

				return {
					...request.toObject(),
					offers: offers.map(offer => ({
						id: offer._id,
						_id: offer._id,
						price: offer.price,
						laborCost: offer.laborCost,
						partsCost: offer.partsCost,
						inclusions: offer.inclusions,
						expiresAt: offer.expiresAt,
						note: offer.note,
						status: offer.status,
						workshop: {
							companyName: offer.workshopId?.companyName,
							rating: offer.workshopId?.rating || 0,
							reviewCount: offer.workshopId?.reviewCount || 0,
						},
					})),
					bookings: await Promise.all(bookings.map(async (booking) => {
						const review = await Review.findOne({ bookingId: booking._id })
						return {
							id: booking._id,
							_id: booking._id,
							status: booking.status,
							scheduledAt: booking.scheduledAt,
							totalAmount: booking.totalAmount,
							hasReview: !!review,
							workshop: {
								companyName: booking.workshopId?.companyName,
								rating: booking.workshopId?.rating || 0,
								reviewCount: booking.workshopId?.reviewCount || 0,
							},
							workshopId: booking.workshopId,
						}
					})),
				}
			})
		)

		return res.json(requestsWithOffersAndBookings)
	} catch (error) {
		console.error('Fetch requests error:', error)
		return res.status(500).json({ message: 'Failed to fetch requests' })
	}
})

// Get available requests for workshops
router.get('/available', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		// Ensure expired requests are marked before returning results
		await expireRequests()

		// Find all available requests (no distance filtering)
		const now = new Date()
		
		const requests = await Request.find({
			status: { $in: ['NEW', 'IN_BIDDING'] },
			expiresAt: { $gt: now },
		})
			.populate('vehicleId')
			.populate('reportId')
			.populate('customerId', 'name')
			.sort({ createdAt: -1 })

		// Get offers for each request from this workshop
		const requestsWithOffers = await Promise.all(
			requests.map(async (req) => {
				const Offer = (await import('../models/Offer.js')).default
				const offers = await Offer.find({
					requestId: req._id,
					workshopId: workshop._id,
				})
					.select('_id price status')
					.lean()

				// Convert to plain object and ensure proper structure
				const requestObj = req.toObject ? req.toObject() : req
				
			const result = {
				...requestObj,
				id: requestObj._id,
				_id: requestObj._id,
				vehicle: requestObj.vehicleId,
				customer: requestObj.customerId,
				offers: offers.map((offer) => ({
					id: offer._id,
					price: offer.price,
					status: offer.status,
				})),
			}
			
			return result
		})
	)

	return res.json(requestsWithOffers)
	} catch (error) {
		console.error('Fetch available requests error:', error)
		return res.status(500).json({ message: 'Failed to fetch available requests' })
	}
})

// Update a request
router.patch('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		const updateData = req.body

		const request = await Request.findById(id)
		if (!request) {
			return res.status(404).json({ message: 'Request not found' })
		}

		// Ownership check
		const customerId = request.customerId?._id || request.customerId
		if (customerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		// Status check - only allow edit if NEW or IN_BIDDING
		if (!['NEW', 'IN_BIDDING'].includes(request.status)) {
			return res.status(400).json({ message: 'Cannot edit a request that is already booked, completed, or cancelled' })
		}

		// Update fields
		if (updateData.vehicleId) request.vehicleId = updateData.vehicleId
		if (updateData.description !== undefined) request.description = updateData.description
		if (updateData.latitude) request.latitude = updateData.latitude
		if (updateData.longitude) request.longitude = updateData.longitude
		if (updateData.address) request.address = updateData.address
		if (updateData.city) request.city = updateData.city
		if (updateData.postalCode) request.postalCode = updateData.postalCode
		if (updateData.expiresAt) request.expiresAt = new Date(updateData.expiresAt)

		// Handle status change to CANCELLED
		if (updateData.status === 'CANCELLED') {
			// Safety check: Don't cancel if there are active bookings
			const activeBooking = await Booking.findOne({ 
				requestId: id, 
				status: { $in: ['BOOKED', 'DONE'] } 
			})
			if (activeBooking) {
				return res.status(400).json({ message: 'Cannot cancel a request with active or completed bookings' })
			}

			request.status = 'CANCELLED'
			
			// Also cancel all SENT offers associated with this request
			await Offer.updateMany(
				{ requestId: id, status: 'SENT' },
				{ 
					status: 'CANCELLED',
					cancellationReason: 'Request was cancelled by owner',
					cancelledBy: 'CUSTOMER',
					cancelledAt: new Date()
				}
			)
		}

		await request.save()

		const populatedRequest = await Request.findById(id)
			.populate('customerId', 'name email')
			.populate('vehicleId')
			.populate('reportIds')
			.populate('reportId')

		return res.json(populatedRequest)
	} catch (error) {
		console.error('Update request error:', error)
		return res.status(500).json({ message: 'Failed to update request' })
	}
})

// Delete a request
router.delete('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params

		const request = await Request.findById(id)
		if (!request) {
			return res.status(404).json({ message: 'Request not found' })
		}

		// Ownership check
		const customerId = request.customerId?._id || request.customerId
		if (customerId.toString() !== req.user._id.toString() && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		// Check for active bookings
		const activeBooking = await Booking.findOne({ requestId: id, status: { $in: ['BOOKED', 'DONE'] } })
		if (activeBooking) {
			return res.status(400).json({ message: 'Cannot delete a request with active or completed bookings' })
		}

		// Delete related offers
		await Offer.deleteMany({ requestId: id })

		// Delete the request
		await Request.findByIdAndDelete(id)

		return res.json({ message: 'Request deleted successfully' })
	} catch (error) {
		console.error('Delete request error:', error)
		return res.status(500).json({ message: 'Failed to delete request' })
	}
})

// Get a single request by ID (must be after specific routes like /customer/:customerId)
router.get('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params
		
		const request = await Request.findById(id)
			.populate('vehicleId', 'make model year')
			.populate('customerId', 'name email')
			.populate('reportId')
		
		if (!request) {
			return res.status(404).json({ message: 'Request not found' })
		}
		
		// Admin: always allowed
		if (req.user.role === 'ADMIN') {
			return res.json(request)
		}
		
		// Customer (owner): always allowed
		const customerId = request.customerId?._id || request.customerId
		if (customerId && req.user._id.toString() === customerId.toString()) {
			return res.json(request)
		}
		
		// Workshop: allowed only for NEW/IN_BIDDING requests that are not expired, 
		// OR if they have already submitted an offer for this request.
		if (req.user.role === 'WORKSHOP') {
			const workshop = await Workshop.findOne({ userId: req.user._id })
			if (!workshop) return res.status(403).json({ message: 'Workshop profile not found' })

			const now = new Date()
			const isAvailable = (['NEW', 'IN_BIDDING'].includes(request.status) && request.expiresAt > now)
			
			// If not available, check if this workshop has an existing offer or booking for this request
			if (!isAvailable) {
				const hasOffer = await Offer.findOne({ requestId: id, workshopId: workshop._id })
				const hasBooking = await Booking.findOne({ requestId: id, workshopId: workshop._id })
				
				if (!hasOffer && !hasBooking) {
					return res.status(403).json({ message: 'Request is no longer available for bidding' })
				}
			}
			
			return res.json(request)
		}
		
		return res.status(403).json({ message: 'Forbidden' })
	} catch (error) {
		console.error('Get request error:', error)
		return res.status(500).json({ message: 'Failed to fetch request' })
	}
})

export default router

