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

/** Fallback models when CarImages API is unavailable */
export const FALLBACK_MODELS = {
	volvo: ['C30', 'C40', 'C70', 'S40', 'S60', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90'],
	saab: ['9-3', '9-5', '900', '9000'],
	bmw: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'i3', 'i4', 'iX'],
	'mercedes-benz': ['A-Class', 'B-Class', 'C-Class', 'CLA', 'CLS', 'E-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'S-Class', 'V-Class'],
	audi: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT'],
	volkswagen: ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'T-Cross', 'Touareg', 'Arteon', 'ID.3', 'ID.4', 'ID.Buzz', 'Caddy', 'Transporter'],
	toyota: ['Aygo', 'Yaris', 'Corolla', 'Camry', 'C-HR', 'RAV4', 'Highlander', 'Land Cruiser', 'Prius', 'bZ4X', 'Hilux'],
	honda: ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'e'],
	ford: ['Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Mustang', 'Ranger', 'Transit'],
	opel: ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Crossland', 'Grandland'],
	peugeot: ['208', '308', '508', '2008', '3008', '5008', 'Partner', 'Expert'],
	renault: ['Clio', 'Captur', 'Megane', 'Scenic', 'Kadjar', 'Austral', 'Arkana', 'Zoe', 'Trafic'],
	citroen: ['C1', 'C3', 'C4', 'C5 Aircross', 'Berlingo', 'Jumpy'],
	fiat: ['500', 'Panda', 'Tipo', '500X', 'Doblo'],
	nissan: ['Micra', 'Leaf', 'Juke', 'Qashqai', 'X-Trail', 'Navara'],
	mazda: ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5'],
	hyundai: ['i10', 'i20', 'i30', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq', 'Ioniq 5'],
	kia: ['Picanto', 'Rio', 'Ceed', 'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6'],
	skoda: ['Fabia', 'Scala', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq'],
	seat: ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco'],
	porsche: ['911', 'Cayman', 'Boxster', 'Macan', 'Cayenne', 'Panamera', 'Taycan'],
	mini: ['Cooper', 'Countryman', 'Clubman', 'Convertible'],
	'land-rover': ['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
	jeep: ['Renegade', 'Compass', 'Wrangler', 'Grand Cherokee', 'Avenger'],
	subaru: ['Impreza', 'XV', 'Forester', 'Outback', 'Solterra'],
	mitsubishi: ['Space Star', 'ASX', 'Eclipse Cross', 'Outlander'],
	suzuki: ['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny'],
	lexus: ['UX', 'NX', 'RX', 'ES', 'IS', 'LS'],
	tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
	dacia: ['Sandero', 'Logan', 'Duster', 'Jogger', 'Spring'],
	cupra: ['Born', 'Formentor', 'Leon', 'Ateca', 'Tavascan'],
	polestar: ['2', '3', '4'],
}

function modelsFromFallback(makeSlug) {
	const names = FALLBACK_MODELS[makeSlug] || []
	return names.map((name) => ({
		slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
		name,
	}))
}

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
	const fallback = modelsFromFallback(makeSlug)
	return { data: fallback, source: 'fallback' }
}
