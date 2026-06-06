import { Link, useLocation } from 'react-router-dom'
import { FileText, Send, FileCheck, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ACTIVE_GREEN = '#438B3E'
const INACTIVE_COLOR = '#333333'

function NavLinkItem({ to, icon: Icon, label, active }) {
	return (
		<Link
			to={to}
			className="relative flex flex-1 items-center justify-center gap-1.5 sm:gap-2 py-3 min-w-0 transition-colors px-1"
			style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
		>
			<Icon
				className="w-[18px] h-[18px] shrink-0"
				strokeWidth={1.75}
				style={{ color: active ? ACTIVE_GREEN : INACTIVE_COLOR }}
			/>
			<span className={`text-[11px] sm:text-[13px] md:text-sm truncate ${active ? 'font-semibold' : 'font-medium'}`}>
				{label}
			</span>
			{active && (
				<span
					className="absolute bottom-0 left-2 right-2 sm:left-3 sm:right-3 h-[2px] rounded-full"
					style={{ backgroundColor: ACTIVE_GREEN }}
				/>
			)}
		</Link>
	)
}

export default function WorkshopMobileNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const isJobs = pathname.startsWith('/workshop/requests')
	const isProposals = pathname.startsWith('/workshop/proposals')
	const isContracts = pathname.startsWith('/workshop/contracts')
	const isProfile = pathname.startsWith('/workshop/profile')

	return (
		<div className="flex items-stretch w-full bg-white">
			<NavLinkItem
				to="/workshop/requests"
				icon={FileText}
				label={t('navigation.jobs') || 'Jobs'}
				active={isJobs}
			/>
			<NavLinkItem
				to="/workshop/proposals"
				icon={Send}
				label={t('navigation.proposals') || 'Proposals'}
				active={isProposals}
			/>
			<NavLinkItem
				to="/workshop/contracts"
				icon={FileCheck}
				label={t('navigation.contracts') || 'Contracts'}
				active={isContracts}
			/>
			<NavLinkItem
				to="/workshop/profile"
				icon={User}
				label={t('navigation.profile') || 'Profile'}
				active={isProfile}
			/>
		</div>
	)
}
