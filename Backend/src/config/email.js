import nodemailer from 'nodemailer'
import mongoose from 'mongoose'

let EmailConfigModel = null
try {
	const { default: EmailConfig } = await import('../models/EmailConfig.js')
	EmailConfigModel = EmailConfig
} catch {
	// Model not loaded yet
}

/** Get SMTP config from DB only (Admin Settings) */
async function getEmailConfig() {
	if (EmailConfigModel && mongoose.connection.readyState === 1) {
		const doc = await EmailConfigModel.findOne().lean()
		if (doc && doc.host && doc.user) {
			return {
				host: doc.host,
				port: doc.port ?? 587,
				secure: doc.secure ?? false,
				auth: {
					user: doc.user,
					pass: doc.password || '',
				},
				from: doc.from || doc.user,
			}
		}
	}
	return null
}

/** Only send if SMTP is configured in DB (Admin Settings) */
export async function isEmailConfigured() {
	const cfg = await getEmailConfig()
	return !!(cfg && cfg.host && cfg.auth && cfg.auth.user)
}

const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
const style = {
	heading: 'color: #1C3F94; font-family: Arial, sans-serif;',
	button: 'background-color: #34C759; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;',
	footer: 'color: #666; font-size: 12px; margin-top: 24px;',
}

export const emailTemplates = {
	// --- Customer ---
	accountVerification: (verificationUrl) => ({
		subject: 'Verifiera ditt Fixa2an-konto',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Välkommen till Fixa2an!</h1>
	        <p>Klicka på länken nedan för att verifiera ditt konto:</p>
	        <a href="${verificationUrl}" style="${style.button}">Verifiera konto</a>
	        <p style="${style.footer}">Om länken inte fungerar, kopiera: ${verificationUrl}</p>
	      </div>
	    `,
		text: `Välkommen till Fixa2an! Verifiera ditt konto: ${verificationUrl}`,
	}),
	emailVerificationCode: (code) => ({
		subject: 'Din verifieringskod – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Välkommen till Fixa2an!</h1>
	        <p>Använd koden nedan för att verifiera din e-postadress:</p>
	        <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
	        <p style="${style.footer}">Koden är giltig i 15 minuter. Om du inte begärde detta kan du ignorera detta e-postmeddelande.</p>
	      </div>
	    `,
		text: `Din verifieringskod: ${code}. Giltig i 15 minuter.`,
	}),
	uploadReceived: (customerName, myCasesUrl) => ({
		subject: 'Din förfrågan är mottagen – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Förfrågan mottagen</h1>
	        <p>Hej ${customerName || 'kund'},</p>
	        <p>Vi har mottagit din inspektionsrapport och förfrågan. Verifierade verkstäder i ditt område kan nu skicka offerter till dig.</p>
	        <p><a href="${myCasesUrl}" style="${style.button}">Visa Mina ärenden</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Din förfrågan är mottagen. Verifierade verkstäder kan nu skicka offerter. Öppna Mina ärenden: ${myCasesUrl}`,
	}),
	newOffers: (customerName, offerCount, myCasesUrl) => ({
		subject: `Du har ${offerCount} ny${offerCount === 1 ? ' offert' : 'a offerter'} – Fixa2an`,
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Nya offerter</h1>
	        <p>Hej ${customerName || 'kund'},</p>
	        <p>Du har fått ${offerCount} ny${offerCount === 1 ? ' offert' : 'a offerter'} på din förfrågan. Jämför priser och boka när du vill.</p>
	        <p><a href="${myCasesUrl}" style="${style.button}">Visa offerter</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Du har ${offerCount} nya offerter. Öppna Mina ärenden: ${myCasesUrl}`,
	}),
	bookingConfirmed: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Bokning bekräftad – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Bokning bekräftad</h1>
	        <p>Hej ${customerName || 'kund'},</p>
	        <p>Din bokning hos <strong>${workshopName || 'verkstaden'}</strong> är bekräftad.</p>
	        <p><strong>Datum/tid:</strong> ${scheduledAt}</p>
	        <p><a href="${myCasesUrl}" style="${style.button}">Visa Mina ärenden</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Bokning bekräftad hos ${workshopName}. ${scheduledAt}. Mina ärenden: ${myCasesUrl}`,
	}),
	reminder24h: (customerName, workshopName, scheduledAt, myCasesUrl) => ({
		subject: 'Påminnelse: din bokning imorgon – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Påminnelse om bokning</h1>
	        <p>Hej ${customerName || 'kund'},</p>
	        <p>Detta är en påminnelse om din bokning hos <strong>${workshopName || 'verkstaden'}</strong>.</p>
	        <p><strong>Datum/tid:</strong> ${scheduledAt}</p>
	        <p><a href="${myCasesUrl}" style="${style.button}">Visa bokning</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Påminnelse: bokning hos ${workshopName} ${scheduledAt}. ${myCasesUrl}`,
	}),
	jobCompleteReviewRequest: (customerName, workshopName, myCasesUrl) => ({
		subject: 'Hur gick det? Lämna en recension – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Tack för att du använde Fixa2an</h1>
	        <p>Hej ${customerName || 'kund'},</p>
	        <p>Din bokning hos <strong>${workshopName || 'verkstaden'}</strong> är slutförd. Hjälp andra kunder genom att lämna en recension.</p>
	        <p><a href="${myCasesUrl}" style="${style.button}">Lämna recension</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Lämna en recension för ${workshopName}: ${myCasesUrl}`,
	}),

	// --- Workshop ---
	workshopRegistrationPending: (companyName) => ({
		subject: 'Verkstadsregistrering mottagen – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Tack för din registrering!</h1>
	        <p>Hej ${companyName},</p>
	        <p>Din verkstadsregistrering har mottagits och väntar nu på administratörsgodkännande.</p>
	        <p>Du får ett e-postmeddelande när din registrering har granskats.</p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an-teamet</p>
	      </div>
	    `,
		text: `Tack! Din verkstadsregistrering har mottagits och väntar på godkännande.`,
	}),
	workshopWelcome: (companyName, loginUrl) => ({
		subject: 'Välkommen till Fixa2an – din verkstad är godkänd',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Välkommen till Fixa2an!</h1>
	        <p>Hej ${companyName},</p>
	        <p>Din verkstad är nu godkänd och verifierad. Du kan logga in och börja ta emot förfrågningar från kunder.</p>
	        <p><a href="${loginUrl}" style="${style.button}">Logga in</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an-teamet</p>
	      </div>
	    `,
		text: `Din verkstad är godkänd. Logga in: ${loginUrl}`,
	}),
	newRequest: (workshopName, requestsUrl) => ({
		subject: 'Ny förfrågan i ditt område – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Ny förfrågan</h1>
	        <p>Hej ${workshopName},</p>
	        <p>En kund har skickat in en ny förfrågan som kan passa din verkstad. Logga in och skicka en offert.</p>
	        <p><a href="${requestsUrl}" style="${style.button}">Visa förfrågningar</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Ny förfrågan mottagen. Visa förfrågningar: ${requestsUrl}`,
	}),
	workshopBookingConfirmed: (workshopName, customerName, scheduledAt, requestsUrl) => ({
		subject: 'Ny bokning bekräftad – Fixa2an',
		html: `
	      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
	        <h1 style="${style.heading}">Ny bokning</h1>
	        <p>Hej ${workshopName},</p>
	        <p>En kund har bokat en tid hos er.</p>
	        <p><strong>Kund:</strong> ${customerName || 'Kund'}</p>
	        <p><strong>Datum/tid:</strong> ${scheduledAt}</p>
	        <p><a href="${requestsUrl}" style="${style.button}">Visa kontrakt</a></p>
	        <p style="${style.footer}">Med vänliga hälsningar, Fixa2an</p>
	      </div>
	    `,
		text: `Ny bokning: ${customerName}, ${scheduledAt}. ${requestsUrl}`,
	}),
}

export async function sendEmail(to, template) {
	const configured = await isEmailConfigured()
	if (!configured) {
		console.log('[Email] Skipped (not configured):', template.subject, 'to', to)
		return
	}
	const cfg = await getEmailConfig()
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
		html: template.html,
		text: template.text,
	})
}
