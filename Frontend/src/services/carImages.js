import { vehiclesAPI } from './api'

export async function fetchCarMakes() {
	const res = await vehiclesAPI.getMakes()
	return res.data?.data || []
}

export async function fetchCarModels(makeSlug) {
	if (!makeSlug) return []
	const res = await vehiclesAPI.getModels(makeSlug)
	return res.data?.data || []
}

export function findMakeByName(makes, name) {
	if (!name) return null
	const normalized = name.trim().toLowerCase()
	return makes.find(
		(m) =>
			m.name.toLowerCase() === normalized ||
			m.slug.toLowerCase() === normalized.replace(/\s+/g, '-')
	)
}

export function findModelByName(models, name) {
	if (!name) return null
	const normalized = name.trim().toLowerCase()
	return models.find(
		(m) =>
			m.name.toLowerCase() === normalized ||
			m.slug.toLowerCase() === normalized.replace(/\s+/g, '-')
	)
}
