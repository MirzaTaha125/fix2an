import express from 'express'
import { register, login, getMe, updateProfile, verifyEmailCode, forgotPassword, verifyPasswordResetCode, resetPassword } from '../controllers/authController.js'
import {
	get2FASetup,
	verify2FASetup,
	disable2FA,
	get2FAStatus,
	verify2FALogin,
} from '../controllers/twoFactorController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)
router.post('/verify-email', verifyEmailCode)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-code', verifyPasswordResetCode)
router.post('/reset-password', resetPassword)
router.post('/2fa/verify-login', verify2FALogin)
router.get('/me', authenticate, getMe)
router.patch('/profile/:id', authenticate, updateProfile)

// Admin 2FA (requires auth)
router.get('/2fa/status', authenticate, get2FAStatus)
router.get('/2fa/setup', authenticate, get2FASetup)
router.post('/2fa/verify-setup', authenticate, verify2FASetup)
router.post('/2fa/disable', authenticate, disable2FA)

export default router
