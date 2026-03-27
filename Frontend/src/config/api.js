// Centralized API Configuration
// ⚠️ IMPORTANT: Update this URL when your ngrok URL changes!
// This is the ONLY place you need to update the backend URL.
// All other files import from this config file.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://peristomatic-hecht-kynlee.ngrok-free.dev'

// Helper function to get full URL for relative paths (like /uploads/...)
export const getFullUrl = (relativePath) => {
	if (!relativePath) return ''
	let url = ''
	if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
		url = relativePath
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

