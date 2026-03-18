import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { walletAPI } from '../services/api'
import { Button } from './ui/Button'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { User, LogOut, Menu, X, Building2, Users, ChevronDown, Wallet } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './ui/Dialog'

function Navbar() {
	const { user, loading, logout } = useAuth()
	const navigate = useNavigate()
	const location = useLocation()
	const { t } = useTranslation()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [isScrolled, setIsScrolled] = useState(false)
	const [registerModalOpen, setRegisterModalOpen] = useState(false)
	const [userDropdownOpen, setUserDropdownOpen] = useState(false)
	const [walletBalance, setWalletBalance] = useState(null)

	// Fetch wallet balance
	useEffect(() => {
		let isMounted = true
		const fetchBalance = async () => {
			if (!user || user.role === 'ADMIN') return
			try {
				const { data } = await walletAPI.getWallet()
				if (isMounted) setWalletBalance(data.wallet.balance)
			} catch (error) {
				console.error('Failed to fetch wallet balance', error)
			}
		}

		fetchBalance()
		const handleWalletUpdate = () => fetchBalance()
		window.addEventListener('walletUpdate', handleWalletUpdate)
		return () => {
			isMounted = false
			window.removeEventListener('walletUpdate', handleWalletUpdate)
		}
	}, [user])

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

	// Check if we're on the home page
	const isHomePage = location.pathname === '/' || location.pathname === ''

	// Determine if navbar should have white background and black text
	// Always use white navbar on homepage by default for visibility
	const shouldUseWhiteNavbar = true

	const handleLogout = () => {
		logout()
		navigate('/')
	}

	return (
		<header 
			className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
				shouldUseWhiteNavbar ? 'bg-white' : 'bg-transparent'
			}`}
			style={{ 
				backgroundColor: shouldUseWhiteNavbar ? '#ffffff' : 'transparent',
				backdropFilter: shouldUseWhiteNavbar ? 'none' : 'blur(10px)',
			}}
		>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-1 sm:pb-0">
				<div className="flex justify-between items-center py-2 sm:py-2.5">
					<div className="flex items-center gap-3">
						<Link 
							to="/" 
							className="flex items-center transition-all duration-300 hover:scale-105"
						>
							<span className="text-2xl sm:text-3xl md:text-4xl font-bold">
								<span className="text-[#05324f]">Fix</span>
								<span className="text-green-500">2an</span>
							</span>
						</Link>
						{user?.role === 'ADMIN' && (
							<span className={`text-sm font-medium hidden sm:block transition-colors duration-300 ${
								shouldUseWhiteNavbar ? 'text-gray-600' : 'text-white/80 drop-shadow-md'
							}`}>
								{t('common.admin_tagline') || 'Manage & Monitor'}
							</span>
						)}
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex space-x-6 lg:space-x-8 items-center">
						{!loading && user ? (
							<>
								{user.role === 'ADMIN' && (
									<Link 
										to="/admin" 
										className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
											isActive('/admin') 
												? shouldUseWhiteNavbar 
													? 'text-[#05324f] font-semibold' 
													: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
												: shouldUseWhiteNavbar 
													? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm' 
													: 'text-white/80 hover:text-white hover:bg-white/10'
										}`}
									>
										{t('navigation.admin_panel') || 'Admin Panel'}
									</Link>
								)}
								{user.role === 'CUSTOMER' && (
									<>
										<Link 
											to="/my-cases" 
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/my-cases') 
													? shouldUseWhiteNavbar 
														? 'text-[#05324f] font-semibold' 
														: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
													: shouldUseWhiteNavbar 
														? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm' 
														: 'text-white/80 hover:text-white hover:bg-white/10'
												}`}
										>
											{t('navigation.my_cases')}
										</Link>
										<Link 
											to="/upload" 
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/upload') 
													? shouldUseWhiteNavbar 
														? 'text-[#05324f] font-semibold' 
														: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
													: shouldUseWhiteNavbar 
														? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm' 
														: 'text-white/80 hover:text-white hover:bg-white/10'
												}`}
										>
											{t('navigation.upload_cases') || 'Upload Cases'}
										</Link>
										<Link 
											to="/profile" 
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/profile') 
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
								{user.role === 'WORKSHOP' && (
									<>
										<Link 
											to="/workshop/requests" 
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/workshop/requests') 
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
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/workshop/proposals') 
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
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/workshop/contracts') 
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
											className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
												isActive('/workshop/profile') 
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
								
								{/* Wallet Balance Pill */}
								<Link 
									to="/wallet" 
									className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
										shouldUseWhiteNavbar 
											? 'text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 shadow-sm' 
											: 'text-white/90 bg-white/10 border border-white/20 backdrop-blur-sm hover:bg-white/20'
									}`}
								>
									<Wallet className={`w-4 h-4 ${shouldUseWhiteNavbar ? 'text-[#05324f]' : 'text-white/90'}`} />
									{walletBalance === null ? (
										<div className="h-4 w-16 bg-gray-300 animate-pulse rounded"></div>
									) : (
										<span className={`text-sm font-bold whitespace-nowrap ${shouldUseWhiteNavbar ? 'text-[#05324f]' : 'text-white'}`}>
											{walletBalance.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} <span className={`text-xs font-semibold ${shouldUseWhiteNavbar ? 'text-gray-500' : 'text-white/70'}`}>SEK</span>
										</span>
									)}
								</Link>

								<div className="relative">
									<button
										onClick={() => setUserDropdownOpen(!userDropdownOpen)}
										className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-300 ${
											shouldUseWhiteNavbar 
												? 'text-gray-600 bg-gray-50 hover:bg-gray-100' 
												: 'text-white/80 bg-white/10 backdrop-blur-sm hover:bg-white/20'
										}`}
									>
										{user.image && user.image.trim() !== '' ? (
											<img 
												src={user.image} 
												alt={user.name || 'User'} 
												className="w-6 h-6 rounded-full object-cover border border-gray-200"
												onError={(e) => {
													e.target.style.display = 'none'
													e.target.nextElementSibling.style.display = 'flex'
												}}
											/>
										) : null}
										<div className={`w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center ${user.image && user.image.trim() !== '' ? 'hidden' : ''}`}>
											<User className="w-3.5 h-3.5 text-white" />
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
											<div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-20 ${
												shouldUseWhiteNavbar 
													? 'bg-white border-gray-200' 
													: 'bg-white/95 backdrop-blur-md border-white/20'
											}`}>
												<div className="py-1">
													<Link
														to="/wallet"
														onClick={() => setUserDropdownOpen(false)}
														className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors duration-200 ${
															shouldUseWhiteNavbar
																? 'text-gray-700 hover:bg-gray-50'
																: 'text-white/90 hover:bg-white/10'
														}`}
													>
														<Wallet className="w-4 h-4" />
														<span>{t('navigation.wallet') || 'My Wallet'}</span>
													</Link>
													<button
														onClick={() => {
															setUserDropdownOpen(false)
															handleLogout()
														}}
														className={`flex items-center gap-3 px-4 py-2.5 text-sm w-full text-left transition-colors duration-200 ${
															shouldUseWhiteNavbar
																? 'text-red-600 hover:bg-red-50'
																: 'text-red-600 hover:bg-red-50'
														}`}
													>
														<LogOut className="w-4 h-4" />
														<span>{t('navigation.logout')}</span>
													</button>
												</div>
											</div>
										</>
									)}
								</div>
							</>
						) : (
							<>
								<Link 
									to="/auth/signin" 
									className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg ${
										isActive('/auth/signin') 
											? shouldUseWhiteNavbar 
												? 'text-[#05324f] font-semibold' 
												: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
											: shouldUseWhiteNavbar 
												? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm' 
												: 'text-white/80 hover:text-white hover:bg-white/10'
									}`}
								>
									{t('navigation.login')}
								</Link>
								<button
									onClick={() => setRegisterModalOpen(true)}
									className={`relative transition-all duration-300 px-4 py-2.5 rounded-lg font-medium ${
										shouldUseWhiteNavbar 
											? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50' 
											: 'text-white/80 hover:text-white hover:bg-white/10'
									}`}
								>
									{t('navigation.register')}
								</button>
							</>
						)}
						<LanguageSwitcher isScrolled={shouldUseWhiteNavbar} />
					</nav>

					{/* Mobile Menu Button */}
					<div className="md:hidden flex items-center gap-2">
						<LanguageSwitcher isScrolled={shouldUseWhiteNavbar} />
						<Button
							variant="outline"
							size="sm"
							onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
							className={`transition-all duration-300 rounded-lg ${
								shouldUseWhiteNavbar 
									? 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 shadow-sm' 
									: 'bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm hover:border-white/50'
							}`}
						>
							{mobileMenuOpen ? (
								<X className="w-5 h-5" />
							) : (
								<Menu className="w-5 h-5" />
							)}
						</Button>
					</div>
				</div>

				{/* Mobile Navigation */}
				{mobileMenuOpen && (
					<div className="md:hidden mt-4 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
						<div className="px-2 py-3 space-y-1">
							{user ? (
								<>
									{user.role === 'ADMIN' && (
										<Link
											to="/admin"
											className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
												isActive('/admin') 
													? 'text-[#05324f] font-semibold'
													: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
											}`}
											onClick={() => setMobileMenuOpen(false)}
										>
											<div className={`w-2 h-2 rounded-full ${isActive('/admin') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
											<span>{t('navigation.admin_panel') || 'Admin Panel'}</span>
										</Link>
									)}
									{user.role === 'CUSTOMER' && (
										<>
											<Link
												to="/my-cases"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/my-cases') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/my-cases') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.my_cases')}</span>
											</Link>
											<Link
												to="/upload"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/upload') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/upload') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.upload_cases') || 'Upload Cases'}</span>
											</Link>
											<Link
												to="/profile"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/profile') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/profile') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.profile') || 'Profile'}</span>
											</Link>
											<Link
												to="/wallet"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/wallet') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/wallet') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.wallet') || 'My Wallet'}</span>
											</Link>
										</>
									)}
									{user.role === 'WORKSHOP' && (
										<>
											<Link
												to="/workshop/requests"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/workshop/requests') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/workshop/requests') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.jobs') || 'Jobs'}</span>
											</Link>
											<Link
												to="/workshop/proposals"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/workshop/proposals') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/workshop/proposals') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.proposals') || 'Proposals'}</span>
											</Link>
											<Link
												to="/workshop/contracts"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/workshop/contracts') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/workshop/contracts') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
												<span>{t('navigation.contracts') || 'Contracts'}</span>
											</Link>
											<Link
												to="/workshop/profile"
												className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
													isActive('/workshop/profile') 
														? 'text-[#05324f] font-semibold'
														: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
												}`}
												onClick={() => setMobileMenuOpen(false)}
											>
												<div className={`w-2 h-2 rounded-full ${isActive('/workshop/profile') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
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
													className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
													onError={(e) => {
														e.target.style.display = 'none'
														e.target.nextElementSibling.style.display = 'flex'
													}}
												/>
											) : null}
											<div className={`w-8 h-8 rounded-full bg-[#05324f] flex items-center justify-center flex-shrink-0 ${user.image && user.image.trim() !== '' ? 'hidden' : ''}`}>
												<User className="w-4 h-4 text-white" />
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
													className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
												>
													<LogOut className="w-4 h-4" />
													<span>{t('navigation.logout')}</span>
												</button>
											</div>
										)}
									</div>
								</>
							) : (
								<>
									<Link
										to="/auth/signin"
										className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
											isActive('/auth/signin') 
												? 'text-[#05324f] font-semibold'
												: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<div className={`w-2 h-2 rounded-full ${isActive('/auth/signin') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
										<span>{t('navigation.login')}</span>
									</Link>
									<button
										onClick={() => {
											setRegisterModalOpen(true)
											setMobileMenuOpen(false)
										}}
										className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left w-full text-gray-700 hover:text-[#05324f] hover:bg-gray-50 font-medium"
									>
										<div className="w-2 h-2 rounded-full bg-gray-300"></div>
										<span>{t('navigation.register')}</span>
									</button>
								</>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Registration Type Selection Modal */}
			<Dialog open={registerModalOpen} onOpenChange={setRegisterModalOpen}>
				<DialogContent onClose={() => setRegisterModalOpen(false)}>
					<DialogTitle>{t('common.select_registration_type') || 'Select Registration Type'}</DialogTitle>
					<DialogDescription>
						{t('common.select_registration_type_desc') || 'Choose how you want to register'}
					</DialogDescription>
					<div className="space-y-2 sm:space-y-3">
						<Button
							onClick={() => {
								setRegisterModalOpen(false)
								navigate('/auth/signup')
							}}
							className="w-full justify-start h-auto py-3 sm:py-4 px-3 sm:px-4"
							variant="outline"
						>
							<div className="flex items-center gap-2 sm:gap-3 w-full">
								<div className="p-1.5 sm:p-2 rounded-lg bg-green-100 flex-shrink-0">
									<Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
								</div>
								<div className="flex-1 text-left min-w-0">
									<div className="font-semibold text-sm sm:text-base text-gray-900">
										{t('common.register_as_customer') || 'Register as Customer'}
									</div>
									<div className="text-xs sm:text-sm text-gray-500 mt-0.5">
										{t('common.register_as_customer_desc') || 'Create an account to request services'}
									</div>
								</div>
							</div>
						</Button>
						<Button
							onClick={() => {
								setRegisterModalOpen(false)
								navigate('/workshop/signup')
							}}
							className="w-full justify-start h-auto py-3 sm:py-4 px-3 sm:px-4 bg-transparent hover:bg-gray-50"
							variant="outline"
						>
							<div className="flex items-center gap-2 sm:gap-3 w-full">
								<div className="p-1.5 sm:p-2 rounded-lg flex-shrink-0">
									<Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
								</div>
								<div className="flex-1 text-left min-w-0">
									<div className="font-semibold text-sm sm:text-base text-gray-900 mb-1">
										{t('common.register_as_workshop') || 'Register as Workshop'}
									</div>
									<div className="text-xs sm:text-sm text-gray-500 mt-0.5">
										{t('common.register_as_workshop_desc') || 'Register your workshop to offer services'}
									</div>
								</div>
							</div>
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</header>
	)
}

export default Navbar

