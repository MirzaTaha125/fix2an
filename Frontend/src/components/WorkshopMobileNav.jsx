import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
	NavCasesIcon,
	NavHomeIcon,
	NavJobsIcon,
	NavSettingsIcon,
} from './icons/CustomerNavIcons'

const ACTIVE_GREEN = '#018A04'
const INACTIVE_COLOR = '#05324f'

function NavLinkItem({ to, icon: Icon, label, active }) {
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
			</span>
			<span className={`text-[11px] truncate ${active ? 'font-medium' : 'font-normal'}`}>
				{label}
			</span>
		</Link>
	)
}

export default function WorkshopMobileNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()

	const isOverview = pathname.startsWith('/workshop/dashboard')
	const isCases = pathname.startsWith('/workshop/requests') || pathname.startsWith('/workshop/proposals')
	const isJobs = pathname.startsWith('/workshop/contracts')
	const isSettings = pathname.startsWith('/workshop/settings')

	return (
		<div className="flex items-stretch w-full bg-white min-h-[60px]">
			<NavLinkItem
				to="/workshop/dashboard"
				icon={NavHomeIcon}
				label={t('workshop.panel.nav.overview')}
				active={isOverview}
			/>
			<NavLinkItem
				to="/workshop/requests"
				icon={NavCasesIcon}
				label={t('workshop.panel.nav.cases')}
				active={isCases}
			/>
			<NavLinkItem
				to="/workshop/contracts"
				icon={NavJobsIcon}
				label={t('workshop.panel.nav.jobs')}
				active={isJobs}
			/>
			<NavLinkItem
				to="/workshop/settings"
				icon={NavSettingsIcon}
				label={t('workshop.panel.nav.settings')}
				active={isSettings}
			/>
		</div>
	)
}
