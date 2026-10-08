import express from 'express'
import SupportTicket from '../models/SupportTicket.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = express.Router()

function ticketPreview(ticket) {
	const last = ticket.messages?.[ticket.messages.length - 1]
	return {
		id: ticket._id,
		subject: ticket.subject,
		category: ticket.category,
		status: ticket.status,
		customerId: ticket.customerId,
		createdAt: ticket.createdAt,
		updatedAt: ticket.updatedAt,
		lastMessageAt: ticket.lastMessageAt,
		preview: last?.body || '',
		messageCount: ticket.messages?.length || 0,
	}
}

router.get('/mine', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const tickets = await SupportTicket.find({ customerId: req.user._id })
			.sort({ lastMessageAt: -1 })
			.lean()
		res.json(tickets.map(ticketPreview))
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to load tickets' })
	}
})

router.get('/mine/:id', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const ticket = await SupportTicket.findOne({ _id: req.params.id, customerId: req.user._id })
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
		res.json(ticket)
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to load ticket' })
	}
})

router.post('/', authenticate, requireRole('CUSTOMER'), async (req, res) => {
	try {
		const subject = String(req.body.subject || '').trim()
		const body = String(req.body.message || req.body.body || '').trim()
		const category = String(req.body.category || 'general').trim() || 'general'
		if (!subject || !body) {
			return res.status(400).json({ message: 'Subject and message are required' })
		}

		const ticket = await SupportTicket.create({
			customerId: req.user._id,
			subject,
			category,
			status: 'NEW',
			lastMessageAt: new Date(),
			messages: [{
				senderRole: 'CUSTOMER',
				senderId: req.user._id,
				body,
			}],
		})
		res.status(201).json(ticket)
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to create ticket' })
	}
})

router.post('/:id/messages', authenticate, async (req, res) => {
	try {
		const body = String(req.body.message || req.body.body || '').trim()
		if (!body) return res.status(400).json({ message: 'Message is required' })

		const ticket = await SupportTicket.findById(req.params.id)
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' })

		const isCustomer = req.user.role === 'CUSTOMER' && ticket.customerId.toString() === req.user._id.toString()
		const isAdmin = req.user.role === 'ADMIN'
		if (!isCustomer && !isAdmin) return res.status(403).json({ message: 'Forbidden' })

		ticket.messages.push({
			senderRole: isAdmin ? 'ADMIN' : 'CUSTOMER',
			senderId: req.user._id,
			body,
		})
		ticket.lastMessageAt = new Date()
		if (isAdmin) {
			ticket.status = ticket.status === 'CLOSED' ? 'ONGOING' : 'ONGOING'
		} else if (ticket.status === 'ONGOING') {
			ticket.status = 'WAITING'
		} else if (ticket.status === 'CLOSED') {
			ticket.status = 'NEW'
		}
		await ticket.save()
		res.json(ticket)
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to send message' })
	}
})

router.get('/admin', authenticate, requireRole('ADMIN'), async (req, res) => {
	try {
		const status = String(req.query.status || '').toUpperCase()
		const filter = status && status !== 'ALL' ? { status } : {}
		const tickets = await SupportTicket.find(filter)
			.populate('customerId', 'name email phone')
			.sort({ lastMessageAt: -1 })
			.lean()
		res.json(tickets.map((ticket) => ({
			...ticketPreview(ticket),
			customer: ticket.customerId
				? {
					id: ticket.customerId._id,
					name: ticket.customerId.name,
					email: ticket.customerId.email,
					phone: ticket.customerId.phone,
				}
				: null,
		})))
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to load support tickets' })
	}
})

router.get('/admin/:id', authenticate, requireRole('ADMIN'), async (req, res) => {
	try {
		const ticket = await SupportTicket.findById(req.params.id)
			.populate('customerId', 'name email phone')
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
		res.json(ticket)
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to load ticket' })
	}
})

router.patch('/admin/:id/status', authenticate, requireRole('ADMIN'), async (req, res) => {
	try {
		const status = String(req.body.status || '').toUpperCase()
		if (!['NEW', 'ONGOING', 'WAITING', 'CLOSED'].includes(status)) {
			return res.status(400).json({ message: 'Invalid status' })
		}
		const ticket = await SupportTicket.findByIdAndUpdate(
			req.params.id,
			{ status },
			{ new: true },
		).populate('customerId', 'name email phone')
		if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
		res.json(ticket)
	} catch (error) {
		res.status(500).json({ message: error.message || 'Failed to update status' })
	}
})

export default router
