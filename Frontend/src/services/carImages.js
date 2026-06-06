const CAR_IMAGES_BASE = 'https://carimagesapi.com'

/** Popular brands shown first in upload form (Sweden/EU focus) */
export const POPULAR_MAKE_SLUGS = [
	'volvo', 'saab', 'bmw', 'mercedes-benz', 'audi', 'volkswagen', 'toyota',
	'honda', 'ford', 'opel', 'peugeot', 'renault', 'citroen', 'fiat',
	'nissan', 'mazda', 'hyundai', 'kia', 'skoda', 'seat',
]

export async function fetchCarMakes() {
	const res = await fetch(`${CAR_IMAGES_BASE}/api/v1/makes`)
	if (!res.ok) throw new Error('Failed to load car brands')
	const json = await res.json()
	const makes = json.data || []

	const popular = []
	const rest = []

	for (const make of makes) {
		if (POPULAR_MAKE_SLUGS.includes(make.slug)) {
			popular.push(make)
		} else {
			rest.push(make)
		}
	}

	popular.sort(
		(a, b) => POPULAR_MAKE_SLUGS.indexOf(a.slug) - POPULAR_MAKE_SLUGS.indexOf(b.slug)
	)
	rest.sort((a, b) => a.name.localeCompare(b.name))

	return [...popular, ...rest]
}

export async function fetchCarModels(makeSlug) {
	if (!makeSlug) return []
	const res = await fetch(`${CAR_IMAGES_BASE}/api/v1/makes/${encodeURIComponent(makeSlug)}/models`)
	if (!res.ok) throw new Error('Failed to load car models')
	const json = await res.json()
	const models = json.data || []
	return models.sort((a, b) => a.name.localeCompare(b.name))
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
