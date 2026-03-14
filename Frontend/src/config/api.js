// Centralized API Configuration
// ⚠️ IMPORTANT: Update this URL when your ngrok URL changes!
// This is the ONLY place you need to update the backend URL.
// All other files import from this config file.

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://peristomatic-hecht-kynlee.ngrok-free.dev'

// Helper function to get full URL for relative paths (like /uploads/...)
export const getFullUrl = (relativePath) => {
	if (!relativePath) return ''
	if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
		return relativePath
	}
	const base = (API_BASE_URL || '').replace(/\/+$/, '')
	const path = '/' + (relativePath || '').replace(/^\/+/, '')
	return base ? base + path : path
}

