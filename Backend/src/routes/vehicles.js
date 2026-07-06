import express from 'express'
import Vehicle from '../models/Vehicle.js'
import { authenticate } from '../middleware/auth.js'
import { resolveVehicleImageUrl } from '../utils/wikipediaVehicleImage.js'
import { getCarMakes, getCarModels } from '../utils/carImagesApi.js'

const router = express.Router()

// Public — used on guest upload flow (no auth required)
router.get('/makes', async (_req, res) => {
	try {
		const result = await getCarMakes()
		return res.json(result)
	} catch (error) {
		console.error('Car makes error:', error)
		return res.status(500).json({ message: 'Failed to fetch car brands' })
	}
})

router.get('/makes/:slug/models', async (req, res) => {
	try {
		const result = await getCarModels(req.params.slug)
		return res.json(result)
	} catch (error) {
		console.error('Car models error:', error)
		return res.status(500).json({ message: 'Failed to fetch car models' })
	}
})

// Vehicle photo: Wikipedia first (free, no watermark), then brand logo
router.get('/vehicle-image-url', authenticate, async (req, res) => {
	try {
		const { make, model, year, width } = req.query
		if (!make) {
			return res.status(400).json({ message: 'make is required' })
		}

		const result = await resolveVehicleImageUrl({
			make,
			model,
			year,
			width: width || 500,
		})

		return res.json(result)
	} catch (error) {
		console.error('Vehicle image URL error:', error)
		return res.status(500).json({ message: 'Failed to fetch vehicle image' })
	}
})

// Legacy CarImages endpoint — redirects to Wikipedia resolver
router.get('/car-image-url', authenticate, async (req, res) => {
	try {
		const { make, model, year, width } = req.query
		if (!make) {
			return res.status(400).json({ message: 'make is required' })
		}

		const result = await resolveVehicleImageUrl({
			make,
			model,
			year,
			width: width || 500,
		})

		return res.json({ url: result.url, source: result.source })
	} catch (error) {
		console.error('Car image URL error:', error)
		return res.status(500).json({ message: 'Failed to fetch car image' })
	}
})

// Create a vehicle
router.post('/', authenticate, async (req, res) => {
	try {
		const { make, model, year, makeSlug, modelSlug } = req.body

		const vehiclePayload = {
			make: String(make || '').trim() || '—',
			model: String(model || '').trim() || '—',
			...(makeSlug && { makeSlug }),
			...(modelSlug && { modelSlug }),
		}
		const parsedYear = Number(year)
		if (Number.isFinite(parsedYear) && parsedYear > 0) {
			vehiclePayload.year = parsedYear
		}

		const vehicle = await Vehicle.create(vehiclePayload)
		return res.status(201).json(vehicle)
	} catch (error) {
		console.error('Vehicle creation error:', error)
		return res.status(500).json({ message: 'Failed to create vehicle' })
	}
})

// Get all vehicles
router.get('/', authenticate, async (req, res) => {
	try {
		const vehicles = await Vehicle.find().sort({ createdAt: -1 })
		return res.json(vehicles)
	} catch (error) {
		console.error('Fetch vehicles error:', error)
		return res.status(500).json({ message: 'Failed to fetch vehicles' })
	}
})

export default router

