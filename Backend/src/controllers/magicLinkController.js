import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Vehicle from '../models/Vehicle.js'
import Request from '../models/Request.js'
import PendingGuestRequest from '../models/PendingGuestRequest.js'
import PendingMagicLogin from '../models/PendingMagicLogin.js'
import { sendEmail, emailTemplates, isEmailConfigured } from '../config/email.js'
import { notifyUploadReceived, notifyWorkshopsNewRequest } from '../services/notificationService.js'

const JWT_SECRET = process.env.JWT_SECRET
const DEFAULT_FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '')

function resolveFrontendUrl(req) {
	const candidates = [
		req.body?.frontendUrl,
		req.headers.origin,
	].filter(Boolean)

	for (const candidate of candidates) {
		try {
			const url = new URL(candidate)
			if (url.protocol !== 'http:' && url.protocol !== 'https:') continue

			if (process.env.NODE_ENV !== 'production') {
				if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
					return url.origin.replace(/\/$/, '')
				}
			}

			if (url.origin.replace(/\/$/, '') === DEFAULT_FRONTEND_URL) {
				return DEFAULT_FRONTEND_URL
			}
		} catch {
			// ignore invalid URLs
		}
	}

	return DEFAULT_FRONTEND_URL
}

function normalizeEmail(email) {
	return email.trim().toLowerCase()
}

function buildAuthResponse(user) {
	const token = jwt.sign(
		{ userId: user._id, role: user.role },
		JWT_SECRET,
		{ expiresIn: '7d' }
	)

	return {
		token,
		user: {
			id: user._id,
			_id: user._id,
			email: user.email,
			name: user.name || '',
			phone: user.phone || '',
			address: user.address || '',
			city: user.city || '',
			postalCode: user.postalCode || '',
			role: user.role,
			isVerified: true,
		},
	}
}

async function findOrCreateGuestCustomer(email) {
	const existing = await User.findOne({
		email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
	})

	if (existing) {
		if (existing.role !== 'CUSTOMER') {
			const err = new Error('This email is registered with a different account type. Please sign in or use another email.')
			err.status = 400
			throw err
		}
		if (!existing.isActive) {
			const err = new Error('Your account is inactive. Please contact support.')
			err.status = 403
			throw err
		}
		if (existing.password) {
			const err = new Error('An account with this email already exists. Please sign in with your password instead.')
			err.status = 409
			err.code = 'ACCOUNT_EXISTS'
			throw err
		}
		if (!existing.emailVerified) {
			existing.emailVerified = new Date()
			await existing.save()
		}
		return existing
	}

	return User.create({
		email,
		role: 'CUSTOMER',
		emailVerified: new Date(),
		isActive: true,
	})
}

async function createRequestForUser(user, requestData) {
	const { vehicle, reportIds = [], description, registrationNumber, latitude, longitude, address, city, postalCode, country, expiresAt } = requestData

	const createdVehicle = await Vehicle.create({
		make: String(vehicle?.make || '').trim() || '—',
		model: String(vehicle?.model || '').trim() || '—',
		year: vehicle?.year || new Date().getFullYear(),
		...(vehicle?.makeSlug && { makeSlug: vehicle.makeSlug }),
		...(vehicle?.modelSlug && { modelSlug: vehicle.modelSlug }),
	})

	const request = await Request.create({
		customerId: user._id,
		vehicleId: createdVehicle._id,
		reportIds: Array.isArray(reportIds) ? reportIds : [],
		description: description.trim(),
		registrationNumber: registrationNumber || '',
		latitude,
		longitude,
		address,
		city,
		postalCode: postalCode || '',
		country: country || 'SE',
		expiresAt: new Date(expiresAt),
	})

	if (user.postalCode !== postalCode || user.city !== city) {
		user.postalCode = postalCode || user.postalCode
		user.city = city || user.city
		user.latitude = latitude
		user.longitude = longitude
		if (address) user.address = address
		await user.save()
	}

	notifyUploadReceived(user._id).catch(() => {})
	notifyWorkshopsNewRequest().catch(() => {})

	return request
}

async function sendMagicLinkEmail(req, res, normalizedEmail, magicLinkUrl, cleanup) {
	if (!(await isEmailConfigured())) {
		await cleanup()
		return res.status(503).json({
			message: 'Email is not configured. Please try again later.',
		})
	}

	try {
		await sendEmail(normalizedEmail, emailTemplates.magicLinkLogin(magicLinkUrl))
	} catch (emailError) {
		console.error('Failed to send magic link email:', emailError)

		const allowDevLink =
			process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEV_MAGIC_LINK === 'true'

		if (allowDevLink) {
			console.log('[Magic Link] Email failed — dev link:', magicLinkUrl)
			return res.json({
				message: 'Magic link ready (email could not be sent)',
				email: normalizedEmail,
				emailSent: false,
				magicLinkUrl,
			})
		}

		await cleanup()
		return res.status(503).json({
			message: 'Could not send email. Please try again later.',
		})
	}

	return res.json({
		message: 'Magic link sent',
		email: normalizedEmail,
		emailSent: true,
	})
}

export const sendLoginMagicLink = async (req, res) => {
	try {
		const { email } = req.body

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'A valid email address is required' })
		}

		const normalizedEmail = normalizeEmail(email)
		const user = await User.findOne({
			email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
		})

		if (!user) {
			return res.status(404).json({
				message: 'No account found with this email. Please register first.',
			})
		}

		if (user.role !== 'CUSTOMER') {
			return res.status(400).json({
				message: 'Magic link login is only available for customer accounts. Please sign in with your password.',
			})
		}

		if (!user.isActive) {
			return res.status(403).json({
				message: 'Your account is inactive. Please contact support.',
			})
		}

		const token = crypto.randomBytes(32).toString('hex')
		const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

		await PendingMagicLogin.deleteMany({ email: normalizedEmail })
		await PendingMagicLogin.create({ email: normalizedEmail, token, expiresAt })

		const magicLinkUrl = `${resolveFrontendUrl(req)}/auth/magic-link?token=${token}`

		return sendMagicLinkEmail(
			req,
			res,
			normalizedEmail,
			magicLinkUrl,
			() => PendingMagicLogin.deleteMany({ email: normalizedEmail })
		)
	} catch (error) {
		console.error('Send login magic link error:', error)
		return res.status(500).json({ message: 'Something went wrong. Please try again.' })
	}
}

export const sendMagicLink = async (req, res) => {
	try {
		const { email, requestData } = req.body

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return res.status(400).json({ message: 'A valid email address is required' })
		}

		const trimmedRegistration = typeof requestData.registrationNumber === 'string'
			? requestData.registrationNumber.trim()
			: ''
		if (!trimmedRegistration) {
			return res.status(400).json({ message: 'Registration number is required' })
		}

		const trimmedDescription = typeof requestData.description === 'string' ? requestData.description.trim() : ''
		if (!trimmedDescription) {
			return res.status(400).json({ message: 'Description is required' })
		}

		if (
			requestData.latitude == null ||
			requestData.longitude == null ||
			!requestData.address ||
			!requestData.city ||
			!requestData.expiresAt
		) {
			return res.status(400).json({ message: 'Location and expiry information is required' })
		}

		const normalizedEmail = normalizeEmail(email)

		const existingUser = await User.findOne({
			email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
		})

		if (existingUser && existingUser.role !== 'CUSTOMER') {
			return res.status(400).json({
				message: 'This email is registered with a different account type. Please sign in or use another email.',
			})
		}

		if (existingUser?.password) {
			return res.status(409).json({
				message: 'An account with this email already exists. Please sign in with your password instead.',
				requiresSignIn: true,
			})
		}

		const token = crypto.randomBytes(32).toString('hex')
		const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

		await PendingGuestRequest.deleteMany({ email: normalizedEmail })

		await PendingGuestRequest.create({
			email: normalizedEmail,
			token,
			expiresAt,
			requestData: {
				reportIds: Array.isArray(requestData.reportIds) ? requestData.reportIds : [],
				description: trimmedDescription,
				registrationNumber: trimmedRegistration,
				latitude: requestData.latitude,
				longitude: requestData.longitude,
				address: requestData.address,
				city: requestData.city,
				postalCode: requestData.postalCode || '',
				country: requestData.country || 'SE',
				expiresAt: new Date(requestData.expiresAt),
				vehicle: requestData.vehicle,
			},
		})

		const magicLinkUrl = `${resolveFrontendUrl(req)}/auth/magic-link?token=${token}`

		return sendMagicLinkEmail(
			req,
			res,
			normalizedEmail,
			magicLinkUrl,
			() => PendingGuestRequest.deleteMany({ email: normalizedEmail })
		)
	} catch (error) {
		console.error('Send magic link error:', error)
		return res.status(500).json({ message: 'Something went wrong. Please try again.' })
	}
}

export const verifyMagicLink = async (req, res) => {
	try {
		const token = (req.query.token || req.body.token || '').trim()

		if (!token) {
			return res.status(400).json({ message: 'Token is required' })
		}

		const pendingLogin = await PendingMagicLogin.findOne({ token })

		if (pendingLogin) {
			if (new Date() > new Date(pendingLogin.expiresAt)) {
				await PendingMagicLogin.findByIdAndDelete(pendingLogin._id)
				return res.status(400).json({ message: 'This link has expired. Please request a new one.' })
			}

			const user = await User.findOne({
				email: { $regex: new RegExp(`^${pendingLogin.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
			})

			if (!user || user.role !== 'CUSTOMER' || !user.isActive) {
				await PendingMagicLogin.findByIdAndDelete(pendingLogin._id)
				return res.status(400).json({ message: 'Invalid or expired link' })
			}

			if (!user.emailVerified) {
				user.emailVerified = new Date()
				await user.save()
			}

			await PendingMagicLogin.findByIdAndDelete(pendingLogin._id)

			return res.json({
				message: 'Login successful',
				redirectTo: '/dashboard',
				...buildAuthResponse(user),
			})
		}

		const pending = await PendingGuestRequest.findOne({ token })

		if (!pending) {
			return res.status(400).json({ message: 'Invalid or expired link' })
		}

		if (new Date() > new Date(pending.expiresAt)) {
			await PendingGuestRequest.findByIdAndDelete(pending._id)
			return res.status(400).json({ message: 'This link has expired. Please request a new one.' })
		}

		const user = await findOrCreateGuestCustomer(pending.email)
		await createRequestForUser(user, pending.requestData)
		await PendingGuestRequest.findByIdAndDelete(pending._id)

		return res.json({
			message: 'Login successful',
			redirectTo: '/contract',
			...buildAuthResponse(user),
		})
	} catch (error) {
		console.error('Verify magic link error:', error)
		const status = error.status || 500
		return res.status(status).json({
			message: error.message || 'Something went wrong. Please try again.',
			...(error.code === 'ACCOUNT_EXISTS' ? { requiresSignIn: true } : {}),
		})
	}
}
