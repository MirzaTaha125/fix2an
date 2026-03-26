import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CustomerBottomNav from './CustomerBottomNav'
import WorkshopBottomNav from './WorkshopBottomNav'
import GuestBottomNav from './GuestBottomNav'
import AdminBottomNav from './AdminBottomNav'

export default function BottomNavManager() {
	const { pathname } = useLocation()
	const { user, loading } = useAuth()

	if (loading) return null

	const workshopPaths = ['/', '/en', '/sv', '/workshop/requests', '/workshop/proposals', '/workshop/contracts', '/workshop/profile', '/workshop/dashboard']
	const customerPaths = ['/', '/en', '/sv', '/my-cases', '/upload', '/profile']
	const guestPaths = ['/', '/en', '/sv', '/auth/signin', '/auth/signup', '/auth/forgot-password']
	const adminPaths = ['/', '/en', '/sv', '/admin']

	const isExactMatchOrBase = (allowedPaths) => {
		return allowedPaths.some(p => pathname === p || pathname === p + '/')
	}

	if (!user) {
		if (isExactMatchOrBase(guestPaths)) {
			return <GuestBottomNav />
		}
		return null
	}

	if (user.role === 'WORKSHOP' && isExactMatchOrBase(workshopPaths)) {
		return <WorkshopBottomNav />
	}

	if (user.role === 'CUSTOMER' && isExactMatchOrBase(customerPaths)) {
		return <CustomerBottomNav />
	}

	if (user.role === 'ADMIN' && isExactMatchOrBase(adminPaths)) {
		return <AdminBottomNav />
	}

	return null
}
