// Centralized API Configuration
// ⚠️ IMPORTANT: Update this URL when your ngrok URL changes!
// This is the ONLY place you need to update the backend URL.
// All other files import from this config file.

export const API_BASE_URL = 'https://api.fixa2an.se';

// Strip host from stored upload URLs so only /uploads/... is persisted
export const toStorageUrl = (url) => {
	if (!url) return ''
	if (url.startsWith('/uploads/')) return url
	try {
		const parsed = new URL(url)
		if (parsed.pathname.startsWith('/uploads/')) return parsed.pathname
	} catch {
		// not a valid absolute URL — keep as-is
	}
	return url
}

// Helper function to get full URL for relative paths (like /uploads/...)
export const getFullUrl = (relativePath) => {
	if (!relativePath) return ''
	let url = ''
	if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
		url = relativePath
		// Rewrite localhost URLs saved during local dev
		try {
			const parsed = new URL(url)
			if (
				(parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
				parsed.pathname.startsWith('/uploads/')
			) {
				const base = (API_BASE_URL || '').replace(/\/+$/, '')
				url = base ? base + parsed.pathname + parsed.search : parsed.pathname
			}
		} catch {
			// keep original url
		}
	} else {
		const base = (API_BASE_URL || '').replace(/\/+$/, '')
		const path = '/' + (relativePath || '').replace(/^\/+/, '')
		url = base ? base + path : path
	}

	// Add ngrok skip warning parameter if it's an ngrok URL
	if (url.includes('ngrok-free.dev') || url.includes('ngrok.io')) {
		const separator = url.includes('?') ? '&' : '?'
		return `${url}${separator}ngrok-skip-browser-warning=true`
	}

	return url
}

