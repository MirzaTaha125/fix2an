import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import InspectionReport from '../models/InspectionReport.js'
import { authenticate } from '../middleware/auth.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
	fs.mkdirSync(uploadsDir, { recursive: true })
	console.log('Created uploads directory:', uploadsDir)
}

// Configure multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsDir)
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
		cb(null, uniqueSuffix + '-' + file.originalname)
	},
})

const upload = multer({
	storage,
	limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
	fileFilter: (req, file, cb) => {
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true)
		} else {
			cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false)
		}
	},
})

// Upload file (works for both authenticated and unauthenticated requests)
// For workshop registration, files can be uploaded without auth
router.post('/', upload.single('file'), async (req, res) => {
	try {
		if (!req.file) {
			return res.status(400).json({ message: 'No file uploaded' })
		}

		// For now, store file locally. In production, upload to S3 or similar
		const fileUrl = `/uploads/${req.file.filename}`

		// Only create InspectionReport if user is authenticated (for inspection reports)
		// For workshop registration, just return file info
		if (req.headers.authorization) {
			try {
				const report = await InspectionReport.create({
					fileName: req.file.originalname,
					fileUrl,
					fileSize: req.file.size,
					mimeType: req.file.mimetype,
				})

				return res.status(201).json({
					id: report._id,
					fileName: report.fileName,
					fileUrl: report.fileUrl,
					fileSize: report.fileSize,
					mimeType: report.mimeType,
				})
			} catch (dbError) {
				// If InspectionReport creation fails, still return file info
				console.error('Failed to create InspectionReport:', dbError)
			}
		}

		// Return file info (for workshop registration or if InspectionReport creation fails)
		return res.status(200).json({
			fileName: req.file.originalname,
			fileUrl: fileUrl,
			fileSize: req.file.size,
			mimeType: req.file.mimetype,
		})
	} catch (error) {
		console.error('Upload error:', error)
		
		// Handle multer errors
		if (error.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' })
		}
		if (error.message && error.message.includes('Invalid file type')) {
			return res.status(400).json({ message: error.message })
		}
		
		return res.status(500).json({ message: 'Failed to upload file' })
	}
})

export default router

