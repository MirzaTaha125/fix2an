export const DEFAULT_COMMISSION_RATE = 10
export const DEFAULT_VAT_RATE = 15

export function normalizeRate(value, fallback) {
	const n = Number(value)
	if (!Number.isFinite(n) || n < 0) return fallback
	return n
}

export function vatFactor(vatRate = DEFAULT_VAT_RATE) {
	return 1 + normalizeRate(vatRate, DEFAULT_VAT_RATE) / 100
}

export function calcVatAmount(subtotal, vatRate = DEFAULT_VAT_RATE) {
	const base = Math.round(Number(subtotal) || 0)
	return Math.round(base * normalizeRate(vatRate, DEFAULT_VAT_RATE) / 100)
}

export function quoteTotalsFromCosts(laborCost, partsCost, otherCost, vatRate = DEFAULT_VAT_RATE) {
	const subtotal =
		Math.round(Number(laborCost) || 0) +
		Math.round(Number(partsCost) || 0) +
		Math.round(Number(otherCost) || 0)
	const vat = calcVatAmount(subtotal, vatRate)
	return { subtotal, vat, total: subtotal + vat }
}

export function resolveVatRate(offer, fallback = DEFAULT_VAT_RATE) {
	if (offer?.vatRate != null && Number.isFinite(Number(offer.vatRate))) {
		return Number(offer.vatRate)
	}
	return fallback
}
