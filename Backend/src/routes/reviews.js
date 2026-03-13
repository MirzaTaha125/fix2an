import express from 'express'
import Review from '../models/Review.js'
import Booking from '../models/Booking.js'
import Workshop from '../models/Workshop.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

// Create a review
router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const { bookingId, rating, comment } = req.body

		if (!bookingId || !rating) {
			return res.status(400).json({ message: 'Missing required fields: bookingId and rating are required' })
		}

		if (rating < 1 || rating > 5) {
			return res.status(400).json({ message: 'Rating must be between 1 and 5' })
		}

		// Check if booking exists and belongs to the customer
		const booking = await Booking.findById(bookingId)
		if (!booking) {
			return res.status(404).json({ message: 'Booking not found' })
		}

		if (booking.customerId.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: 'Forbidden: You can only review your own bookings' })
		}

		// Only allow reviews on completed bookings
		if (booking.status !== 'DONE') {
			return res.status(400).json({ message: 'You can only review a booking after it has been marked as done' })
		}

		// Derive workshopId from the booking record — do not trust client-supplied value
		const workshopId = booking.workshopId

		// Check if review already exists for this booking
		const existingReview = await Review.findOne({ bookingId })
		if (existingReview) {
			return res.status(400).json({ message: 'Review already exists for this booking' })
		}

		// Create the review
		const review = await Review.create({
			bookingId,
			customerId: req.user._id,
			workshopId,
			rating,
			comment: comment || '',
		})

		// Recalculate and persist the workshop's aggregate rating
		const allReviews = await Review.find({ workshopId, isPublished: true })
		const reviewCount = allReviews.length
		const avgRating = reviewCount > 0
			? allReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
			: 0

		await Workshop.findByIdAndUpdate(workshopId, {
			rating: Math.round(avgRating * 10) / 10,
			reviewCount,
		})

		const populatedReview = await Review.findById(review._id)
			.populate('customerId', 'name')
			.populate('workshopId', 'companyName')
			.populate('bookingId')

		return res.status(201).json(populatedReview)
	} catch (error) {
		console.error('Create review error:', error)
		if (error.code === 11000) {
			return res.status(400).json({ message: 'Review already exists for this booking' })
		}
		return res.status(500).json({ message: 'Failed to create review' })
	}
})

// Get reviews for a workshop
router.get('/workshop/:workshopId', async (req, res) => {
	try {
		const { workshopId } = req.params
		const reviews = await Review.find({ workshopId, isPublished: true })
			.populate('customerId', 'name')
			.sort({ createdAt: -1 })

		return res.json(reviews)
	} catch (error) {
		console.error('Get reviews error:', error)
		return res.status(500).json({ message: 'Failed to fetch reviews' })
	}
})

// Get review for a booking
router.get('/booking/:bookingId', authenticate, async (req, res) => {
	try {
		const { bookingId } = req.params
		const review = await Review.findOne({ bookingId })
			.populate('customerId', 'name email')
			.populate('workshopId', 'companyName')

		if (!review) {
			return res.status(404).json({ message: 'Review not found' })
		}

		return res.json(review)
	} catch (error) {
		console.error('Get review error:', error)
		return res.status(500).json({ message: 'Failed to fetch review' })
	}
})

export default router

