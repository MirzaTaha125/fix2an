import express from 'express'
import Offer from '../models/Offer.js'
import Request from '../models/Request.js'
import Workshop from '../models/Workshop.js'
import { authenticate, requireRole } from '../middleware/auth.js'
import { notifyNewOffers } from '../services/notificationService.js'

const router = express.Router()

// Create an offer
router.post('/', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const { requestId, price, note, availableDates, estimatedDuration, warranty } = req.body

		if (!requestId || !price) {
			return res.status(400).json({ message: 'Request ID and price are required' })
		}

		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		// FIX #6: Block unverified workshops from submitting offers
		if (!workshop.isVerified) {
			return res.status(403).json({ message: 'Your workshop must be verified by an admin before submitting offers' })
		}

		// Check if request exists and is available
		const request = await Request.findById(requestId)
		if (!request) {
			return res.status(404).json({ message: 'Request not found' })
		}

		if (request.status !== 'NEW' && request.status !== 'IN_BIDDING') {
			return res.status(400).json({ message: 'Request is not available for offers' })
		}

		// Check if offer already exists from this workshop
		const existingOffer = await Offer.findOne({ requestId, workshopId: workshop._id })
		if (existingOffer) {
			return res.status(400).json({ message: 'Offer already exists for this request' })
		}

		const offer = await Offer.create({
			requestId,
			workshopId: workshop._id,
			price: parseFloat(price),
			note,
			availableDates: availableDates ? JSON.stringify(availableDates) : null,
			estimatedDuration,
			warranty,
		})

		// Update request status to IN_BIDDING if it's NEW
		if (request.status === 'NEW') {
			await Request.findByIdAndUpdate(requestId, { status: 'IN_BIDDING' })
		}

		const populatedOffer = await Offer.findById(offer._id)
			.populate('requestId')
			.populate('workshopId')

		// Notify customer about new offer(s)
		const customerId = request.customerId?.toString?.() || request.customerId
		if (customerId) {
			const offerCount = await Offer.countDocuments({ requestId, status: 'SENT' })
			notifyNewOffers(customerId, offerCount).catch(() => {})
		}

		return res.status(201).json(populatedOffer)
	} catch (error) {
		console.error('Offer creation error:', error)
		return res.status(500).json({ message: 'Failed to create offer' })
	}
})

// Get offers for a request
router.get('/request/:requestId', authenticate, async (req, res) => {
	try {
		const { requestId } = req.params

		// Get the request to get customer location
		const request = await Request.findById(requestId)
		if (!request) {
			return res.status(404).json({ message: 'Request not found' })
		}

		// Only the request owner (CUSTOMER) or an ADMIN may view all offers on a request
		if (req.user.role !== 'ADMIN' && req.user._id.toString() !== request.customerId.toString()) {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const offers = await Offer.find({ requestId })
			.populate('workshopId', 'companyName rating reviewCount isVerified latitude longitude address city postalCode phone email openingHours')
			.sort({ createdAt: -1 })

		// Calculate distance for each offer if we have location data
		const offersWithDistance = offers.map((offer) => {
			const offerObj = offer.toObject()
			if (request.latitude && request.longitude && offer.workshopId?.latitude && offer.workshopId?.longitude) {
				offerObj.distance = calculateDistance(
					request.latitude,
					request.longitude,
					offer.workshopId.latitude,
					offer.workshopId.longitude
				)
			}
			return offerObj
		})

		return res.json(offersWithDistance)
	} catch (error) {
		console.error('Fetch offers error:', error)
		return res.status(500).json({ message: 'Failed to fetch offers' })
	}
})

// Update an offer
router.patch('/:id', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const { id } = req.params
		const { price, note, availableDates, estimatedDuration, warranty, status } = req.body

		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		// Whitelist: workshops may only retract/decline their own offer
		const WORKSHOP_ALLOWED_STATUSES = ['DECLINED']
		if (status !== undefined && !WORKSHOP_ALLOWED_STATUSES.includes(status)) {
			return res.status(400).json({
				message: `Invalid status. A workshop may only set status to: ${WORKSHOP_ALLOWED_STATUSES.join(', ')}`,
			})
		}

		// Build update object
		const updateData = {}
		if (price !== undefined) updateData.price = parseFloat(price)
		if (note !== undefined) updateData.note = note
		if (availableDates !== undefined) updateData.availableDates = availableDates ? JSON.stringify(availableDates) : null
		if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration
		if (warranty !== undefined) updateData.warranty = warranty
		if (status !== undefined) updateData.status = status

		// Find and update the offer (only if it belongs to this workshop)
		const offer = await Offer.findOne({ _id: id, workshopId: workshop._id })
		if (!offer) {
			return res.status(404).json({ message: 'Offer not found or you do not have permission to update it' })
		}

		// When workshop declines an ACCEPTED offer, cancel booking and revert request
		if (status === 'DECLINED' && offer.status === 'ACCEPTED') {
			const Booking = (await import('../models/Booking.js')).default
			const Request = (await import('../models/Request.js')).default
			const booking = await Booking.findOne({ offerId: offer._id })
			if (booking) {
				await Booking.findByIdAndUpdate(booking._id, { status: 'CANCELLED' })
				await Request.findByIdAndUpdate(booking.requestId, { status: 'BIDDING_CLOSED' })
			}
		}

		const updatedOffer = await Offer.findOneAndUpdate(
			{ _id: id, workshopId: workshop._id },
			updateData,
			{ new: true }
		)

		const populatedOffer = await Offer.findById(updatedOffer._id)
			.populate('requestId')
			.populate('workshopId')

		return res.json(populatedOffer)
	} catch (error) {
		console.error('Offer update error:', error)
		return res.status(500).json({ message: 'Failed to update offer' })
	}
})

// Get offers by workshop
router.get('/workshop/me', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const offers = await Offer.find({ workshopId: workshop._id })
			.populate({
				path: 'requestId',
				select: 'description status createdAt',
				populate: [
					{ 
						path: 'vehicleId', 
						select: 'make model year' 
					},
					{ 
						path: 'customerId', 
						select: 'name email phone' 
					}
				]
			})
			.sort({ createdAt: -1 })

		return res.json(offers)
	} catch (error) {
		console.error('Fetch workshop offers error:', error)
		return res.status(500).json({ message: 'Failed to fetch offers' })
	}
})

// Get available requests for workshops
router.get('/requests/available', authenticate, requireRole('WORKSHOP'), async (req, res) => {
	try {
		const { latitude, longitude, radius = 30 } = req.query

		// Find workshop for this user
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) {
			return res.status(404).json({ message: 'Workshop not found' })
		}

		const searchLat = parseFloat(latitude) || workshop.latitude
		const searchLng = parseFloat(longitude) || workshop.longitude
		const searchRadius = parseFloat(radius)

		// Find requests within radius
		const requests = await Request.find({
			status: { $in: ['NEW', 'IN_BIDDING'] },
			expiresAt: { $gt: new Date() },
		})
			.populate('vehicleId')
			.populate('reportId')
			.populate('customerId', 'name')
			.sort({ createdAt: -1 })

		// Filter by distance and exclude requests that already have offers from this workshop
		const requestIds = requests.map((r) => r._id)
		const existingOffers = await Offer.find({
			workshopId: workshop._id,
			requestId: { $in: requestIds },
		})

		const existingRequestIds = new Set(existingOffers.map((o) => o.requestId.toString()))

		const filteredRequests = requests
			.filter((req) => {
				const distance = calculateDistance(
					searchLat,
					searchLng,
					req.latitude,
					req.longitude
				)
				return distance <= searchRadius && !existingRequestIds.has(req._id.toString())
			})
			.map((req) => ({
				...req.toObject(),
				distance: calculateDistance(searchLat, searchLng, req.latitude, req.longitude),
			}))

		return res.json(filteredRequests)
	} catch (error) {
		console.error('Fetch available requests error:', error)
		return res.status(500).json({ message: 'Failed to fetch available requests' })
	}
})

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	return R * c
}

export default router

