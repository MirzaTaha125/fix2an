const WIKI_API = 'https://en.wikipedia.org/w/api.php'
const CAR_IMAGES_BASE = 'https://carimagesapi.com'

const imageCache = new Map()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function toSlug(name) {
	return String(name || '')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function buildSearchQueries(make, model, year) {
	const queries = []
	if (model) {
		if (year) queries.push(`${make} ${model} ${year}`)
		queries.push(`${make} ${model}`)
		queries.push(`${model} ${make}`)
	}
	queries.push(`${make} ${model || ''} automobile`.trim())
	return [...new Set(queries.filter(Boolean))]
}

function scoreResult(title, make, model) {
	const t = title.toLowerCase()
	const makeL = make.toLowerCase()
	const modelL = model?.toLowerCase()

	if (modelL && !t.includes(modelL)) return -1

	let score = 1
	if (modelL && t.includes(modelL)) score += 5
	if (t.includes(makeL)) score += 2

	// Prefer actual model pages over manufacturer pages
	if (t === `${makeL} cars` || t === makeL) score -= 4
	if (t.endsWith(' motors') && modelL && !t.includes(modelL)) score -= 3

	return score
}

async function searchWikipediaThumbnail(searchTerm, thumbSize = 500) {
	const params = new URLSearchParams({
		action: 'query',
		format: 'json',
		origin: '*',
		generator: 'search',
		gsrsearch: searchTerm,
		gsrlimit: '8',
		prop: 'pageimages',
		piprop: 'thumbnail',
		pithumbsize: String(thumbSize),
	})

	const response = await fetch(`${WIKI_API}?${params.toString()}`)
	if (!response.ok) return null

	const data = await response.json()
	const pages = data?.query?.pages
	if (!pages) return null

	return Object.values(pages)
}

async function fetchWikipediaImageUrl({ make, model, year, width = 500 }) {
	if (!make) return null

	const queries = buildSearchQueries(make, model, year)
	let best = null

	for (const query of queries) {
		const pages = await searchWikipediaThumbnail(query, width)
		if (!pages?.length) continue

		for (const page of pages) {
			const thumb = page.thumbnail?.source
			if (!thumb) continue

			const score = scoreResult(page.title, make, model)
			if (score < 0) continue

			if (!best || score > best.score) {
				best = { url: thumb, score, title: page.title }
			}
		}

		if (best?.score >= 6) break
	}

	return best?.url || null
}

async function fetchBrandLogoUrl(make) {
	const slug = toSlug(make)
	if (!slug) return null

	try {
		const response = await fetch(`${CAR_IMAGES_BASE}/api/v1/makes/${slug}/logo`, {
			method: 'HEAD',
		})
		if (response.ok) {
			return `${CAR_IMAGES_BASE}/api/v1/makes/${slug}/logo`
		}
	} catch {
		// fall through
	}

	return `${CAR_IMAGES_BASE}/makes/${slug}.png`
}

export async function resolveVehicleImageUrl({ make, model, year, width = 500 }) {
	const cacheKey = `${make}|${model || ''}|${year || ''}|${width}`
	const cached = imageCache.get(cacheKey)
	if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
		return cached.value
	}

	const wikiUrl = await fetchWikipediaImageUrl({ make, model, year, width })
	if (wikiUrl) {
		const result = { url: wikiUrl, source: 'wikipedia' }
		imageCache.set(cacheKey, { at: Date.now(), value: result })
		return result
	}

	const logoUrl = await fetchBrandLogoUrl(make)
	const result = logoUrl
		? { url: logoUrl, source: 'logo' }
		: { url: null, source: null }

	imageCache.set(cacheKey, { at: Date.now(), value: result })
	return result
}
