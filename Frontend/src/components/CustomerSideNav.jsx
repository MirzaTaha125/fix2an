import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCustomerUnreadCount } from '../context/CustomerUnreadCountContext'
import OfferCountBadge from './OfferCountBadge'
import {
	NavCasesIcon,
	NavHomeIcon,
	NavMessagesIcon,
	NavProfileIcon,
} from './icons/CustomerNavIcons'
import mainLogo from '../assets/sidebar_logo.png'

const ITEMS = [
	{ id: 'home', to: '/dashboard', icon: NavHomeIcon },
	{ id: 'cases', to: '/contract', icon: NavCasesIcon },
	{ id: 'messages', to: '/contract?view=messages', icon: NavMessagesIcon },
	{ id: 'profile', to: '/profile', icon: NavProfileIcon },
]

export default function CustomerSideNav() {
	const { pathname, search } = useLocation()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { logout } = useAuth()
	const unreadCount = useCustomerUnreadCount()
	const isMessages = pathname === '/contract' && new URLSearchParams(search).get('view') === 'messages'

	const activeId = isMessages
		? 'messages'
		: pathname === '/contract'
			? 'cases'
			: pathname === '/dashboard'
				? 'home'
				: pathname.startsWith('/profile')
					? 'profile'
					: ''

	const labels = {
		home: t('navigation.overview'),
		cases: t('navigation.my_cases'),
		messages: t('navigation.messages'),
		profile: t('navigation.settings'),
	}

	return (
		<aside className="customer-side-nav hidden lg:flex fixed inset-y-0 left-0 w-[260px] bg-[#12244C] z-40 flex-col overflow-hidden">
			<div className="px-5 pt-6 pb-4">
				<Link to="/dashboard" className="inline-flex" aria-label="Fixa2an">
					<img src={mainLogo} alt="Fixa2an" className="h-11 w-auto object-contain" />
				</Link>
			</div>
			<nav className="flex-1 px-3 space-y-1 overflow-y-auto">
				{ITEMS.map((item) => {
					const Icon = item.icon
					const active = activeId === item.id
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => navigate(item.to)}
							className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
								active ? 'bg-brand-btn text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
							}`}
						>
							<Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
							<span className="flex-1 truncate">{labels[item.id]}</span>
							{item.id === 'messages' && <OfferCountBadge count={unreadCount} />}
						</button>
					)
				})}
			</nav>
			<button
				type="button"
				onClick={() => {
					logout()
					navigate('/auth/signin', { replace: true })
				}}
				className="mx-3 mb-5 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/75 hover:bg-white/10 hover:text-white"
			>
				<LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
				{t('navigation.logout')}
			</button>
		</aside>
	)
}
