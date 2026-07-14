const STORAGE_KEY = 'fixa2an_maintenance_bypass'

/** True when Vercel/production should show the under-construction page. */
export function isMaintenanceModeEnabled() {
	return import.meta.env.VITE_MAINTENANCE_MODE === 'true'
}

/**
 * Optional team bypass: visit /?access=YOUR_SECRET once.
 * Set the same value in VITE_MAINTENANCE_BYPASS on Vercel.
 */
export function hasMaintenanceBypass() {
	const secret = import.meta.env.VITE_MAINTENANCE_BYPASS
	if (!secret || typeof window === 'undefined') return false

	try {
		const params = new URLSearchParams(window.location.search)
		const fromQuery = params.get('access')
		if (fromQuery && fromQuery === secret) {
			sessionStorage.setItem(STORAGE_KEY, secret)
			params.delete('access')
			const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`
			window.history.replaceState({}, '', clean)
			return true
		}
		return sessionStorage.getItem(STORAGE_KEY) === secret
	} catch {
		return false
	}
}

export function shouldShowMaintenancePage() {
	return isMaintenanceModeEnabled() && !hasMaintenanceBypass()
}
