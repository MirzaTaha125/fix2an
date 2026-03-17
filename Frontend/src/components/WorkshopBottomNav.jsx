import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Send, FileCheck, User } from 'lucide-react'

/**
 * Bottom navigation for workshop users. Shown on mobile across all workshop pages.
 * Links: Jobs (requests) | Proposals | Contracts | Profile
 */
export default function WorkshopBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const isActive = (path) => pathname.startsWith(path)

	const linkClass = (path) =>
		`flex flex-col items-center gap-0.5 ${isActive(path) ? 'text-[#05324f] font-medium' : 'text-gray-500'}`

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-md:flex md:hidden justify-around items-center py-2 safe-area-pb">
			<Link to="/workshop/requests" className={linkClass('/workshop/requests')}>
				<FileText className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.jobs') || 'Jobs'}</span>
			</Link>
			<Link to="/workshop/proposals" className={linkClass('/workshop/proposals')}>
				<Send className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.proposals') || 'Proposals'}</span>
			</Link>
			<Link to="/workshop/contracts" className={linkClass('/workshop/contracts')}>
				<FileCheck className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.contracts') || 'Contracts'}</span>
			</Link>
			<Link to="/workshop/profile" className={linkClass('/workshop/profile')}>
				<User className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.profile') || 'Profile'}</span>
			</Link>
		</nav>
	)
}
