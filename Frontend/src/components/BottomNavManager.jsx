import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import CustomerBottomNav from './CustomerBottomNav'
import CustomerMobileTopBar from './CustomerMobileTopBar'
import CustomerSideNav from './CustomerSideNav'
import WorkshopBottomNav from './WorkshopBottomNav'

function isWorkshopAppPath(pathname) {
	if (!pathname.startsWith('/workshop')) return false
	const excluded = [
		'/workshop/login',
		'/workshop/signup',
		'/workshop/pending',
		'/workshop/rejected',
	]
	if (pathname === '/workshop' || pathname === '/workshop/') return false
	return !excluded.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/** Screens opened from the hamburger menu — no bottom tab bar. */
function isWorkshopMenuOnlyPath(pathname) {
	const menuPaths = [
		'/workshop/messages',
		'/workshop/calendar',
		'/workshop/statistics',
		'/workshop/profile',
	]
	return menuPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export default function BottomNavManager() {
	const { pathname } = useLocation()
	const { user, loading } = useAuth()

	if (loading) return null
	if (!user) return null

	if (user.role === 'WORKSHOP' && isWorkshopAppPath(pathname) && !isWorkshopMenuOnlyPath(pathname)) {
		return <WorkshopBottomNav />
	}

	if (user.role === 'CUSTOMER') {
		return (
			<>
				<CustomerMobileTopBar />
				<CustomerSideNav />
				<CustomerBottomNav />
			</>
		)
	}

	return null
}
