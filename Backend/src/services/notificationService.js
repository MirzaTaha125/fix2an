/**
 * Email notification triggers. No payment-related emails (e.g. payment confirmed, payout report).
 */
import { sendEmail, emailTemplates, isEmailConfigured } from '../config/email.js'
import User from '../models/User.js'
import Workshop from '../models/Workshop.js'

const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
const myCasesUrl = `${baseUrl}/my-cases`
const requestsUrl = `${baseUrl}/workshop/requests`
const authUrl = `${baseUrl}/auth/signin`

function safeSend(to, template) {
	if (!to || !template) return
	return sendEmail(to, template).catch((err) => console.error('[Notification] Send failed:', err.message))
}

/** Customer: upload received */
export async function notifyUploadReceived(customerId) {
	const user = await User.findById(customerId).select('email name').lean()
	if (!user?.email) return
	await safeSend(user.email, emailTemplates.uploadReceived(user.name, myCasesUrl))
}

/** Customer: new offer(s) on their request */
export async function notifyNewOffers(customerId, offerCount) {
	const user = await User.findById(customerId).select('email name').lean()
	if (!user?.email) return
	await safeSend(user.email, emailTemplates.newOffers(user.name, offerCount, myCasesUrl))
}

/** Customer + Workshop: booking confirmed */
export async function notifyBookingConfirmed(booking) {
	const customer = await User.findById(booking.customerId).select('email name').lean()
	const workshop = await Workshop.findById(booking.workshopId).select('email companyName').lean()
	const scheduledAt = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('sv-SE', { dateStyle: 'long', timeStyle: 'short' }) : ''
	if (customer?.email) {
		await safeSend(customer.email, emailTemplates.bookingConfirmed(customer.name, workshop?.companyName, scheduledAt, myCasesUrl))
	}
	if (workshop?.email) {
		await safeSend(workshop.email, emailTemplates.workshopBookingConfirmed(workshop.companyName, customer?.name, scheduledAt, `${baseUrl}/workshop/contracts`))
	}
}

/** Customer: reminder 24h before appointment */
export async function notifyReminder24h(booking) {
	const customer = await User.findById(booking.customerId).select('email name').lean()
	const workshop = await Workshop.findById(booking.workshopId).select('companyName').lean()
	const scheduledAt = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString('sv-SE', { dateStyle: 'long', timeStyle: 'short' }) : ''
	if (customer?.email) {
		await safeSend(customer.email, emailTemplates.reminder24h(customer.name, workshop?.companyName, scheduledAt, myCasesUrl))
	}
}

/** Customer: job complete, please leave review */
export async function notifyJobCompleteReviewRequest(booking) {
	const customer = await User.findById(booking.customerId).select('email name').lean()
	const workshop = await Workshop.findById(booking.workshopId).select('companyName').lean()
	if (customer?.email) {
		await safeSend(customer.email, emailTemplates.jobCompleteReviewRequest(customer.name, workshop?.companyName, myCasesUrl))
	}
}

/** Workshop: welcome (after admin approval) */
export async function notifyWorkshopWelcome(workshopId) {
	const workshop = await Workshop.findById(workshopId).select('email companyName').lean()
	if (!workshop?.email) return
	await safeSend(workshop.email, emailTemplates.workshopWelcome(workshop.companyName, authUrl))
}

/** Workshop: new request in area – notify all verified workshops */
export async function notifyWorkshopsNewRequest() {
	if (!(await isEmailConfigured())) return
	const workshops = await Workshop.find({ isVerified: true }).select('email companyName').lean()
	for (const w of workshops) {
		if (w.email) {
			await safeSend(w.email, emailTemplates.newRequest(w.companyName, requestsUrl))
		}
	}
}
