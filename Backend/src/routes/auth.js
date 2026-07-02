import express from 'express'
import { register, login, getMe, updateProfile, updatePassword, verifyEmailCode, forgotPassword, verifyPasswordResetCode, resetPassword, selfDelete } from '../controllers/authController.js'
import { sendMagicLink, sendLoginMagicLink, verifyMagicLink } from '../controllers/magicLinkController.js'
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
router.post('/magic-link', sendMagicLink)
router.post('/login-magic-link', sendLoginMagicLink)
router.get('/magic-link/verify', verifyMagicLink)
router.post('/magic-link/verify', verifyMagicLink)
router.post('/forgot-password', forgotPassword)
router.post('/verify-reset-code', verifyPasswordResetCode)
router.post('/reset-password', resetPassword)
router.post('/2fa/verify-login', verify2FALogin)
router.get('/me', authenticate, getMe)
router.patch('/profile/:id', authenticate, updateProfile)
router.post('/password', authenticate, updatePassword)

// Admin 2FA (requires auth)
router.get('/2fa/status', authenticate, get2FAStatus)
router.get('/2fa/setup', authenticate, get2FASetup)
router.post('/2fa/verify-setup', authenticate, verify2FASetup)
router.post('/2fa/disable', authenticate, disable2FA)

router.delete('/self-delete', authenticate, selfDelete)

export default router
