import express from 'express'
import Request from '../models/Request.js'
import Workshop from '../models/Workshop.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { expireRequests } from '../utils/expireRequests.js'
import { notifyUploadReceived, notifyWorkshopsNewRequest } from '../services/notificationService.js'

const router = express.Router()

// Create a request
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const {
			vehicleId,
			reportId,
			description,
			latitude,
			longitude,
			address,
			city,
			postalCode,
			country = 'SE',
			expiresAt,
		} = req.body

		if (!vehicleId || !reportId || !latitude || !longitude || !address || !city || !expiresAt) {
			return res.status(400).json({ message: 'Missing required fields' })
		}

		const request = await Request.create({
			customerId: req.user._id,
			vehicleId,
			reportId,
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

		// Check if user is accessing their own requests or is admin
		if (req.user._id.toString() !== customerId && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const requests = await Request.find({ customerId })
			.populate('vehicleId')
			.populate('reportId')
			.populate('customerId', 'name email')
			.sort({ createdAt: -1 })

		// Populate offers and bookings for each request
		const requestsWithOffersAndBookings = await Promise.all(
			requests.map(async (request) => {
				const offers = await Offer.find({ requestId: request._id })
					.populate('workshopId', 'companyName rating reviewCount')
					.sort({ createdAt: -1 })

				const bookings = await Booking.find({ requestId: request._id })
					.populate('workshopId', 'companyName rating reviewCount')
					.populate('offerId', '_id id status price')
					.sort({ createdAt: -1 })

				return {
					...request.toObject(),
					offers: offers.map(offer => ({
						id: offer._id,
						_id: offer._id,
						price: offer.price,
						note: offer.note,
						status: offer.status,
						workshop: {
							companyName: offer.workshopId?.companyName,
							rating: offer.workshopId?.rating || 0,
							reviewCount: offer.workshopId?.reviewCount || 0,
						},
					})),
					bookings: bookings.map(booking => ({
						id: booking._id,
						_id: booking._id,
						status: booking.status,
						scheduledAt: booking.scheduledAt,
						totalAmount: booking.totalAmount,
						workshop: {
							companyName: booking.workshopId?.companyName,
							rating: booking.workshopId?.rating || 0,
							reviewCount: booking.workshopId?.reviewCount || 0,
						},
						workshopId: booking.workshopId,
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
		
		// Workshop: allowed only for NEW/IN_BIDDING requests that are not expired
		if (req.user.role === 'WORKSHOP') {
			const now = new Date()
			const isAvailable = ['NEW', 'IN_BIDDING'].includes(request.status) && request.expiresAt > now
			if (!isAvailable) {
				return res.status(403).json({ message: 'Request is not available for viewing' })
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

