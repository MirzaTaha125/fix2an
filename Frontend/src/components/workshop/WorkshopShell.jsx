import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
	Home,
	FileSearch,
	CalendarCheck,
	Mail,
	LineChart,
	UserRound,
	Settings,
	LogOut,
	Menu,
	MoreVertical,
	ChevronRight,
	ArrowLeft,
	X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMobileBack } from '../../context/MobileBackContext'
import { WorkshopHeaderActionsProvider, useWorkshopHeaderActions } from '../../context/WorkshopHeaderActionsContext'
import { useRefreshWorkshopUnreadCount, useWorkshopUnreadCount } from '../../context/WorkshopUnreadCountContext'
import { workshopAPI } from '../../services/api'
import OfferCountBadge from '../OfferCountBadge'
import WorkshopImage from '../WorkshopImage'
import { Button } from '../ui/Button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog'
import mainLogo from '../../assets/main_logo.png'

let cachedWorkshop = null

const NAV = [
	{ to: '/workshop/dashboard', key: 'overview', icon: Home, end: true },
	{ to: '/workshop/requests', key: 'cases', icon: FileSearch },
	{ to: '/workshop/contracts', key: 'jobs', icon: CalendarCheck },
	{ to: '/workshop/messages', key: 'messages', icon: Mail },
	{ to: '/workshop/statistics', key: 'statistics', icon: LineChart },
	{ to: '/workshop/profile', key: 'profile', icon: UserRound },
	{ to: '/workshop/settings', key: 'settings', icon: Settings },
]

const MOBILE_MENU = [
	{ to: '/workshop/dashboard', key: 'overview', end: true },
	{ to: '/workshop/messages', key: 'messages' },
	{ to: '/workshop/calendar', key: 'calendar' },
	{ to: '/workshop/statistics', key: 'statistics' },
	{ to: '/workshop/profile', key: 'profile' },
]

function SideNav({ onNavigate, workshop, onLogoutClick }) {
	const { t } = useTranslation()
	const unreadCount = useWorkshopUnreadCount()
	const workshopId = workshop?.organizationNumber
		|| String(workshop?._id || workshop?.id || '').slice(-5).toUpperCase()
		|| '—'

	return (
		<nav className="flex flex-col h-full bg-white border-r border-[#E8ECF1]">
			<div className="px-5 pt-6 pb-5">
				<img src={mainLogo} alt="Fixa2an" className="h-12 w-auto object-contain" />
				{workshop?.companyName ? (
					<div className="mt-5">
						<p className="text-[15px] font-bold text-[#05324f] leading-snug truncate">
							{workshop.companyName}
						</p>
						<p className="text-xs text-[#9CA3AF] mt-1 truncate">
							{t('workshop.panel.workshop_id')}: {workshopId}
						</p>
					</div>
				) : null}
			</div>
			<div className="flex-1 px-3 space-y-1 overflow-y-auto">
				{NAV.map((item) => {
					const Icon = item.icon
					return (
						<NavLink
							key={item.to}
							to={item.to}
							end={item.end}
							onClick={onNavigate}
							className={({ isActive }) =>
								`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
									isActive
										? 'bg-[#E8F0FE] text-[#05324f] font-semibold'
										: 'text-[#374151] font-medium hover:bg-[#F5F7FA]'
								}`
							}
						>
							{({ isActive }) => (
								<>
									<Icon
										className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#1B8F3E]' : 'text-[#6B7280]'}`}
										strokeWidth={1.75}
									/>
									<span className="flex-1 truncate">{t(`workshop.panel.nav.${item.key}`)}</span>
									{item.key === 'messages' ? <OfferCountBadge count={unreadCount} /> : null}
								</>
							)}
						</NavLink>
					)
				})}
			</div>
			<button
				type="button"
				onClick={onLogoutClick}
				className="mx-3 mb-5 mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#2563EB] hover:bg-[#EFF6FF]"
			>
				<LogOut className="w-[18px] h-[18px]" strokeWidth={1.75} />
				{t('workshop.panel.nav.logout')}
			</button>
		</nav>
	)
}

function MobileMenuPanel({ onNavigate, onLogoutClick }) {
	const { t } = useTranslation()
	const unreadCount = useWorkshopUnreadCount()

	const rowClass = (active) =>
		`flex items-center justify-between gap-3 w-[calc(100%-1rem)] mx-2 px-4 py-3.5 text-left text-[15px] font-semibold rounded-xl transition-colors ${
			active
				? 'text-[#05324f] bg-[#E8F0FE]'
				: 'text-[#05324f] hover:bg-[#F8FAFC]'
		}`

	return (
		<nav className="py-1">
			{MOBILE_MENU.map((item) => (
				<NavLink
					key={item.to}
					to={item.to}
					end={item.end}
					onClick={onNavigate}
					className={({ isActive }) => rowClass(isActive)}
				>
					<span className="flex items-center gap-2 min-w-0">
						<span className="truncate">{t(`workshop.panel.nav.${item.key}`)}</span>
						{item.key === 'messages' ? <OfferCountBadge count={unreadCount} /> : null}
					</span>
					<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
				</NavLink>
			))}
			<button
				type="button"
				onClick={() => {
					onNavigate?.()
					onLogoutClick?.()
				}}
				className={rowClass(false)}
			>
				<span>{t('workshop.panel.nav.logout')}</span>
				<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
			</button>
		</nav>
	)
}

function useWorkshopRouteBack() {
	const navigate = useNavigate()
	const { pathname, search } = useLocation()
	const params = new URLSearchParams(search)

	if (pathname.startsWith('/workshop/requests/') && pathname !== '/workshop/requests') {
		return () => navigate('/workshop/requests')
	}

	if (pathname.startsWith('/workshop/requests') && params.get('case')) {
		if (params.get('panel') === 'quote') {
			return () => {
				const next = new URLSearchParams(search)
				next.delete('panel')
				navigate(`/workshop/requests?${next.toString()}`)
			}
		}
		return () => navigate('/workshop/requests')
	}

	if (pathname === '/workshop/reviews') {
		return () => navigate('/workshop/profile')
	}

	if (/^\/workshop\/[^/]+\/reviews/.test(pathname)) {
		return () => navigate(-1)
	}

	if (pathname.startsWith('/workshop/profile') && params.get('view') === 'info') {
		return () => navigate('/workshop/profile')
	}

	return null
}

const MENU_ONLY_PATHS = [
	'/workshop/messages',
	'/workshop/calendar',
	'/workshop/statistics',
	'/workshop/profile',
]

function WorkshopShellInner({ children }) {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { logout } = useAuth()
	const { pathname } = useLocation()
	const unreadCount = useWorkshopUnreadCount()
	const refreshUnread = useRefreshWorkshopUnreadCount()
	const [open, setOpen] = useState(false)
	const [actionsOpen, setActionsOpen] = useState(false)
	const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
	const [workshop, setWorkshop] = useState(cachedWorkshop)
	const { handler, title: backTitle, avatar: backAvatar } = useMobileBack()
	const { actions: headerActions = [] } = useWorkshopHeaderActions()
	const routeBack = useWorkshopRouteBack()
	const onBack = handler || routeBack
	const showBackTitle = Boolean(onBack && backTitle)
	const hasHeaderActions = headerActions.length > 0
	// Only show ⋯ when there are real header actions (not empty placeholder).
	const showMoreMenu = Boolean(onBack && hasHeaderActions)
	const hideBottomNav = MENU_ONLY_PATHS.some(
		(path) => pathname === path || pathname.startsWith(`${path}/`)
	)

	const confirmLogout = () => {
		setLogoutConfirmOpen(false)
		logout()
		navigate('/workshop/login', { replace: true })
	}

	useEffect(() => {
		if (!showMoreMenu || !hasHeaderActions) setActionsOpen(false)
	}, [showMoreMenu, hasHeaderActions])

	useEffect(() => {
		if (open) refreshUnread()
	}, [open, refreshUnread])

	useEffect(() => {
		let stop = false
		workshopAPI.getProfile()
			.then((response) => {
				const next = response.data?.workshop
				if (stop || !next?.companyName) return
				if (
					cachedWorkshop?.companyName === next.companyName &&
					cachedWorkshop?.organizationNumber === next.organizationNumber
				) {
					return
				}
				cachedWorkshop = next
				setWorkshop(next)
			})
			.catch(() => {})
		return () => {
			stop = true
		}
	}, [])

	return (
		<div className="workshop-app min-h-dvh bg-white">
			<aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] bg-white z-40 flex-col overflow-hidden">
				<SideNav workshop={workshop} onLogoutClick={() => setLogoutConfirmOpen(true)} />
			</aside>

			<div className="lg:pl-[260px] min-h-dvh flex flex-col">
				<header className="lg:hidden sticky top-0 z-30 bg-white pt-[env(safe-area-inset-top,0px)] shrink-0 relative">
					<div className={`relative grid grid-cols-[1fr_auto_1fr] items-center h-14 px-3 ${showBackTitle ? '' : ''}`}>
						<div className="flex items-center justify-start min-w-0">
							{onBack ? (
								<button
									type="button"
									onClick={onBack}
									className="flex items-center justify-center h-11 w-11 -ml-1 text-[#05324f]"
									aria-label={t('common.back')}
								>
									<ArrowLeft className="w-5 h-5" strokeWidth={2} />
								</button>
							) : (
								<button
									type="button"
									onClick={() => setOpen((value) => !value)}
									className={`relative flex items-center justify-center h-11 w-11 -ml-1 text-[#05324f] rounded-full transition-colors ${
										open ? 'bg-gray-100' : 'hover:bg-gray-100'
									}`}
									aria-label={open ? (t('common.close') || 'Close') : t('workshop.panel.menu')}
									aria-expanded={open}
								>
									{open ? <X className="w-6 h-6" strokeWidth={2} /> : <Menu className="w-6 h-6" />}
									{!open && unreadCount > 0 ? (
										<span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-btn ring-2 ring-white" aria-hidden />
									) : null}
								</button>
							)}
						</div>

						<div className="flex items-center justify-center px-2 min-w-0">
							{showBackTitle ? (
								<div className="min-w-0 max-w-[200px] flex items-center gap-2.5">
									<div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-[#F3F4F6]">
										<WorkshopImage
											workshop={{ companyName: backTitle, logo: backAvatar }}
											alt={backTitle}
											className="w-full h-full"
										/>
									</div>
									<p className="min-w-0 flex-1 text-base font-bold text-[#05324f] truncate">
										{backTitle}
									</p>
								</div>
							) : (
								<img src={mainLogo} alt="Fixa2an" className="h-10 w-auto object-contain" />
							)}
						</div>

						<div className="flex items-center justify-end min-w-0">
							{showMoreMenu ? (
								<div className="relative z-20">
									<button
										type="button"
										onClick={() => setActionsOpen((value) => !value)}
										className="flex items-center justify-center h-11 w-11 text-[#05324f]"
										aria-label={t('common.more') || 'More'}
										aria-expanded={actionsOpen}
									>
										<MoreVertical className="w-5 h-5" />
									</button>
									{actionsOpen ? (
										<>
											<button
												type="button"
												className="fixed inset-0 z-30 cursor-default"
												aria-label={t('common.close') || 'Close'}
												onClick={() => setActionsOpen(false)}
											/>
											<div className="absolute right-0 top-11 z-40 w-44 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden py-1">
												{headerActions.map((action) => (
													<button
														key={action.key || action.label}
														type="button"
														onClick={() => {
															setActionsOpen(false)
															action.onClick?.()
														}}
														className={`w-full px-3.5 py-2.5 text-left text-sm font-medium hover:bg-gray-50 ${
															action.danger ? 'text-[#DC2626]' : 'text-[#05324f]'
														}`}
													>
														{action.label}
													</button>
												))}
											</div>
										</>
									) : null}
								</div>
							) : onBack ? (
								<span className="w-9 h-9" aria-hidden="true" />
							) : (
								<NavLink
									to="/workshop/profile"
									className="h-9 w-9 -mr-0.5 text-[#05324f] border border-[#05324f] rounded-full inline-flex items-center justify-center"
									aria-label={t('workshop.panel.nav.profile')}
								>
									<UserRound className="w-[18px] h-[18px]" strokeWidth={1.75} />
								</NavLink>
							)}
						</div>
					</div>

					{open && !onBack ? (
						<>
							<button
								type="button"
								className="fixed inset-0 z-30 cursor-default"
								aria-label={t('common.close') || 'Close'}
								onClick={() => setOpen(false)}
							/>
							<div className="absolute left-3 right-3 top-full z-40 rounded-2xl border border-gray-100 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.10)] overflow-hidden">
								<MobileMenuPanel
									onNavigate={() => setOpen(false)}
									onLogoutClick={() => setLogoutConfirmOpen(true)}
								/>
							</div>
						</>
					) : null}
				</header>
				<div
					className={`flex-1 bg-white min-h-0 flex flex-col lg:pb-0 ${
						hideBottomNav
							? 'pb-[env(safe-area-inset-bottom,0px)]'
							: 'pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))]'
					}`}
				>
					{children}
				</div>
			</div>

			<Dialog open={logoutConfirmOpen} onOpenChange={setLogoutConfirmOpen}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-semibold text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('navigation.logout_confirm_title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('navigation.logout_confirm_desc')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setLogoutConfirmOpen(false)}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold text-sm"
						>
							{t('common.cancel') || 'Cancel'}
						</Button>
						<Button
							onClick={confirmLogout}
							className="flex-1 min-w-0 h-11 px-2 sm:px-4 rounded-xl bg-brand-btn text-white font-semibold text-sm transition-all shadow-md active:scale-95"
						>
							{t('navigation.logout') || 'Log Out'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

export default function WorkshopShell({ children }) {
	return (
		<WorkshopHeaderActionsProvider>
			<WorkshopShellInner>{children}</WorkshopShellInner>
		</WorkshopHeaderActionsProvider>
	)
}
