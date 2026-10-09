import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCustomerUnreadCount } from '../context/CustomerUnreadCountContext'
import OfferCountBadge from './OfferCountBadge'
import {
	NavCasesIcon,
	NavHomeIcon,
	NavMessagesIcon,
	NavProfileIcon,
} from './icons/CustomerNavIcons'

const ACTIVE_GREEN = '#018A04'
const INACTIVE_COLOR = '#05324f'

function NavLinkItem({ to, icon: Icon, label, active, badge }) {
	return (
		<Link
			to={to}
			className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-w-0 transition-colors"
			style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
		>
			<span className="relative flex items-center justify-center w-6 h-6">
				<Icon
					className="w-6 h-6 shrink-0"
					strokeWidth={1.85}
					filled={active}
					style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
				/>
				<OfferCountBadge count={badge} className="absolute -top-1.5 -right-2.5" />
			</span>
			<span className={`text-[11px] truncate ${active ? 'font-medium' : 'font-normal'}`}>
				{label}
			</span>
		</Link>
	)
}

export default function CustomerMobileNav() {
	const { pathname, search } = useLocation()
	const { t } = useTranslation()
	const unreadCount = useCustomerUnreadCount()
	const params = new URLSearchParams(search)
	const isMessagesView = pathname === '/contract' && params.get('view') === 'messages'

	const isHome = pathname === '/upload' && !params.get('path') && !params.get('edit') && !params.get('requestId') && params.get('mode') !== 'no-image' && params.get('sent') !== '1'
	const isCases = pathname === '/contract' && !isMessagesView
	const isMessages = isMessagesView
	const isProfile = pathname === '/profile' || pathname.startsWith('/profile')

	return (
		<div className="flex items-stretch w-full bg-white min-h-[60px]">
			<NavLinkItem
				to="/upload"
				icon={NavHomeIcon}
				label={t('navigation.overview')}
				active={isHome}
			/>
			<NavLinkItem
				to="/contract"
				icon={NavCasesIcon}
				label={t('navigation.my_cases')}
				active={isCases}
			/>
			<NavLinkItem
				to="/contract?view=messages"
				icon={NavMessagesIcon}
				label={t('navigation.messages')}
				active={isMessages}
				badge={unreadCount}
			/>
			<NavLinkItem
				to="/profile"
				icon={NavProfileIcon}
				label={t('navigation.settings')}
				active={isProfile}
			/>
		</div>
	)
}
