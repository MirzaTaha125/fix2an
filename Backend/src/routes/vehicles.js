import express from 'express'
import Vehicle from '../models/Vehicle.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Create a vehicle
router.post('/', authenticate, async (req, res) => {
	try {
		const { make, model, year } = req.body

		if (!make || !model || !year) {
			return res.status(400).json({ message: 'Make, model, and year are required' })
		}

		const vehicle = await Vehicle.create({ make, model, year })
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

