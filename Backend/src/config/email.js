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
		subject: 'Bekräfta ditt Fixa2an-konto',
		heading: 'Välkommen till Fixa2an!',
		body: `<p>Klicka på länken nedan för att bekräfta ditt konto:</p>
<p><a href="${verificationUrl}" style="${style.button}">Bekräfta konto</a></p>
<p style="${style.footer}">Om länken inte fungerar, kopiera: ${verificationUrl}</p>`,
	}),
	emailVerificationCode: (code) => ({
		subject: 'Din verifieringskod – Fixa2an',
		heading: 'Välkommen till Fixa2an!',
		body: `<p>Använd koden nedan för att verifiera din e-postadress:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
<p style="${style.footer}">Koden är giltig i 15 minuter. Om du inte begärde detta kan du ignorera detta mejl.</p>`,
	}),
	passwordResetCode: (code) => ({
		subject: 'Kod för återställning av lösenord – Fixa2an',
		heading: 'Återställ ditt lösenord',
		body: `<p>Använd koden nedan för att återställa ditt lösenord:</p>
<p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
<p style="${style.footer}">Koden är giltig i 15 minuter. Om du inte begärde detta kan du ignorera detta mejl. Ditt lösenord kommer inte att ändras förrän du skapar ett nytt.</p>`,
	}),
	uploadReceived: (customerName, myCasesUrl) => ({
		subject: 'Din förfrågan är mottagen – Fixa2an',
		heading: 'Förfrågan mottagen',
		body: `<p>Hej ${customerName || 'kund'},</p>
<p>Vi har tagit emot ditt besiktningsprotokoll och förfrågan. Verifierade verkstäder kan nu skicka offerter.</p>
<p><a href="${myCasesUrl}" style="${style.button}">Visa mina ärenden</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	newOffers: (customerName, offerCount, myCasesUrl) => ({
		subject: `Du har ${offerCount} ${offerCount === 1 ? 'ny offert' : 'nya offerter'} – Fixa2an`,
		heading: 'Nya offerter',
		body: `<p>Hej ${customerName || 'kund'},</p>
<p>Du har fått ${offerCount} ${offerCount === 1 ? 'ny offert' : 'nya offerter'} på din förfrågan. Jämför priser och boka när du är redo.</p>
<p><a href="${myCasesUrl}" style="${style.button}">Visa offerter</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	bookingConfirmed: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Bokning bekräftad – Fixa2an',
		heading: 'Bokning bekräftad',
		body: `<p>Hej ${customerName || 'kund'},</p>
<p>Din bokning hos <strong>${workshopName || 'verkstaden'}</strong> har bekräftats.</p>
<p><strong>Datum/tid:</strong> ${scheduledAt}</p>
<p><a href="${myCasesUrl}" style="${style.button}">Visa mina ärenden</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	reminder24h: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Påminnelse: din bokning imorgon – Fixa2an',
		heading: 'Bokningspåminnelse',
		body: `<p>Hej ${customerName || 'kund'},</p>
<p>Detta är en påminnelse om din bokning hos <strong>${workshopName || 'verkstaden'}</strong>.</p>
<p><strong>Datum/tid:</strong> ${scheduledAt}</p>
<p><a href="${myCasesUrl}" style="${style.button}">Visa bokning</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	jobCompleteReviewRequest: (customerName, workshopName, myCasesUrl) => ({
		subject: 'Hur gick det? Lämna ett omdöme – Fixa2an',
		heading: 'Tack för att du använder Fixa2an',
		body: `<p>Hej ${customerName || 'kund'},</p>
<p>Din bokning hos <strong>${workshopName || 'verkstaden'}</strong> är klar. Hjälp andra genom att lämna ett omdöme.</p>
<p><a href="${myCasesUrl}" style="${style.button}">Lämna omdöme</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	workshopRegistrationPending: (companyName) => ({
		subject: 'Verkstadsregistrering mottagen – Fixa2an',
		heading: 'Tack för din registrering!',
		body: `<p>Hej ${companyName},</p>
<p>Din verkstadsregistrering är mottagen och väntar på godkännande av administratör.</p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an-teamet</p>`,
	}),
	workshopWelcome: (companyName, loginUrl) => ({
		subject: 'Välkommen till Fixa2an – din verkstad är godkänd',
		heading: 'Välkommen till Fixa2an!',
		body: `<p>Hej ${companyName},</p>
<p>Din verkstad är godkänd. Du kan nu logga in och börja ta emot förfrågningar.</p>
<p><a href="${loginUrl}" style="${style.button}">Logga in</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an-teamet</p>`,
	}),
	newRequest: (workshopName, requestsUrl) => ({
		subject: 'Ny förfrågan i ditt område – Fixa2an',
		heading: 'Ny förfrågan',
		body: `<p>Hej ${workshopName},</p>
<p>En kund har skickat in en ny förfrågan som kan passa din verkstad.</p>
<p><a href="${requestsUrl}" style="${style.button}">Visa förfrågningar</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
	}),
	workshopBookingConfirmed: (workshopName, customerName, scheduledAt, requestsUrl) => ({
		subject: 'Ny bokning bekräftad – Fixa2an',
		heading: 'Ny bokning',
		body: `<p>Hej ${workshopName},</p>
<p>En kund har bokat en tid hos dig.</p>
<p><strong>Kund:</strong> ${customerName || 'Kund'}</p>
<p><strong>Datum/tid:</strong> ${scheduledAt}</p>
<p><a href="${requestsUrl}" style="${style.button}">Visa bokning</a></p>
<p style="${style.footer}">Vänliga hälsningar, Fixa2an</p>`,
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
