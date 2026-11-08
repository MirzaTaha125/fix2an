export function isAdminHost(hostname = typeof window !== 'undefined' ? window.location.hostname : '') {
	const host = String(hostname || '').toLowerCase()
	if (!host) return false
	if (host === 'admin.fixa2an.se' || host === 'admin.localhost') return true
	const extra = String(import.meta.env.VITE_ADMIN_HOSTS || '')
		.split(',')
		.map((value) => value.trim().toLowerCase())
		.filter(Boolean)
	return extra.includes(host)
}

export function getAdminHomePath() {
	return isAdminHost() ? '/' : '/admin'
}

export function isAdminAppPath(pathname = '') {
	if (pathname.startsWith('/admin')) return true
	if (isAdminHost() && (pathname === '/' || pathname === '')) return true
	return false
}
