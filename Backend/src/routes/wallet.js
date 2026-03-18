import express from 'express'
import { authenticate } from '../middleware/auth.js'
import { getMyWallet, getTransactions, depositFunds, withdrawFunds } from '../controllers/walletController.js'

const router = express.Router()

router.use(authenticate)

router.get('/my-wallet', getMyWallet)
router.get('/transactions', getTransactions)
router.post('/deposit', depositFunds)
router.post('/withdraw', withdrawFunds)

export default router
