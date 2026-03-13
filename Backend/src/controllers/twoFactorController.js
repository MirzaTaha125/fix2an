import speakeasy from 'speakeasy'
import QRCode from 'qrcode'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET
const APP_NAME = process.env.APP_NAME || 'Fixa2an'

/** Admin only: get 2FA setup (QR + secret) */
export const get2FASetup = async (req, res) => {
	try {
		if (req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: '2FA is only available for administrators' })
		}

		const user = await User.findById(req.user._id)
		if (!user) return res.status(404).json({ message: 'User not found' })
		if (user.twoFactorEnabled) {
			return res.status(400).json({ message: '2FA is already enabled' })
		}

		const secret = speakeasy.generateSecret({
			name: `${APP_NAME} (${user.email})`,
			length: 20,
		})

		user.twoFactorSecret = secret.base32
		await user.save({ validateBeforeSave: false })

		const otpauthUrl = speakeasy.otpauthURL({
			secret: secret.base32,
			label: user.email,
			issuer: APP_NAME,
			encoding: 'base32',
		})
		const qrDataUrl = await QRCode.toDataURL(otpauthUrl)

		return res.json({
			secret: secret.base32,
			qrCode: qrDataUrl,
		})
	} catch (error) {
		console.error('2FA setup error:', error)
		return res.status(500).json({ message: 'Failed to generate 2FA setup' })
	}
}

/** Admin only: verify TOTP and enable 2FA */
export const verify2FASetup = async (req, res) => {
	try {
		if (req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: '2FA is only available for administrators' })
		}

		const { code } = req.body
		if (!code || !/^\d{6}$/.test(code)) {
			return res.status(400).json({ message: 'Valid 6-digit code is required' })
		}

		const user = await User.findById(req.user._id)
		if (!user) return res.status(404).json({ message: 'User not found' })
		if (!user.twoFactorSecret) {
			return res.status(400).json({ message: 'Start 2FA setup first' })
		}
		if (user.twoFactorEnabled) {
			return res.status(400).json({ message: '2FA is already enabled' })
		}

		const valid = speakeasy.totp.verify({
			secret: user.twoFactorSecret,
			encoding: 'base32',
			token: code,
			window: 1,
		})

		if (!valid) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		user.twoFactorEnabled = true
		await user.save()

		return res.json({ message: '2FA enabled successfully', twoFactorEnabled: true })
	} catch (error) {
		console.error('2FA verify setup error:', error)
		return res.status(500).json({ message: 'Failed to verify 2FA' })
	}
}

/** Admin only: disable 2FA (requires password + TOTP) */
export const disable2FA = async (req, res) => {
	try {
		if (req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: '2FA is only available for administrators' })
		}

		const { password, code } = req.body
		if (!password || !code || !/^\d{6}$/.test(code)) {
			return res.status(400).json({ message: 'Password and valid 6-digit code are required' })
		}

		const user = await User.findById(req.user._id)
		if (!user) return res.status(404).json({ message: 'User not found' })
		if (!user.twoFactorEnabled) {
			return res.status(400).json({ message: '2FA is not enabled' })
		}

		const passwordValid = await bcrypt.compare(password, user.password)
		if (!passwordValid) {
			return res.status(401).json({ message: 'Invalid password' })
		}

		const valid = speakeasy.totp.verify({
			secret: user.twoFactorSecret,
			encoding: 'base32',
			token: code,
			window: 1,
		})

		if (!valid) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		user.twoFactorEnabled = false
		user.twoFactorSecret = undefined
		await user.save()

		return res.json({ message: '2FA disabled successfully', twoFactorEnabled: false })
	} catch (error) {
		console.error('2FA disable error:', error)
		return res.status(500).json({ message: 'Failed to disable 2FA' })
	}
}

/** Get 2FA status (admin only) */
export const get2FAStatus = async (req, res) => {
	try {
		if (req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: '2FA is only available for administrators' })
		}

		const user = await User.findById(req.user._id).select('twoFactorEnabled')
		return res.json({ twoFactorEnabled: !!user?.twoFactorEnabled })
	} catch (error) {
		console.error('2FA status error:', error)
		return res.status(500).json({ message: 'Failed to get 2FA status' })
	}
}

/** Verify TOTP at login (uses tempToken from login) */
export const verify2FALogin = async (req, res) => {
	try {
		const { tempToken, code } = req.body
		if (!tempToken || !code || !/^\d{6}$/.test(code)) {
			return res.status(400).json({ message: 'Temp token and valid 6-digit code are required' })
		}

		let decoded
		try {
			decoded = jwt.verify(tempToken, JWT_SECRET)
		} catch {
			return res.status(401).json({ message: 'Session expired. Please log in again.' })
		}

		if (decoded.purpose !== '2fa_pending' || !decoded.userId) {
			return res.status(401).json({ message: 'Invalid token' })
		}

		const user = await User.findById(decoded.userId)
		if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
			return res.status(401).json({ message: '2FA verification failed' })
		}

		const valid = speakeasy.totp.verify({
			secret: user.twoFactorSecret,
			encoding: 'base32',
			token: code,
			window: 1,
		})

		if (!valid) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		if (!user.isActive) {
			return res.status(403).json({ message: 'Your account is inactive.' })
		}

		const token = jwt.sign(
			{ userId: user._id, role: user.role },
			JWT_SECRET,
			{ expiresIn: '7d' }
		)

		return res.json({
			token,
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
				role: user.role,
			},
		})
	} catch (error) {
		console.error('2FA verify login error:', error)
		return res.status(500).json({ message: 'Something went wrong. Please try again.' })
	}
}
