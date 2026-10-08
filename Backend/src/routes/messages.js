import express from 'express'
import Message from '../models/Message.js'
import Request from '../models/Request.js'
import Offer from '../models/Offer.js'
import Booking from '../models/Booking.js'
import Workshop from '../models/Workshop.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

async function loadConversation(user, requestId, workshopId) {
	const request = await Request.findById(requestId)
	if (!request) {
		const error = new Error('Request not found')
		error.status = 404
		throw error
	}

	const offer = await Offer.findOne({ requestId, workshopId }).populate({
		path: 'workshopId',
		select: 'companyName phone userId',
		populate: { path: 'userId', select: 'image' },
	})

	if (user.role === 'CUSTOMER') {
		if (request.customerId.toString() !== user._id.toString()) {
			const error = new Error('Forbidden')
			error.status = 403
			throw error
		}
		// Customer may message a workshop from the directory on any non-cancelled case.
		const status = String(request.status || '').toUpperCase()
		if (status === 'CANCELLED' && !offer) {
			const hasMessages = await Message.exists({ requestId, workshopId })
			if (!hasMessages) {
				const error = new Error('No conversation for this workshop')
				error.status = 404
				throw error
			}
		}
		return { request, offer, role: 'CUSTOMER' }
	}

	if (user.role === 'WORKSHOP') {
		const workshop = await Workshop.findOne({ userId: user._id })
		if (!workshop || workshop._id.toString() !== String(workshopId)) {
			const error = new Error('Forbidden')
			error.status = 403
			throw error
		}

		// Allow chat before a quote when the case is still open for this workshop,
		// or when they already have a booking on the case.
		if (!offer) {
			const now = new Date()
			const isAvailable = ['NEW', 'IN_BIDDING'].includes(request.status) && request.expiresAt > now
			const hasBooking = await Booking.findOne({ requestId, workshopId: workshop._id }).select('_id')
			if (!isAvailable && !hasBooking) {
				const error = new Error('No conversation for this workshop')
				error.status = 404
				throw error
			}
		}

		return { request, offer, role: 'WORKSHOP', workshop }
	}

	const error = new Error('Forbidden')
	error.status = 403
	throw error
}

function isImageAttachment(file) {
	return Boolean(
		file?.mimeType?.startsWith('image/') ||
		/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file?.fileName || file?.fileUrl || '')
	)
}

function looksLikeImageFileName(text) {
	const value = String(text || '').trim()
	if (!value) return false
	return /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(value) || /^chatgpt image\b/i.test(value)
}

function previewText(message, offer) {
	const attachments = Array.isArray(message?.attachments) ? message.attachments : []
	const body = String(message?.body || '').trim()
	const bodyIsFileName = Boolean(body && attachments.some((file) => file?.fileName === body))

	if (attachments.some(isImageAttachment) || looksLikeImageFileName(body)) {
		return '__IMAGE__'
	}
	if (attachments.length && (!body || bodyIsFileName)) {
		return '__FILE__'
	}
	if (body) return body
	return offer?.note || ''
}

router.get('/workshop', authenticate, async (req, res) => {
	try {
		if (req.user.role !== 'WORKSHOP') {
			return res.status(403).json({ message: 'Forbidden' })
		}
		const workshop = await Workshop.findOne({ userId: req.user._id })
		if (!workshop) return res.status(404).json({ message: 'Workshop not found' })

		const offers = await Offer.find({ workshopId: workshop._id })
			.populate({ path: 'requestId', select: 'customerId', populate: { path: 'customerId', select: 'name image' } })
			.sort({ updatedAt: -1 })

		const byRequest = new Map()
		for (const offer of offers) {
			const request = offer.requestId
			const requestId = request?._id || request
			if (!requestId) continue
			byRequest.set(String(requestId), {
				offerId: offer._id,
				requestId,
				name: request?.customerId?.name || '',
				image: request?.customerId?.image || '',
				fallbackAt: offer.updatedAt || offer.createdAt,
			})
		}

		const messageRequestIds = await Message.distinct('requestId', { workshopId: workshop._id })
		for (const requestId of messageRequestIds) {
			const key = String(requestId)
			if (!byRequest.has(key)) {
				byRequest.set(key, {
					offerId: null,
					requestId,
					name: '',
					image: '',
					fallbackAt: null,
				})
			}
		}

		const rows = await Promise.all([...byRequest.values()].map(async (row) => {
			const request = row.name
				? null
				: await Request.findById(row.requestId).populate({ path: 'customerId', select: 'name image' })
			const [lastMessage, unreadCount] = await Promise.all([
				Message.findOne({ requestId: row.requestId, workshopId: workshop._id }).sort({ createdAt: -1 }),
				Message.countDocuments({
					requestId: row.requestId,
					workshopId: workshop._id,
					senderRole: 'CUSTOMER',
					readAt: null,
				}),
			])
			return {
				offerId: row.offerId,
				requestId: row.requestId,
				name: row.name || request?.customerId?.name || '',
				image: row.image || request?.customerId?.image || '',
				lastMessageAt: lastMessage?.createdAt || row.fallbackAt,
				unreadCount,
				preview: previewText(lastMessage),
				senderRole: lastMessage?.senderRole || null,
			}
		}))

		rows.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
		return res.json({ conversations: rows })
	} catch (error) {
		console.error('Workshop inbox error:', error)
		return res.status(500).json({ message: 'Failed to load messages' })
	}
})

router.get('/customer', authenticate, async (req, res) => {
	try {
		if (req.user.role !== 'CUSTOMER') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const requests = await Request.find({ customerId: req.user._id }).select('_id')
		const requestIds = requests.map((row) => row._id)
		const offers = await Offer.find({ requestId: { $in: requestIds } })
			.populate({
				path: 'workshopId',
				select: 'companyName userId',
				populate: { path: 'userId', select: 'image' },
			})
			.sort({ updatedAt: -1 })

		// One inbox row per workshop (latest thread across all of the customer's cases).
		const byWorkshop = new Map()
		for (const offer of offers) {
			const requestId = offer.requestId?._id || offer.requestId
			const workshopId = offer.workshopId?._id || offer.workshopId
			if (!requestId || !workshopId) continue
			const key = String(workshopId)
			const fallbackAt = offer.updatedAt || offer.createdAt
			const existing = byWorkshop.get(key)
			if (!existing || new Date(fallbackAt || 0) > new Date(existing.fallbackAt || 0)) {
				byWorkshop.set(key, {
					offerId: offer._id,
					requestId,
					workshopId,
					name: offer.workshopId?.companyName || '',
					logo: offer.workshopId?.userId?.image || '',
					fallbackAt,
				})
			}
		}

		// Also include workshops that messaged before sending a quote.
		const messagePairs = await Message.aggregate([
			{ $match: { requestId: { $in: requestIds } } },
			{ $group: { _id: '$workshopId', lastMessageAt: { $max: '$createdAt' }, requestId: { $last: '$requestId' } } },
		])
		for (const pair of messagePairs) {
			const workshopId = pair._id
			const key = String(workshopId)
			if (!byWorkshop.has(key)) {
				byWorkshop.set(key, {
					offerId: null,
					requestId: pair.requestId,
					workshopId,
					name: '',
					logo: '',
					fallbackAt: pair.lastMessageAt,
				})
			}
		}

		const rows = await Promise.all([...byWorkshop.values()].map(async (row) => {
			const workshop = await Workshop.findById(row.workshopId)
				.select('companyName userId')
				.populate({ path: 'userId', select: 'image' })
			const [lastMessage, unreadCount] = await Promise.all([
				Message.findOne({ requestId: { $in: requestIds }, workshopId: row.workshopId }).sort({ createdAt: -1 }),
				Message.countDocuments({
					requestId: { $in: requestIds },
					workshopId: row.workshopId,
					senderRole: 'WORKSHOP',
					readAt: null,
				}),
			])
			const activeRequestId = lastMessage?.requestId || row.requestId
			return {
				offerId: row.offerId,
				requestId: activeRequestId,
				workshopId: row.workshopId,
				name: row.name || workshop?.companyName || '',
				logo: row.logo || workshop?.userId?.image || '',
				lastMessageAt: lastMessage?.createdAt || row.fallbackAt,
				unreadCount,
				preview: previewText(lastMessage),
				senderRole: lastMessage?.senderRole || null,
			}
		}))

		rows.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
		return res.json({ conversations: rows })
	} catch (error) {
		console.error('Customer inbox error:', error)
		return res.status(500).json({ message: 'Failed to load messages' })
	}
})

router.get('/request/:requestId', authenticate, async (req, res) => {
	try {
		const { requestId } = req.params
		const request = await Request.findById(requestId)
		if (!request) return res.status(404).json({ message: 'Request not found' })

		let offerFilter = { requestId }
		let viewerRole = req.user.role

		if (req.user.role === 'CUSTOMER') {
			if (request.customerId.toString() !== req.user._id.toString()) {
				return res.status(403).json({ message: 'Forbidden' })
			}
		} else if (req.user.role === 'WORKSHOP') {
			const workshop = await Workshop.findOne({ userId: req.user._id })
			if (!workshop) return res.status(404).json({ message: 'Workshop not found' })
			offerFilter.workshopId = workshop._id
			viewerRole = 'WORKSHOP'
		} else {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const offers = await Offer.find(offerFilter)
			.populate({
				path: 'workshopId',
				select: 'companyName phone userId',
				populate: { path: 'userId', select: 'image' },
			})
			.sort({ createdAt: -1 })

		const byWorkshop = new Map()
		for (const offer of offers) {
			const workshopId = String(offer.workshopId?._id || offer.workshopId || '')
			if (!workshopId) continue
			byWorkshop.set(workshopId, {
				workshopId,
				offerId: offer._id,
				name: offer.workshopId?.companyName || '',
				logo: offer.workshopId?.userId?.image || '',
				phone: offer.workshopId?.phone || '',
				fallbackAt: offer.createdAt,
				offer,
			})
		}

		if (viewerRole === 'CUSTOMER') {
			const messageWorkshopIds = await Message.distinct('workshopId', { requestId })
			for (const workshopId of messageWorkshopIds) {
				const key = String(workshopId)
				if (!byWorkshop.has(key)) {
					byWorkshop.set(key, {
						workshopId: key,
						offerId: null,
						name: '',
						logo: '',
						phone: '',
						fallbackAt: null,
						offer: null,
					})
				}
			}
		} else if (viewerRole === 'WORKSHOP') {
			const workshop = await Workshop.findOne({ userId: req.user._id }).select('_id')
			if (workshop) {
				const key = String(workshop._id)
				const hasMessages = await Message.exists({ requestId, workshopId: workshop._id })
				if (hasMessages && !byWorkshop.has(key)) {
					byWorkshop.set(key, {
						workshopId: key,
						offerId: null,
						name: '',
						logo: '',
						phone: '',
						fallbackAt: null,
						offer: null,
					})
				}
			}
		}

		const conversations = await Promise.all([...byWorkshop.values()].map(async (row) => {
			const workshop = row.name
				? null
				: await Workshop.findById(row.workshopId)
					.select('companyName phone userId')
					.populate({ path: 'userId', select: 'image' })
			const [lastMessage, unreadCount] = await Promise.all([
				Message.findOne({ requestId, workshopId: row.workshopId }).sort({ createdAt: -1 }),
				Message.countDocuments({
					requestId,
					workshopId: row.workshopId,
					senderRole: viewerRole === 'CUSTOMER' ? 'WORKSHOP' : 'CUSTOMER',
					readAt: null,
				}),
			])

			return {
				workshopId: row.workshopId,
				offerId: row.offerId,
				name: row.name || workshop?.companyName || '',
				logo: row.logo || workshop?.userId?.image || '',
				phone: row.phone || workshop?.phone || '',
				preview: previewText(lastMessage, row.offer),
				lastMessageAt: lastMessage?.createdAt || row.fallbackAt,
				senderRole: lastMessage?.senderRole || null,
				unreadCount,
			}
		}))

		conversations.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
		return res.json({ conversations })
	} catch (error) {
		console.error('List messages error:', error)
		return res.status(error.status || 500).json({ message: error.message || 'Failed to load messages' })
	}
})

router.get('/request/:requestId/workshop/:workshopId', authenticate, async (req, res) => {
	try {
		const { requestId, workshopId } = req.params
		const { role } = await loadConversation(req.user, requestId, workshopId)
		const incomingRole = role === 'CUSTOMER' ? 'WORKSHOP' : 'CUSTOMER'

		await Message.updateMany(
			{ requestId, workshopId, senderRole: incomingRole, readAt: null },
			{ $set: { readAt: new Date() } }
		)

		const messages = await Message.find({ requestId, workshopId }).sort({ createdAt: 1 })
		return res.json({ messages })
	} catch (error) {
		console.error('Get thread error:', error)
		return res.status(error.status || 500).json({ message: error.message || 'Failed to load conversation' })
	}
})

router.post('/', authenticate, async (req, res) => {
	try {
		const requestId = req.body?.requestId
		const workshopId = req.body?.workshopId
		const body = String(req.body?.body || '').trim()
		const rawAttachments = Array.isArray(req.body?.attachments) ? req.body.attachments : []
		const attachments = rawAttachments
			.map((item) => ({
				fileName: String(item?.fileName || '').trim(),
				fileUrl: String(item?.fileUrl || '').trim(),
				fileSize: Number(item?.fileSize) || 0,
				mimeType: String(item?.mimeType || '').trim(),
			}))
			.filter((item) => item.fileName && item.fileUrl)
			.slice(0, 5)

		if (!requestId || !workshopId || (!body && attachments.length === 0)) {
			return res.status(400).json({ message: 'Request, workshop and message are required' })
		}
		if (body.length > 1000) {
			return res.status(400).json({ message: 'Message is too long' })
		}

		const { request, role } = await loadConversation(req.user, requestId, workshopId)
		const message = await Message.create({
			requestId,
			workshopId,
			customerId: request.customerId,
			senderRole: role,
			body: body || (attachments.length ? attachments[0].fileName : ''),
			attachments,
		})

		return res.status(201).json({ message })
	} catch (error) {
		console.error('Send message error:', error)
		return res.status(error.status || 500).json({ message: error.message || 'Failed to send message' })
	}
})

export default router
