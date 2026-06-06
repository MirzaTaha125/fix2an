export function getRoleHomePath(user) {
	if (!user) return '/'

	const role = user.role?.toUpperCase()

	if (role === 'ADMIN') return '/admin'

	if (role === 'WORKSHOP') {
		const rawStatus = user.workshop?.verificationStatus?.toUpperCase()
		const verificationStatus = user.isVerified ? 'APPROVED' : (rawStatus || 'PENDING')

		if (verificationStatus === 'REJECTED') return '/workshop/rejected'
		if (verificationStatus === 'PENDING') return '/workshop/pending'
		return '/workshop/dashboard'
	}

	return '/dashboard'
}

export function getRoleLogoPath(user) {
	if (!user) return '/'

	const role = user.role?.toUpperCase()

	if (role === 'ADMIN') return '/admin'

	if (role === 'WORKSHOP') {
		const rawStatus = user.workshop?.verificationStatus?.toUpperCase()
		const verificationStatus = user.isVerified ? 'APPROVED' : (rawStatus || 'PENDING')

		if (verificationStatus === 'REJECTED') return '/workshop/rejected'
		if (verificationStatus === 'PENDING') return '/workshop/pending'
		return '/workshop/dashboard'
	}

	return '/dashboard'
}
