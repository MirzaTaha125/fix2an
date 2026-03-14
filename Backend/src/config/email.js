import nodemailer from 'nodemailer'
import mongoose from 'mongoose'

let EmailConfigModel = null
try {
	const { default: EmailConfig } = await import('../models/EmailConfig.js')
	EmailConfigModel = EmailConfig
} catch {}

/** Get email config from DB */
async function getEmailConfigDoc() {
	if (EmailConfigModel && mongoose.connection.readyState === 1) {
		return await EmailConfigModel.findOne().lean()
	}
	return null
}

/** SMTP config from doc */
function getSmtpConfig(doc) {
	if (doc && doc.provider === 'smtp' && doc.host && doc.user) {
		return {
			host: doc.host,
			port: doc.port ?? 587,
			secure: doc.secure ?? false,
			auth: { user: doc.user, pass: doc.password || '' },
			from: doc.from || doc.user,
		}
	}
	return null
}

/** EmailJS config from doc */
function getEmailJsConfig(doc) {
	if (!doc || !doc.emailjsUserId || !doc.emailjsServiceId || !doc.emailjsTemplateId) return null
	return {
		userId: doc.emailjsUserId,
		serviceId: doc.emailjsServiceId,
		templateId: doc.emailjsTemplateId,
		privateKey: doc.emailjsPrivateKey || '',
	}
}

export async function isEmailConfigured() {
	const doc = await getEmailConfigDoc()
	if (!doc) return false
	if (doc.provider === 'emailjs') return !!getEmailJsConfig(doc)
	return !!getSmtpConfig(doc)
}

const style = {
	heading: 'color: #1C3F94; font-family: Arial, sans-serif;',
	button: 'background-color: #34C759; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;',
	footer: 'color: #666; font-size: 12px; margin-top: 24px;',
}

/** All templates return { subject, heading, body } – same structure for EmailJS (English only) */
export const emailTemplates = {
	accountVerification: (verificationUrl) => ({
		subject: 'Verify your Fixa2an account',
		heading: 'Welcome to Fixa2an!',
		body: `<p>Click the link below to verify your account:</p>
<p><a href="${verificationUrl}" style="${style.button}">Verify account</a></p>
<p style="${style.footer}">If the link doesn't work, copy: ${verificationUrl}</p>`,
	}),
	emailVerificationCode: (code) => ({
		subject: 'Your verification code – Fixa2an',
		heading: 'Welcome to Fixa2an!',
		body: `<p>Use the code below to verify your email address:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
<p style="${style.footer}">The code is valid for 15 minutes. If you didn't request this, you can ignore this email.</p>`,
	}),
	uploadReceived: (customerName, myCasesUrl) => ({
		subject: 'Your request has been received – Fixa2an',
		heading: 'Request received',
		body: `<p>Hi ${customerName || 'customer'},</p>
<p>We have received your inspection report and request. Verified workshops can now send quotes.</p>
<p><a href="${myCasesUrl}" style="${style.button}">View My Cases</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	newOffers: (customerName, offerCount, myCasesUrl) => ({
		subject: `You have ${offerCount} new ${offerCount === 1 ? 'quote' : 'quotes'} – Fixa2an`,
		heading: 'New quotes',
		body: `<p>Hi ${customerName || 'customer'},</p>
<p>You have received ${offerCount} new ${offerCount === 1 ? 'quote' : 'quotes'} for your request. Compare prices and book when ready.</p>
<p><a href="${myCasesUrl}" style="${style.button}">View quotes</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	bookingConfirmed: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Booking confirmed – Fixa2an',
		heading: 'Booking confirmed',
		body: `<p>Hi ${customerName || 'customer'},</p>
<p>Your booking at <strong>${workshopName || 'the workshop'}</strong> has been confirmed.</p>
<p><strong>Date/time:</strong> ${scheduledAt}</p>
<p><a href="${myCasesUrl}" style="${style.button}">View My Cases</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	reminder24h: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Reminder: your booking tomorrow – Fixa2an',
		heading: 'Booking reminder',
		body: `<p>Hi ${customerName || 'customer'},</p>
<p>This is a reminder about your booking at <strong>${workshopName || 'the workshop'}</strong>.</p>
<p><strong>Date/time:</strong> ${scheduledAt}</p>
<p><a href="${myCasesUrl}" style="${style.button}">View booking</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	jobCompleteReviewRequest: (customerName, workshopName, myCasesUrl) => ({
		subject: 'How did it go? Leave a review – Fixa2an',
		heading: 'Thanks for using Fixa2an',
		body: `<p>Hi ${customerName || 'customer'},</p>
<p>Your booking at <strong>${workshopName || 'the workshop'}</strong> is complete. Help others by leaving a review.</p>
<p><a href="${myCasesUrl}" style="${style.button}">Leave review</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	workshopRegistrationPending: (companyName) => ({
		subject: 'Workshop registration received – Fixa2an',
		heading: 'Thanks for registering!',
		body: `<p>Hi ${companyName},</p>
<p>Your workshop registration has been received and is awaiting admin approval.</p>
<p style="${style.footer}">Best regards, the Fixa2an team</p>`,
	}),
	workshopWelcome: (companyName, loginUrl) => ({
		subject: 'Welcome to Fixa2an – your workshop is approved',
		heading: 'Welcome to Fixa2an!',
		body: `<p>Hi ${companyName},</p>
<p>Your workshop has been approved. You can now log in and start receiving requests.</p>
<p><a href="${loginUrl}" style="${style.button}">Log in</a></p>
<p style="${style.footer}">Best regards, the Fixa2an team</p>`,
	}),
	newRequest: (workshopName, requestsUrl) => ({
		subject: 'New request in your area – Fixa2an',
		heading: 'New request',
		body: `<p>Hi ${workshopName},</p>
<p>A customer has submitted a new request that might suit your workshop.</p>
<p><a href="${requestsUrl}" style="${style.button}">View requests</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
	workshopBookingConfirmed: (workshopName, customerName, scheduledAt, requestsUrl) => ({
		subject: 'New booking confirmed – Fixa2an',
		heading: 'New booking',
		body: `<p>Hi ${workshopName},</p>
<p>A customer has booked an appointment with you.</p>
<p><strong>Customer:</strong> ${customerName || 'Customer'}</p>
<p><strong>Date/time:</strong> ${scheduledAt}</p>
<p><a href="${requestsUrl}" style="${style.button}">View booking</a></p>
<p style="${style.footer}">Best regards, Fixa2an</p>`,
	}),
}

/** Send via EmailJS API */
async function sendViaEmailJS(to, template, cfg) {
	const body = {
		service_id: cfg.serviceId,
		template_id: cfg.templateId,
		user_id: cfg.userId,
		template_params: {
			to_email: to,
			subject: template.subject,
			heading: template.heading,
			body: template.body,
		},
	}
	if (cfg.privateKey) body.accessToken = cfg.privateKey

	const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})
	const txt = await res.text()
	if (!res.ok) {
		console.error('[EmailJS]', res.status, txt)
		throw new Error(`EmailJS ${res.status}: ${txt}`)
	}
}

/** Send via SMTP */
async function sendViaSmtp(to, template, cfg) {
	const html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h1 style="${style.heading}">${template.heading}</h1>
${template.body}
</div>`
	const transporter = nodemailer.createTransport({
		host: cfg.host,
		port: cfg.port,
		secure: cfg.secure,
		auth: cfg.auth,
	})
	await transporter.sendMail({
		from: cfg.from,
		to,
		subject: template.subject,
		html,
	})
}

export async function sendEmail(to, template) {
	const doc = await getEmailConfigDoc()
	const emailjs = doc ? getEmailJsConfig(doc) : null
	const smtp = doc ? getSmtpConfig(doc) : null

	if (!doc) {
		console.log('[Email] Skipped: no config in DB. Add in Admin → Settings → Email.')
		return
	}
	if (emailjs) {
		try {
			await sendViaEmailJS(to, template, emailjs)
			console.log('[Email] Sent via EmailJS:', template.subject, 'to', to)
		} catch (err) {
			console.error('[Email] EmailJS failed:', err.message)
			throw err
		}
		return
	}
	if (smtp) {
		try {
			await sendViaSmtp(to, template, smtp)
		} catch (err) {
			console.error('[Email] SMTP failed:', err.message)
			throw err
		}
		return
	}
	console.log('[Email] Skipped: set Provider to EmailJS and fill User ID, Service ID, Template ID (and Private Key) in Admin → Settings.')
}
