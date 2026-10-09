export function getRoleHomePath(user) {
	if (!user) return '/upload'

	const role = user.role?.toUpperCase()

	if (role === 'ADMIN') return '/admin'

	if (role === 'WORKSHOP') {
		const rawStatus = user.workshop?.verificationStatus?.toUpperCase()
		const verificationStatus = user.isVerified ? 'APPROVED' : (rawStatus || 'PENDING')

		if (verificationStatus === 'REJECTED') return '/workshop/rejected'
		if (verificationStatus === 'PENDING') return '/workshop/pending'
		return '/workshop/dashboard'
	}

	return '/upload'
}

export function getRoleLogoPath(user) {
	if (!user) return '/upload'

	const role = user.role?.toUpperCase()

	if (role === 'ADMIN') return '/admin'

	if (role === 'WORKSHOP') {
		const rawStatus = user.workshop?.verificationStatus?.toUpperCase()
		const verificationStatus = user.isVerified ? 'APPROVED' : (rawStatus || 'PENDING')

		if (verificationStatus === 'REJECTED') return '/workshop/rejected'
		if (verificationStatus === 'PENDING') return '/workshop/pending'
		return '/workshop/dashboard'
	}

	return '/upload'
}
