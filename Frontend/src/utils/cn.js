import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import i18n from '../i18n.js'

export function cn(...inputs) {
	return twMerge(clsx(inputs))
}

export function formatPrice(price) {
	return new Intl.NumberFormat('sv-SE', {
		style: 'currency',
		currency: 'SEK',
	}).format(price)
}

export function formatCompactNumber(number) {
	if (number === undefined || number === null) return '0'
	
	const formatter = Intl.NumberFormat('en', { notation: 'compact' })
	return formatter.format(number)
}

export function getDateTimeLocale(language) {
	const resolved =
		language ||
		i18n.language ||
		(typeof localStorage !== 'undefined' ? localStorage.getItem('language') : null) ||
		'en'
	if (resolved.startsWith('sv')) return 'sv-SE'
	if (resolved.startsWith('en')) return 'en-GB'
	return resolved
}

function parseDisplayDate(date) {
	if (!date) return null
	const d = new Date(date)
	if (isNaN(d.getTime())) return null
	return d
}

function formatMonthShort(d, language) {
	const locale = getDateTimeLocale(language)
	const month = new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).replace(/\.$/, '')
	return month.charAt(0).toUpperCase() + month.slice(1)
}

function formatDateCore(d, language) {
	const day = String(d.getDate()).padStart(2, '0')
	const month = formatMonthShort(d, language)
	const year = d.getFullYear()
	return `${day} ${month} ${year}`
}

function formatTimeCore(d, language) {
	const use12h = !getDateTimeLocale(language).startsWith('sv')
	return new Intl.DateTimeFormat(use12h ? 'en-US' : 'sv-SE', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: use12h,
	}).format(d)
}

export function formatDate(date, language) {
	const d = parseDisplayDate(date)
	if (!d) return 'N/A'
	return formatDateCore(d, language)
}

export function formatDateTime(date, language) {
	const d = parseDisplayDate(date)
	if (!d) return 'N/A'
	return `${formatDateCore(d, language)} · ${formatTimeCore(d, language)}`
}

export function formatTime(date, language) {
	const d = parseDisplayDate(date)
	if (!d) return 'N/A'
	return formatTimeCore(d, language)
}

export function parseInclusionItems(value) {
	if (!value) return []
	return String(value)
		.split(/[,;\n]+/)
		.map((s) => s.trim())
		.filter(Boolean)
}

export function serializeInclusionItems(items) {
	return (items || []).map((s) => String(s).trim()).filter(Boolean).join('\n')
}

/** Strip to valid Swedish plate chars (3 letters + 3 digits or 3 letters + 2 digits + 1 letter). */
export function normalizeSwedishRegistrationNumber(input) {
	const raw = String(input || '')
		.replace(/[^A-Za-z0-9]/g, '')
		.toUpperCase()

	let normalized = ''

	for (let i = 0; i < raw.length && normalized.length < 6; i++) {
		const char = raw[i]
		if (normalized.length < 3) {
			if (/[A-Z]/.test(char)) normalized += char
			continue
		}

		const suffixLength = normalized.length - 3
		if (suffixLength < 2) {
			if (/[0-9]/.test(char)) normalized += char
		} else if (/[0-9A-Z]/.test(char)) {
			normalized += char
		}
	}

	return normalized
}

/** Display Swedish plate with space after the first three characters. */
export function formatSwedishRegistrationNumber(input) {
	const normalized = normalizeSwedishRegistrationNumber(input)
	if (normalized.length <= 3) return normalized
	return `${normalized.slice(0, 3)} ${normalized.slice(3)}`
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
