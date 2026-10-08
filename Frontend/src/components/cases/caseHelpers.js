export function getCaseId(request) {
	return request?._id || request?.id
}

export function getCaseTitle(request) {
	const raw = (request?.description || '').trim().split('\n')[0] || '—'
	const sentence = (raw.match(/^(.+?[.!?])(?:\s|$)/)?.[1] || raw).replace(/[.!?]+$/, '').trim()
	if (sentence.length <= 72) return sentence
	return `${sentence.slice(0, 69).trim()}…`
}

export function getVehicleLine(request) {
	const v = request?.vehicleId || {}
	const parts = [v.make, v.model].filter(Boolean)
	const car = parts.join(' ')
	const reg = request?.registrationNumber
	if (car && reg) return `${car} · ${reg}`
	return car || reg || '—'
}

export function isClosedCase(request) {
	const bookings = request?.bookings || []
	if (request?.status === 'CANCELLED' || request?.status === 'EXPIRED') return true
	if (bookings.some((b) => b.status === 'CANCELLED') && !bookings.some((b) => ['CONFIRMED', 'RESCHEDULED', 'RECEIVED', 'IN_PROGRESS', 'READY_PICKUP', 'DONE'].includes(b.status))) {
		return true
	}
	const doneBooking = bookings.find((b) => b.status === 'DONE')
	return Boolean(doneBooking) || request?.status === 'COMPLETED'
}

export function getActiveBooking(request) {
	const bookings = request?.bookings || []
	return (
		bookings.find((b) => b.status === 'READY_PICKUP') ||
		bookings.find((b) => b.status === 'IN_PROGRESS') ||
		bookings.find((b) => b.status === 'RECEIVED') ||
		bookings.find((b) => b.status === 'RESCHEDULED') ||
		bookings.find((b) => b.status === 'CONFIRMED') ||
		bookings.find((b) => b.status === 'DONE') ||
		bookings[0] ||
		null
	)
}

export function getOfferCount(request) {
	return (request?.offers || []).filter((o) => o.status === 'SENT' || o.status === 'ACCEPTED').length
}

export function getCaseStatusKey(request) {
	if (isClosedCase(request)) {
		if (request?.status === 'CANCELLED' || (request?.bookings || []).some((b) => b.status === 'CANCELLED' && request.status !== 'BOOKED')) {
			return 'closed'
		}
		if (request?.status === 'EXPIRED') return 'expired'
		return 'closed'
	}
	const booking = getActiveBooking(request)
	// READY_PICKUP: ready announcement until workshop marks completed (finalAmount locked) → pickup confirm
	if (booking?.status === 'READY_PICKUP') {
		return Number(booking.finalAmount) > 0 ? 'pickup' : 'ready'
	}
	if (booking?.status === 'IN_PROGRESS') return 'repair'
	if (booking?.status === 'RECEIVED') return 'received'
	if (booking?.status === 'RESCHEDULED') return 'rescheduled'
	if (booking?.status === 'CONFIRMED' && booking?.scheduledAt) {
		const scheduled = new Date(booking.scheduledAt)
		const today = new Date()
		const isToday =
			scheduled.getFullYear() === today.getFullYear() &&
			scheduled.getMonth() === today.getMonth() &&
			scheduled.getDate() === today.getDate()
		return isToday ? 'scheduled' : 'booked'
	}
	if (booking?.status === 'CONFIRMED') return 'booked'
	if (request?.status === 'BOOKED') return 'booked'
	if (getOfferCount(request) > 0 || request?.status === 'IN_BIDDING') return 'offers'
	return 'new'
}

/** Badge / summary label — "In progress" only after work starts (IN_PROGRESS). */
export function getCaseStatusLabel(statusKey, t) {
	if (statusKey === 'repair') return t('my_cases.flow.status_ongoing')
	if (statusKey === 'pickup' || statusKey === 'ready') return t('my_cases.flow.status_ready')
	if (statusKey === 'closed') return t('my_cases.flow.status_done_short')
	return t(`my_cases.flow.status_${statusKey}`)
}

export function getCaseReports(request) {
	const reports = []
	if (Array.isArray(request?.reportIds)) reports.push(...request.reportIds)
	if (request?.reportId) reports.push(request.reportId)
	return reports.filter(Boolean)
}

export function getCaseTimeline(request) {
	const created = request?.createdAt ? new Date(request.createdAt) : null
	const offerCount = getOfferCount(request)
	const booking = getActiveBooking(request)
	const status = getCaseStatusKey(request)

	const pastQuote = ['booked', 'scheduled', 'rescheduled', 'received', 'repair', 'ready', 'pickup', 'closed'].includes(status)
	const caseComplete = booking?.status === 'DONE' || request?.status === 'COMPLETED'

	const done = {
		created: true,
		matching: Boolean(created),
		offers: offerCount > 0 || status === 'offers' || pastQuote,
		choose: pastQuote,
		booking: Boolean(booking) || pastQuote,
		work: ['repair', 'ready', 'pickup', 'closed'].includes(status) || ['IN_PROGRESS', 'READY_PICKUP', 'DONE'].includes(booking?.status) || request?.status === 'COMPLETED',
		done: caseComplete,
	}

	let progressKey = 'progress_created'
	if (caseComplete) progressKey = 'progress_ready'
	else if (status === 'ready') progressKey = 'progress_ready'
	else if (status === 'repair') progressKey = 'progress_repair'
	else if (status === 'received') progressKey = 'progress_received'
	else if (['booked', 'scheduled', 'rescheduled'].includes(status)) progressKey = 'progress_booked'
	else if (status === 'offers') progressKey = 'progress_offers'

	return { created, offerCount, booking, done, status, progressKey }
}

function looksLikeImageFileName(text) {
	const value = String(text || '').trim()
	if (!value) return false
	return /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(value) || /^chatgpt image\b/i.test(value)
}

/** Friendly inbox preview for image/file last messages. */
export function formatMessagePreview(preview, t, { senderRole, viewerRole = 'CUSTOMER' } = {}) {
	const value = String(preview || '').trim()
	const isImage = value === '__IMAGE__' || looksLikeImageFileName(value)
	const isFile = value === '__FILE__'
	const mine = senderRole && viewerRole && String(senderRole) === String(viewerRole)

	if (isImage) {
		return mine
			? (t('my_cases.flow.chat_preview_image_you') || 'You sent an image')
			: (t('my_cases.flow.chat_preview_image') || 'Sent an image')
	}
	if (isFile) {
		return mine
			? (t('my_cases.flow.chat_preview_file_you') || 'You sent a file')
			: (t('my_cases.flow.chat_preview_file') || 'Sent a file')
	}
	return value
}
