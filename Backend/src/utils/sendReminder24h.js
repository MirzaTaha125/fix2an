import Booking from '../models/Booking.js'
import { notifyReminder24h } from '../services/notificationService.js'

/**
 * Find bookings scheduled in ~24 hours (23–25h from now) and send reminder email to customer.
 * Call periodically (e.g. every hour).
 */
export async function sendReminder24h() {
	const now = new Date()
	const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000)
	const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000)

	const bookings = await Booking.find({
		status: { $in: ['CONFIRMED', 'RESCHEDULED'] },
		scheduledAt: { $gte: in23h, $lte: in25h },
		$or: [{ reminder24hSentAt: { $exists: false } }, { reminder24hSentAt: null }],
	})
		.populate('customerId', 'name email')
		.populate('workshopId', 'companyName')
		.lean()

	for (const booking of bookings) {
		try {
			await notifyReminder24h(booking)
			await Booking.findByIdAndUpdate(booking._id, { reminder24hSentAt: new Date() })
		} catch (err) {
			console.error('[sendReminder24h] Failed for booking', booking._id, err.message)
		}
	}
	if (bookings.length > 0) {
		console.log(`[sendReminder24h] Sent ${bookings.length} reminder(s)`)
	}
}
