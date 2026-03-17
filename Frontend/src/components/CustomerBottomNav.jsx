import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Upload, User } from 'lucide-react'

/**
 * Bottom navigation for customer users. Shown on mobile.
 * Links: My Cases | Upload | Profile
 */
export default function CustomerBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const isActive = (path) => (path === '/profile' ? pathname === '/profile' : pathname.startsWith(path))

	const linkClass = (path) =>
		`flex flex-col items-center gap-0.5 ${isActive(path) ? 'text-[#05324f] font-medium' : 'text-gray-500'}`

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-md:flex md:hidden justify-around items-center py-2 safe-area-pb">
			<Link to="/my-cases" className={linkClass('/my-cases')}>
				<FolderOpen className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.my_cases') || 'My Cases'}</span>
			</Link>
			<Link to="/upload" className={linkClass('/upload')}>
				<Upload className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.upload') || 'Upload'}</span>
			</Link>
			<Link to="/profile" className={linkClass('/profile')}>
				<User className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.profile') || 'Profile'}</span>
			</Link>
		</nav>
	)
}
