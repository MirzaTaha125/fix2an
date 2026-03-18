import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/database.js'
import { expireRequests } from './utils/expireRequests.js'
import { sendReminder24h } from './utils/sendReminder24h.js'
import authRouter from './routes/auth.js'
import vehiclesRouter from './routes/vehicles.js'
import requestsRouter from './routes/requests.js'
import offersRouter from './routes/offers.js'
import bookingsRouter from './routes/bookings.js'
import uploadRouter from './routes/upload.js'
import workshopRouter from './routes/workshop.js'
import adminRouter from './routes/admin.js'
import reviewsRouter from './routes/reviews.js'
import walletRouter from './routes/wallet.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

connectDB().then(() => {
	// Expire old requests: run on startup, then every hour
	expireRequests()
	setInterval(expireRequests, 60 * 60 * 1000)
	// 24h booking reminder: run on startup, then every hour
	sendReminder24h()
	setInterval(sendReminder24h, 60 * 60 * 1000)
})

// Capture frontend URL dynamically for emails
app.use((req, res, next) => {
	if (req.headers.origin && !process.env.FRONTEND_URL) {
		global.dynamicFrontendUrl = req.headers.origin
	}
	next()
})

// CORS - allow origin with/without trailing slash to fix Hostinger etc.
const allowedOrigin = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
app.use(cors({
	origin: process.env.NODE_ENV === 'production'
		? (origin, cb) => {
				const o = (origin || '').replace(/\/$/, '')
				cb(null, o === allowedOrigin)
			}
		: true,
	credentials: true,
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
	exposedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.get('/', (_req, res) => {
	res.type('html').send(`
		<!doctype html>
		<html lang="en">
		<head>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<title>Fixa2an Backend</title>
			<style>
				body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; margin: 2rem; color: #0f172a; }
				h1 { color: #1C3F94; margin-bottom: 0.25rem; }
				code { background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px; }
				ul { line-height: 1.8; }
				.footer { margin-top: 2rem; color: #475569; font-size: 0.9rem; }
			</style>
		</head>
		<body>
			<h1>Fixa2an Backend</h1>
			<p>Status: <strong>ok</strong></p>
			<h2>Endpoints</h2>
			<ul>
				<li><a href="/health">/health</a></li>
				<li><code>/api/auth/*</code></li>
				<li><code>/api/vehicles/*</code></li>
				<li><code>/api/requests/*</code></li>
				<li><code>/api/offers/*</code></li>
				<li><code>/api/bookings/*</code></li>
				<li><code>/api/upload</code></li>
				<li><code>/api/workshop/*</code></li>
			</ul>
			<div class="footer">Frontend runs at <a href="http://localhost:5173">http://localhost:5173</a></div>
		</body>
		</html>
	`)
})

app.get('/health', (_req, res) => {
	res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/vehicles', vehiclesRouter)
app.use('/api/requests', requestsRouter)
app.use('/api/offers', offersRouter)
app.use('/api/bookings', bookingsRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/workshop', workshopRouter)
app.use('/api/admin', adminRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/wallet', walletRouter)

const port = process.env.PORT ? Number(process.env.PORT) : 4000
app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`)
})
