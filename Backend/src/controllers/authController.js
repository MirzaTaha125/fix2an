import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import PendingRegistration from '../models/PendingRegistration.js'
import { sendEmail, emailTemplates, isEmailConfigured } from '../config/email.js'

const JWT_SECRET = process.env.JWT_SECRET

/** Register: save to PendingRegistration only, send code. User created only after verify. */
export const register = async (req, res) => {
	try {
		const { name, email, password, phone, address, city, postalCode } = req.body

		const errors = {}
		if (!email) errors.email = 'Email is required'
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format'
		if (!password) errors.password = 'Password is required'
		else if (password.length < 8) errors.password = 'Password must be at least 8 characters long'
		if (name && name.trim().length === 0) errors.name = 'Name cannot be empty'

		if (Object.keys(errors).length > 0) {
			return res.status(400).json({ message: 'Validation failed', errors })
		}

		const normalizedEmail = email.trim().toLowerCase()
		const existingUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })
		if (existingUser) {
			return res.status(400).json({
				message: 'A user with this email address already exists',
				errors: { email: 'A user with this email address already exists' },
			})
		}

		const code = String(Math.floor(100000 + Math.random() * 900000))
		const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

		// Delete any old pending for this email
		await PendingRegistration.deleteMany({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })

		await PendingRegistration.create({
			email: normalizedEmail,
			password,
			name: name || '',
			phone: phone || '',
			address: address || '',
			city: city || '',
			postalCode: postalCode || '',
			code,
			codeExpires: expiresAt,
		})

		if (await isEmailConfigured()) {
			try {
				await sendEmail(normalizedEmail, emailTemplates.emailVerificationCode(code))
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError)
			}
		}

		return res.status(201).json({ message: 'Verification code sent', email: normalizedEmail })
	} catch (error) {
		console.error('Registration error:', error)
		return res.status(500).json({ message: 'Something went wrong with the registration' })
	}
}

/** Verify code: create User only after code is verified */
export const verifyEmailCode = async (req, res) => {
	try {
		const { email, code } = req.body
		if (!email || !code || !/^\d{6}$/.test(String(code).trim())) {
			return res.status(400).json({ message: 'Email and 6-digit code are required' })
		}

		const normalizedEmail = email.trim().toLowerCase()
		const pending = await PendingRegistration.findOne({
			email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
		})

		if (!pending) {
			return res.status(400).json({ message: 'Invalid email or code' })
		}

		if (pending.code !== String(code).trim()) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		if (new Date() > new Date(pending.codeExpires)) {
			return res.status(400).json({ message: 'Code has expired' })
		}

		// Create user only after verification
		const user = await User.create({
			email: pending.email,
			password: pending.password,
			name: pending.name,
			phone: pending.phone,
			address: pending.address,
			city: pending.city,
			postalCode: pending.postalCode,
			role: 'CUSTOMER',
			emailVerified: new Date(),
		})

		await PendingRegistration.findByIdAndDelete(pending._id)

		return res.json({ message: 'Email verified successfully' })
	} catch (error) {
		console.error('Verify email error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}

export const login = async (req, res) => {
	try {
		const { email, password } = req.body

		if (!email || !password) {
			return res.status(400).json({ message: 'Email and password are required' })
		}

		// Normalize email: trim whitespace and convert to lowercase
		const normalizedEmail = email.trim().toLowerCase()

		// Find user by email (case-insensitive)
		const user = await User.findOne({ 
			email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
		})
		
		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		if (!user.password) {
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		const isPasswordValid = await bcrypt.compare(password, user.password)
		if (!isPasswordValid) {
			return res.status(401).json({ message: 'Invalid email or password' })
		}

		if (!user.isActive) {
			return res.status(403).json({ 
				message: 'Your account is inactive. Please contact support or wait for admin approval.' 
			})
		}

		// Admin 2FA: require TOTP before issuing full token
		if (user.role === 'ADMIN' && user.twoFactorEnabled && user.twoFactorSecret) {
			const tempToken = jwt.sign(
				{ purpose: '2fa_pending', userId: user._id, role: user.role },
				JWT_SECRET,
				{ expiresIn: '5m' }
			)
			return res.status(200).json({
				requiresTwoFactor: true,
				tempToken,
				email: user.email,
			})
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
		console.error('Login error:', error)
		return res.status(500).json({ message: 'Something went wrong. Please try again.' })
	}
}

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('-password -twoFactorSecret')
		return res.json(user)
	} catch (error) {
		console.error('Get me error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}

export const updateProfile = async (req, res) => {
	try {
		const { id } = req.params
		const { name, email, phone, address, city, postalCode, country, image } = req.body

		// Check if user is updating their own profile or is admin
		if (req.user._id.toString() !== id && req.user.role !== 'ADMIN') {
			return res.status(403).json({ message: 'Forbidden' })
		}

		const user = await User.findById(id)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Check if email is being changed and if it's already taken (case-insensitive)
		if (email && email.trim().toLowerCase() !== (user.email || '').trim().toLowerCase()) {
			const normalizedEmail = email.trim().toLowerCase()
			const existingUser = await User.findOne({ 
				email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
				_id: { $ne: id }
			})
			if (existingUser) {
				return res.status(400).json({ 
					message: 'Email already in use',
					errors: { email: 'A user with this email address already exists' }
				})
			}
		}

		// Update user fields
		if (name !== undefined) user.name = name
		if (email !== undefined) user.email = email.trim().toLowerCase()
		if (phone !== undefined) user.phone = phone
		if (address !== undefined) user.address = address
		if (city !== undefined) user.city = city
		if (postalCode !== undefined) user.postalCode = postalCode
		if (country !== undefined) user.country = country
		if (image !== undefined) user.image = image

		await user.save()

		const updatedUser = await User.findById(id).select('-password -twoFactorSecret')
		return res.json(updatedUser)
	} catch (error) {
		console.error('Update profile error:', error)
		return res.status(500).json({ message: 'Failed to update profile' })
	}
}

export const forgotPassword = async (req, res) => {
	try {
		const { email } = req.body
		if (!email) return res.status(400).json({ message: 'Email is required' })

		const normalizedEmail = email.trim().toLowerCase()
		const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } })

		if (!user) {
			// Do not explicitly state whether the email exists or not to prevent user enumeration
			return res.json({ message: 'If an account exists with that email, a password reset code has been sent.' })
		}

		const code = String(Math.floor(100000 + Math.random() * 900000))
		user.resetPasswordCode = code
		user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000) // 15 mins
		await user.save()

		if (await isEmailConfigured()) {
			try {
				await sendEmail(user.email, emailTemplates.passwordResetCode(code))
			} catch (emailError) {
				console.error('Failed to send reset email:', emailError)
			}
		}

		return res.json({ message: 'If an account exists with that email, a password reset code has been sent.' })
	} catch (error) {
		console.error('Forgot password error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}

export const verifyPasswordResetCode = async (req, res) => {
	try {
		const { email, code } = req.body
		if (!email || !code || !/^\d{6}$/.test(String(code).trim())) {
			return res.status(400).json({ message: 'Email and valid 6-digit code are required' })
		}

		const normalizedEmail = email.trim().toLowerCase()
		const user = await User.findOne({
			email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
			resetPasswordCode: String(code).trim(),
			resetPasswordExpires: { $gt: Date.now() },
		})

		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		return res.json({ message: 'Code is valid' })
	} catch (error) {
		console.error('Verify reset code error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}

export const resetPassword = async (req, res) => {
	try {
		const { email, code, newPassword } = req.body
		if (!email || !code || !newPassword) {
			return res.status(400).json({ message: 'Email, code, and new password are required' })
		}
		if (newPassword.length < 8) {
			return res.status(400).json({ message: 'Password must be at least 8 characters long' })
		}

		const normalizedEmail = email.trim().toLowerCase()
		const user = await User.findOne({
			email: { $regex: new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
			resetPasswordCode: String(code).trim(),
			resetPasswordExpires: { $gt: Date.now() },
		})

		if (!user) {
			return res.status(400).json({ message: 'Invalid or expired code' })
		}

		user.password = newPassword
		user.resetPasswordCode = undefined
		user.resetPasswordExpires = undefined
		await user.save()

		return res.json({ message: 'Password successfully reset' })
	} catch (error) {
		console.error('Reset password error:', error)
		return res.status(500).json({ message: 'Something went wrong' })
	}
}
