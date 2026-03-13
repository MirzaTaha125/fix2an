import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
	return twMerge(clsx(inputs))
}

export function formatPrice(price) {
	return new Intl.NumberFormat('sv-SE', {
		style: 'currency',
		currency: 'SEK',
	}).format(price)
}

export function formatDate(date) {
	return new Intl.DateTimeFormat('sv-SE', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	}).format(new Date(date))
}

export function formatDateTime(date) {
	return new Intl.DateTimeFormat('sv-SE', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	}).format(new Date(date))
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
	const R = 6371 // Radius of the Earth in kilometers
	const dLat = ((lat2 - lat1) * Math.PI) / 180
	const dLon = ((lon2 - lon1) * Math.PI) / 180
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) *
			Math.sin(dLon / 2)
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
	const distance = R * c
	return Math.round(distance * 10) / 10
}

export function validateFile(file, t) {
	const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf']
	if (!allowedTypes.includes(file.type)) {
		return {
			isValid: false,
			error: t ? t('invalid_file_type') : 'Only JPG, PNG and PDF files are allowed',
		}
	}

	const maxSize = 10 * 1024 * 1024 // 10MB
	if (file.size > maxSize) {
		return {
			isValid: false,
			error: t ? t('file_too_large') : 'File is too large. Maximum size is 10MB',
		}
	}

	return { isValid: true }
}

export function getFileIcon(mimeType) {
	if (mimeType.startsWith('image/')) {
		return '🖼️'
	} else if (mimeType === 'application/pdf') {
		return '📄'
	}
	return '📎'
}
