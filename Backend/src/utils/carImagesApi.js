const CAR_IMAGES_BASE = 'https://carimagesapi.com'

/** Popular brands for Sweden/EU — used when CarImages REST API is unavailable */
export const FALLBACK_MAKES = [
	{ slug: 'volvo', name: 'Volvo' },
	{ slug: 'saab', name: 'Saab' },
	{ slug: 'bmw', name: 'BMW' },
	{ slug: 'mercedes-benz', name: 'Mercedes-Benz' },
	{ slug: 'audi', name: 'Audi' },
	{ slug: 'volkswagen', name: 'Volkswagen' },
	{ slug: 'toyota', name: 'Toyota' },
	{ slug: 'honda', name: 'Honda' },
	{ slug: 'ford', name: 'Ford' },
	{ slug: 'opel', name: 'Opel' },
	{ slug: 'peugeot', name: 'Peugeot' },
	{ slug: 'renault', name: 'Renault' },
	{ slug: 'citroen', name: 'Citroën' },
	{ slug: 'fiat', name: 'Fiat' },
	{ slug: 'nissan', name: 'Nissan' },
	{ slug: 'mazda', name: 'Mazda' },
	{ slug: 'hyundai', name: 'Hyundai' },
	{ slug: 'kia', name: 'Kia' },
	{ slug: 'skoda', name: 'Škoda' },
	{ slug: 'seat', name: 'SEAT' },
	{ slug: 'porsche', name: 'Porsche' },
	{ slug: 'mini', name: 'MINI' },
	{ slug: 'land-rover', name: 'Land Rover' },
	{ slug: 'jeep', name: 'Jeep' },
	{ slug: 'subaru', name: 'Subaru' },
	{ slug: 'mitsubishi', name: 'Mitsubishi' },
	{ slug: 'suzuki', name: 'Suzuki' },
	{ slug: 'lexus', name: 'Lexus' },
	{ slug: 'tesla', name: 'Tesla' },
	{ slug: 'dacia', name: 'Dacia' },
	{ slug: 'cupra', name: 'CUPRA' },
	{ slug: 'polestar', name: 'Polestar' },
]

const POPULAR_SLUGS = FALLBACK_MAKES.map((m) => m.slug)

function sortMakes(makes) {
	const popular = []
	const rest = []
	for (const make of makes) {
		if (POPULAR_SLUGS.includes(make.slug)) popular.push(make)
		else rest.push(make)
	}
	popular.sort((a, b) => POPULAR_SLUGS.indexOf(a.slug) - POPULAR_SLUGS.indexOf(b.slug))
	rest.sort((a, b) => a.name.localeCompare(b.name))
	return [...popular, ...rest]
}

async function fetchFromCarImagesApi(path) {
	const apiKey = process.env.CAR_IMAGES_API_KEY
	const apiSecret = process.env.CAR_IMAGES_API_SECRET
	if (!apiKey || !apiSecret) return null

	const url = new URL(`${CAR_IMAGES_BASE}${path}`)
	url.searchParams.set('api_key', apiKey)

	const res = await fetch(url, {
		headers: { 'X-Api-Secret': apiSecret },
	})
	if (!res.ok) {
		console.warn(`[CarImages] ${path} → ${res.status}`)
		return null
	}

	const json = await res.json()
	return json.data || []
}

export async function getCarMakes() {
	const apiMakes = await fetchFromCarImagesApi('/api/v1/makes')
	if (apiMakes?.length) {
		return { data: sortMakes(apiMakes), source: 'api' }
	}
	return { data: FALLBACK_MAKES, source: 'fallback' }
}

export async function getCarModels(makeSlug) {
	if (!makeSlug) return { data: [], source: 'fallback' }

	const apiModels = await fetchFromCarImagesApi(
		`/api/v1/makes/${encodeURIComponent(makeSlug)}/models`
	)
	if (apiModels?.length) {
		const sorted = [...apiModels].sort((a, b) => a.name.localeCompare(b.name))
		return { data: sorted, source: 'api' }
	}
	return { data: [], source: 'fallback' }
}
