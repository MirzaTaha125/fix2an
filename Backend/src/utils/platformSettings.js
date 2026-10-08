import PlatformSettings from '../models/PlatformSettings.js'

export function defaultCommissionRate() {
	const raw = Number(process.env.COMMISSION_RATE)
	if (!Number.isFinite(raw) || raw < 0) return 10
	return raw <= 1 ? Math.round(raw * 1000) / 10 : raw
}

export function defaultVatRate() {
	const raw = Number(process.env.VAT_RATE)
	if (!Number.isFinite(raw) || raw < 0) return 15
	return raw <= 1 ? Math.round(raw * 1000) / 10 : raw
}

export async function getPlatformRates() {
	const doc = await PlatformSettings.findOne().lean()
	return {
		commissionRate: doc?.commissionRate ?? defaultCommissionRate(),
		vatRate: doc?.vatRate ?? defaultVatRate(),
	}
}
