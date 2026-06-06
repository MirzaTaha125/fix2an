import { Link, useLocation } from 'react-router-dom'
import { Tag, FileText, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCustomerOfferCount } from '../context/CustomerOfferCountContext'
import OfferCountBadge from './OfferCountBadge'

const ACTIVE_GREEN = '#438B3E'
const INACTIVE_COLOR = '#333333'

function NavLinkItem({ to, icon: Icon, label, active, badge }) {
	return (
		<Link
			to={to}
			className="relative flex flex-1 items-center justify-center gap-2 py-3 min-w-0 transition-colors"
			style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
		>
			<Icon
				className="w-[18px] h-[18px] shrink-0"
				strokeWidth={1.75}
				style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
			/>
			<span className={`text-[13px] sm:text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
				{label}
			</span>
			<OfferCountBadge count={badge} className="ml-0.5" />
			{active && (
				<span
					className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
					style={{ backgroundColor: ACTIVE_GREEN }}
				/>
			)}
		</Link>
	)
}

export default function CustomerMobileNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const offerCount = useCustomerOfferCount()

	const isOffers = pathname === '/offers' || pathname.startsWith('/offers?') || pathname === '/book-appointment'
	const isContract = pathname === '/contract' || pathname.startsWith('/contract')
	const isProfile = pathname === '/profile' || pathname.startsWith('/profile')

	return (
		<div className="flex items-stretch w-full bg-white">
			<NavLinkItem
				to="/offers"
				icon={Tag}
				label={t('navigation.offers') || 'Offers'}
				active={isOffers}
				badge={offerCount}
			/>
			<NavLinkItem
				to="/contract"
				icon={FileText}
				label={t('navigation.contract') || 'Contract'}
				active={isContract}
			/>
			<NavLinkItem
				to="/profile"
				icon={User}
				label={t('navigation.profile') || 'Profile'}
				active={isProfile}
			/>
		</div>
	)
}
