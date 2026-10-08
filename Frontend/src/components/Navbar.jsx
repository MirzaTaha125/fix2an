import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { User, LogOut, Menu, X, Building2, Users, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/Dialog'
import RegisterTypeModal from './RegisterTypeModal'
import Logo from './Logo'

function Navbar() {
	const { user, loading, logout } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const [userDropdownOpen, setUserDropdownOpen] = useState(false)
	const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
	const [workshopMenuOpen, setWorkshopMenuOpen] = useState(false)

	// Detect scroll position
	useEffect(() => {
		const handleScroll = () => {
			const scrollPosition = window.scrollY
			setIsScrolled(scrollPosition > 50)
		}
		window.addEventListener('scroll', handleScroll)
		return () => window.removeEventListener('scroll', handleScroll)
	}, [])

	// Helper function to check if a path is active
	const isActive = (path) => {
		return location.pathname === path || location.pathname?.startsWith(path + '/')
	}
	const isCustomerMessages = location.pathname === '/contract' && new URLSearchParams(location.search).get('view') === 'messages'
	const isCustomerCases = isActive('/contract') && !isCustomerMessages
	const isCustomerHome = location.pathname === '/dashboard'
	const isHowItWorks = isActive('/how-it-works')
	const isForWorkshops =
		location.pathname === '/workshop/login' ||
		location.pathname === '/workshop/signup' ||
		location.pathname === '/workshop/pending' ||
		location.pathname === '/workshop/rejected'
	const isAbout = isActive('/about')
	const isContact = isActive('/support')

	const guestNavLinkClass = (active) =>
		`relative inline-flex items-center text-sm font-medium whitespace-nowrap pb-1.5 border-b-2 transition-colors ${
			active
				? 'text-[#008037] border-[#008037]'
				: 'text-[#374151] border-transparent hover:text-[#0B2540]'
		}`

	const mobileGuestNavLinkClass = (active) =>
		`flex items-center justify-between gap-3 w-[calc(100%-1rem)] mx-2 px-4 py-3.5 text-left text-[15px] font-semibold rounded-xl transition-colors ${
			active
				? 'text-[#05324f] bg-[#E8F0FE]'
				: 'text-[#05324f] hover:bg-[#F8FAFC]'
		}`

	const offerRequestId = new URLSearchParams(location.search).get('requestId')

	const uploadParams = new URLSearchParams(location.search)
	const isUploadFlowStep =
		location.pathname === '/upload' &&
		Boolean(
			uploadParams.get('path') ||
			uploadParams.get('edit') ||
			uploadParams.get('requestId') ||
			uploadParams.get('mode') === 'no-image' ||
			uploadParams.get('sent') === '1'
		)

	// Check if navbar should show back button
	const shouldShowBackButton = (
		isUploadFlowStep ||
		location.pathname === '/book-appointment' ||
		location.pathname === '/privacy' ||
		location.pathname === '/terms' ||
		location.pathname === '/cookies' ||
		(location.pathname === '/offers' && Boolean(offerRequestId)) ||
		(location.pathname === '/contract' && Boolean(new URLSearchParams(location.search).get('case'))) ||
		(location.pathname.includes('/offer') && location.pathname !== '/offers') ||
		location.pathname.includes('/workshop/reviews') ||
		location.pathname.includes('/admin/workshops/')
	)

	const profileView = new URLSearchParams(location.search).get('view')
	const isProfileInfoView =
		profileView === 'info' &&
		(location.pathname === '/profile' || location.pathname.startsWith('/workshop/profile'))
	const showLeftBackButton = shouldShowBackButton || isProfileInfoView

	const handleLeftBack = () => {
		if (isProfileInfoView) {
			navigate(location.pathname.startsWith('/workshop') ? '/workshop/profile' : '/profile', { replace: true })
			return
		}
		if (location.pathname === '/contract' && new URLSearchParams(location.search).get('case')) {
			const params = new URLSearchParams(location.search)
			params.delete('case')
			params.delete('panel')
			navigate({ pathname: '/contract', search: params.toString() ? `?${params}` : '' }, { replace: true })
			return
		}
		if (location.pathname === '/upload' && uploadParams.get('path')) {
			const params = new URLSearchParams(location.search)
			params.delete('path')
			navigate({ pathname: '/upload', search: params.toString() ? `?${params}` : '' }, { replace: true })
			return
		}
		navigate(-1)
	}

	// Determine if navbar should have white background and black text
	// Always use white navbar on homepage by default for visibility
	const shouldUseWhiteNavbar = true

	const handleLogout = () => {
		setIsLogoutConfirmOpen(true)
	}

	const confirmLogout = () => {
		setIsLogoutConfirmOpen(false)
		setUserDropdownOpen(false)
		setMobileMenuOpen(false)
		logout()
		navigate('/')
	}

	const showHamburgerMenu = !user && !showLeftBackButton
	const showCenteredLogo = user?.role !== 'ADMIN'

	const renderCompactNavbarLeft = () => {
		if (showLeftBackButton) {
			return (
				<button onClick={handleLeftBack} className="flex items-center justify-center h-12 md:h-16 w-12 md:w-16 -ml-2 translate-y-1.5 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
					<ArrowLeft className="w-6 h-6 text-[#05324f]" />
				</button>
			)
		}

		if (user?.role === 'ADMIN') {
			return (
				<Link to="/admin" className="flex flex-col items-start group">
					<span className="text-sm font-semibold bg-gradient-to-r from-[#05324f] to-gray-600 bg-clip-text text-transparent tracking-tight uppercase leading-none mb-1 group-hover:from-[#008037] group-hover:to-[#008037] transition-all duration-300">
						Admin <span className="text-[#008037]">Panel</span>
					</span>
					<span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none">
						{t('common.admin_tagline')}
					</span>
				</Link>
			)
		}

		if (showHamburgerMenu) {
			return (
				<button
					type="button"
					onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					className="p-2 -ml-2 text-[#05324f] hover:bg-gray-100 rounded-full transition-colors inline-flex"
					aria-label={t('common.menu') || 'Menu'}
					aria-expanded={mobileMenuOpen}
				>
					{mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
				</button>
			)
		}

		return null
	}

	const renderCompactNavbarRight = () => (
		<LanguageSwitcher isScrolled={shouldUseWhiteNavbar} align="right" iconClassName="h-6 w-6" />
	)

	if (user?.role === 'CUSTOMER') return null

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${shouldUseWhiteNavbar ? 'bg-white' : 'bg-transparent'
				}`}
			style={{
				backgroundColor: shouldUseWhiteNavbar ? '#ffffff' : 'transparent',
				backdropFilter: shouldUseWhiteNavbar ? 'none' : 'blur(10px)',
			}}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-1 sm:pb-0">
				{/* ── Mobile navbar ── */}
				<div className="md:hidden grid grid-cols-[1fr_auto_1fr] items-center py-2 w-full min-h-[3rem]">
					<div className="flex items-center justify-start min-w-0">
						{renderCompactNavbarLeft()}
					</div>

					<div className="flex items-center justify-center px-2">
						{showCenteredLogo && <Logo />}
					</div>

					<div className="flex items-center justify-end gap-1.5 shrink-0">
						{renderCompactNavbarRight()}
					</div>
				</div>

				{/* ── Tablet navbar (md–lg) ── */}
				<div className="hidden md:grid lg:hidden grid-cols-[1fr_auto_1fr] items-center py-2.5 w-full min-h-[3.25rem]">
					<div className="flex items-center justify-start min-w-0">
						{renderCompactNavbarLeft()}
					</div>

					<div className="flex items-center justify-center px-2">
						{showCenteredLogo && <Logo />}
					</div>

					<div className="flex items-center justify-end gap-1.5 shrink-0">
						{renderCompactNavbarRight()}
					</div>
				</div>

				{/* ── Desktop navbar: lg and up only (tablet uses bottom nav) ── */}
				<div className="hidden lg:flex items-center justify-between py-2.5 w-full gap-4">
					<div className="flex items-center justify-start min-w-0 shrink-0">
						<Logo />
					</div>

					<div className="flex items-center justify-end min-w-0 gap-2">

						{/* Desktop Navigation */}
						<nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
							{!loading && user ? (
								<>

									{user.role === 'CUSTOMER' && (
										<div className="hidden md:flex items-center space-x-4 lg:space-x-6">
											<Link
												to="/dashboard"
												className={`whitespace-nowrap text-sm transition-colors ${isCustomerHome ? 'text-[#05324f] font-semibold' : 'text-gray-600 font-medium hover:text-[#05324f]'}`}
											>
												{t('navigation.home')}
											</Link>
											<Link
												to="/contract"
												className={`whitespace-nowrap text-sm transition-colors ${isCustomerCases ? 'text-[#05324f] font-semibold' : 'text-gray-600 font-medium hover:text-[#05324f]'}`}
											>
												{t('navigation.my_cases') || t('navigation.contract')}
											</Link>
											<Link
												to="/contract?view=messages"
												className={`whitespace-nowrap text-sm transition-colors ${isCustomerMessages ? 'text-[#05324f] font-semibold' : 'text-gray-600 font-medium hover:text-[#05324f]'}`}
											>
												{t('navigation.messages')}
											</Link>
											<Link
												to="/profile"
												className={`whitespace-nowrap text-sm transition-colors ${isActive('/profile') ? 'text-[#05324f] font-semibold' : 'text-gray-600 font-medium hover:text-[#05324f]'}`}
											>
												{t('navigation.profile') || 'Profile'}
											</Link>
										</div>
									)}
									{user.role === 'WORKSHOP' && (
										<>
											<Link
												to="/workshop/requests"
												className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${isActive('/workshop/requests')
														? shouldUseWhiteNavbar
															? 'text-[#05324f] font-semibold'
															: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
														: shouldUseWhiteNavbar
															? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm'
															: 'text-white/80 hover:text-white hover:bg-white/10'
													}`}
											>
												{t('navigation.jobs') || 'Jobs'}
											</Link>
											<Link
												to="/workshop/proposals"
												className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${isActive('/workshop/proposals')
														? shouldUseWhiteNavbar
															? 'text-[#05324f] font-semibold'
															: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
														: shouldUseWhiteNavbar
															? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm'
															: 'text-white/80 hover:text-white hover:bg-white/10'
													}`}
											>
												{t('navigation.proposals') || 'Proposals'}
											</Link>
											<Link
												to="/workshop/contracts"
												className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${isActive('/workshop/contracts')
														? shouldUseWhiteNavbar
															? 'text-[#05324f] font-semibold'
															: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
														: shouldUseWhiteNavbar
															? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm'
															: 'text-white/80 hover:text-white hover:bg-white/10'
													}`}
											>
												{t('navigation.contracts') || 'Contracts'}
											</Link>
											<Link
												to="/workshop/profile"
												className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${isActive('/workshop/profile')
														? shouldUseWhiteNavbar
															? 'text-[#05324f] font-semibold'
															: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
														: shouldUseWhiteNavbar
															? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm'
															: 'text-white/80 hover:text-white hover:bg-white/10'
													}`}
											>
												{t('navigation.profile') || 'Profile'}
											</Link>
										</>
									)}

									<div className="relative">
										<button
											onClick={() => setUserDropdownOpen(!userDropdownOpen)}
											className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${shouldUseWhiteNavbar
													? 'text-gray-600 bg-gray-50 hover:bg-gray-100'
													: 'text-white/80 bg-white/10 backdrop-blur-sm hover:bg-white/20'
												}`}
										>
											{user.image && user.image.trim() !== '' ? (
												<img
													src={user.image}
													alt={user.name || 'User'}
													className="w-6 h-6 rounded-full object-cover border border-white shadow-sm"
													onError={(e) => {
														e.target.style.display = 'none'
														e.target.nextElementSibling.style.display = 'flex'
													}}
												/>
											) : null}
											<div className={`w-6 h-6 rounded-full bg-[#F0F2F5] flex items-center justify-center shrink-0 border border-white shadow-sm ${user.image && user.image.trim() !== '' ? 'hidden' : ''}`}>
												<User className="w-3.5 h-3.5 text-[#ACB0B4]" />
											</div>
											<span className="text-sm font-medium">{user.name || user.email}</span>
											<ChevronDown className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
										</button>

										{/* Dropdown Menu */}
										{userDropdownOpen && (
											<>
												<div
													className="fixed inset-0 z-10"
													onClick={() => setUserDropdownOpen(false)}
												></div>
												<div className={`absolute right-0 mt-2 min-w-full rounded-lg shadow-lg border z-20 ${shouldUseWhiteNavbar
														? 'bg-white border-gray-200'
														: 'bg-white/95 backdrop-blur-md border-white/20'
													}`}>
													<button
														onClick={() => {
															setUserDropdownOpen(false)
															handleLogout()
														}}
														className={`flex items-center justify-start gap-2 px-3 py-2.5 text-sm w-full text-left transition-colors duration-200 ${shouldUseWhiteNavbar
																? 'text-red-600 hover:bg-red-50'
																: 'text-red-600 hover:bg-red-50'
															}`}
													>
														<LogOut className="w-4 h-4 shrink-0" />
														<span>{t('navigation.logout')}</span>
													</button>
												</div>
											</>
										)}
									</div>
								</>
							) : (
								<>
									<Link to="/how-it-works" className={guestNavLinkClass(isHowItWorks)}>
										{t('navigation.how_it_works')}
									</Link>
									<div className="relative">
										<button
											type="button"
											onClick={() => setWorkshopMenuOpen((open) => !open)}
											className={`${guestNavLinkClass(isForWorkshops)} gap-1`}
										>
											{t('navigation.for_workshops')}
											<ChevronDown className={`w-4 h-4 transition-transform ${workshopMenuOpen ? 'rotate-180' : ''}`} />
										</button>
										{workshopMenuOpen && (
											<>
												<div className="fixed inset-0 z-10" onClick={() => setWorkshopMenuOpen(false)} />
												<div className="absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[#EEF1F4] bg-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
													<div className="grid grid-cols-2 gap-1.5">
														<Link
															to="/workshop/login"
															onClick={() => setWorkshopMenuOpen(false)}
															className="flex min-h-[36px] items-center justify-center !rounded-md bg-brand-btn px-2.5 text-xs font-semibold text-white"
														>
															{t('navigation.login')}
														</Link>
														<Link
															to="/workshop/signup"
															onClick={() => setWorkshopMenuOpen(false)}
															className="flex min-h-[36px] items-center justify-center !rounded-md border border-[#008037] px-2.5 text-xs font-semibold text-[#008037] hover:bg-[#F3FBF6]"
														>
															{t('navigation.register')}
														</Link>
													</div>
												</div>
											</>
										)}
									</div>
									<Link to="/about" className={guestNavLinkClass(isAbout)}>
										{t('navigation.about_us')}
									</Link>
									<Link to="/support/contact" className={guestNavLinkClass(isContact)}>
										{t('navigation.contact')}
									</Link>
									<Link
										to="/upload"
										className="inline-flex items-center justify-center min-h-[40px] px-4 !rounded-md bg-brand-btn text-white text-sm font-semibold whitespace-nowrap"
									>
										{t('navigation.create_case')}
									</Link>
								</>
							)}
						</nav>
						<LanguageSwitcher isScrolled={shouldUseWhiteNavbar} align="right" iconClassName="h-6 w-6" />
					</div>
				</div>

				{/* Mobile & tablet navigation (hidden on lg+ where desktop nav shows) */}
				{mobileMenuOpen && (
					<div className="lg:hidden mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.10)] border border-gray-100 overflow-hidden">
						<div className={user ? 'px-2 py-3 space-y-1' : 'py-1'}>
							{user ? (
								<>
									{user.role === 'ADMIN' && (
										<Link
											to="/admin"
											className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/admin')
													? 'text-[#05324f] font-semibold'
													: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<span>Admin <span className="text-[#008037]">Panel</span></span>
										</Link>
									)}
									{user.role === 'CUSTOMER' && (
										<>
											<Link
												to="/dashboard"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isCustomerHome}
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.home')}</span>
											</Link>
											<Link
												to="/contract"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isCustomerCases
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.my_cases') || t('navigation.contract')}</span>
											</Link>
											<Link
												to="/contract?view=messages"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isCustomerMessages
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.messages')}</span>
											</Link>
											<Link
												to="/profile"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/profile')
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.profile') || 'Profile'}</span>
											</Link>
										</>
									)}
									{user.role === 'WORKSHOP' && (
										<>
											<Link
												to="/workshop/requests"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/workshop/requests')
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.jobs') || 'Jobs'}</span>
											</Link>
											<Link
												to="/workshop/proposals"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/workshop/proposals')
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.proposals') || 'Proposals'}</span>
											</Link>
											<Link
												to="/workshop/contracts"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/workshop/contracts')
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.contracts') || 'Contracts'}</span>
											</Link>
											<Link
												to="/workshop/profile"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive('/workshop/profile')
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
													}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{t('navigation.profile') || 'Profile'}</span>
											</Link>
										</>
									)}

									<div className="border-t border-gray-200 my-2"></div>

									<div className="px-2">
										<button
											onClick={() => setUserDropdownOpen(!userDropdownOpen)}
											className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
										>
											{user.image && user.image.trim() !== '' ? (
												<img
													src={user.image}
													alt={user.name || 'User'}
													className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
													onError={(e) => {
														e.target.style.display = 'none'
														e.target.nextElementSibling.style.display = 'flex'
													}}
												/>
											) : null}
											<div className={`w-8 h-8 rounded-full bg-[#F0F2F5] flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm ${user.image && user.image.trim() !== '' ? 'hidden' : ''}`}>
												<User className="w-4 h-4 text-[#ACB0B4]" />
											</div>
											<div className="flex-1 min-w-0 text-left">
												<p className="text-sm font-semibold text-gray-900 truncate">
													{user.name || 'User'}
												</p>
											</div>
											<ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
										</button>

										{userDropdownOpen && (
											<div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
												<button
													onClick={() => {
														setUserDropdownOpen(false)
														setMobileMenuOpen(false)
														handleLogout()
													}}
													className="w-full flex items-center justify-start gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
												>
													<LogOut className="w-4 h-4 shrink-0" />
													<span>{t('navigation.logout')}</span>
												</button>
											</div>
										)}
									</div>
								</>
							) : (
								<nav>
									<Link
										to="/how-it-works"
										onClick={() => setMobileMenuOpen(false)}
										className={mobileGuestNavLinkClass(isHowItWorks)}
									>
										<span>{t('navigation.how_it_works')}</span>
										<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
									</Link>
									<button
										type="button"
										onClick={() => setWorkshopMenuOpen((open) => !open)}
										className={mobileGuestNavLinkClass(isForWorkshops || workshopMenuOpen)}
									>
										<span>{t('navigation.for_workshops')}</span>
										<ChevronRight
											className={`w-5 h-5 text-[#05324f] shrink-0 transition-transform ${workshopMenuOpen ? 'rotate-90' : ''}`}
											strokeWidth={1.75}
										/>
									</button>
									{workshopMenuOpen && (
										<div className="bg-[#FAFBFC]">
											<Link
												to="/workshop/login"
												onClick={() => setMobileMenuOpen(false)}
												className="flex items-center justify-between gap-3 w-full px-5 pl-8 py-4 text-[15px] font-semibold text-[#05324f]"
											>
												<span>{t('navigation.login')}</span>
												<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
											</Link>
											<Link
												to="/workshop/signup"
												onClick={() => setMobileMenuOpen(false)}
												className="flex items-center justify-between gap-3 w-full px-5 pl-8 py-4 text-[15px] font-semibold text-[#05324f]"
											>
												<span>{t('navigation.register')}</span>
												<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
											</Link>
										</div>
									)}
									<Link
										to="/about"
										onClick={() => setMobileMenuOpen(false)}
										className={mobileGuestNavLinkClass(isAbout)}
									>
										<span>{t('navigation.about_us')}</span>
										<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
									</Link>
									<Link
										to="/support/contact"
										onClick={() => setMobileMenuOpen(false)}
										className={mobileGuestNavLinkClass(isContact)}
									>
										<span>{t('navigation.contact')}</span>
										<ChevronRight className="w-5 h-5 text-[#05324f] shrink-0" strokeWidth={1.75} />
									</Link>
									<div className="px-4 pt-3 pb-2">
										<Link
											to="/upload"
											onClick={() => setMobileMenuOpen(false)}
											className="flex w-full items-center justify-center min-h-[44px] rounded-xl bg-brand-btn text-white text-[15px] font-semibold"
										>
											{t('navigation.create_case')}
										</Link>
									</div>
								</nav>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Registration Type Selection Modal */}
			<RegisterTypeModal
				isOpen={registerModalOpen}
				onClose={() => setRegisterModalOpen(false)}
			/>

			{/* Logout Confirmation Modal */}
			<Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
				<DialogContent className="w-[min(calc(100vw-1.5rem),320px)] sm:w-[min(calc(100vw-2rem),380px)] md:w-[min(calc(100vw-2rem),420px)] lg:max-w-[440px] mx-auto overflow-hidden box-border bg-white rounded-xl sm:rounded-2xl shadow-2xl p-4 pt-5 sm:p-6 md:p-7 lg:p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
					<DialogHeader className="text-center items-center sm:text-center">
						<DialogTitle className="text-xl sm:text-2xl font-black text-[#05324f] leading-tight mb-2 text-center w-full">
							{t('navigation.logout_confirm_title')}
						</DialogTitle>
						<DialogDescription className="text-gray-500 text-sm sm:text-base leading-relaxed text-center">
							{t('navigation.logout_confirm_desc')}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-5 sm:mt-6 !flex-row gap-2 sm:gap-3 items-stretch">
						<Button
							variant="outline"
							onClick={() => setIsLogoutConfirmOpen(false)}
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
		</header>
	)
}

export default Navbar

