export const SWEDISH_COUNTRY_CODE = '+46'

/** Format national Swedish numbers (e.g. 070-123 45 67). */
export function formatSwedishPhone(input) {
	if (input == null || input === '') return ''

	const str = String(input).trim()

	if (str.startsWith('+')) {
		return toNationalPhoneInput(str)
	}

	const digits = str.replace(/\D/g, '').slice(0, 10)
	if (!digits) return ''

	const isMobile = digits.startsWith('07') || digits.length === 10

	if (isMobile) {
		if (digits.length <= 3) return digits
		if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
		if (digits.length <= 8) return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6)}`
		return `${digits.slice(0, 3)}-${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
	}

	if (digits.length <= 2) return digits
	if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`
	if (digits.length <= 7) return `${digits.slice(0, 2)}-${digits.slice(2, 5)} ${digits.slice(5)}`
	return `${digits.slice(0, 2)}-${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
}

/** Strip +46 for the editable part of PhoneInput. */
export function toNationalPhoneInput(phone) {
	if (!phone) return ''
	const trimmed = String(phone).trim()
	const digits = trimmed.replace(/\D/g, '')

	if (trimmed.startsWith('+46') || (digits.startsWith('46') && trimmed.startsWith('+'))) {
		const national = digits.slice(2)
		return formatSwedishPhone(national.startsWith('0') ? national : `0${national}`)
	}

	if (digits.startsWith('46') && digits.length > 9) {
		const national = digits.slice(2)
		return formatSwedishPhone(national.startsWith('0') ? national : `0${national}`)
	}

	return formatSwedishPhone(trimmed)
}

/** Normalize for tel: links (+46...) */
export function stripSwedishPhoneForTel(phone) {
	if (!phone) return ''
	const trimmed = String(phone).trim()
	const digits = trimmed.replace(/\D/g, '')
	if (!digits) return ''
	if (trimmed.startsWith('+')) return `+${digits}`
	if (digits.startsWith('0')) return `+46${digits.slice(1)}`
	if (digits.startsWith('46')) return `+${digits}`
	return `+46${digits}`
}
