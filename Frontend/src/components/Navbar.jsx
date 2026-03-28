import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/Button'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'
import { User, LogOut, Menu, X, Building2, Users, ChevronDown, ArrowLeft } from 'lucide-react'
import { Dialog } from './ui/Dialog'
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

	// Check if navbar should show back button
	const shouldShowBackButton = (
		location.pathname === '/upload' ||
		location.pathname === '/offers' ||
		location.pathname === '/book-appointment' ||
		location.pathname.includes('/offer') ||
		location.pathname.includes('/workshop/reviews') ||
		location.pathname.includes('/admin/workshops/')
	)

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
				<div className="grid grid-cols-3 md:flex justify-between items-center py-2 sm:py-2.5 w-full">
					<div className="flex justify-start md:hidden">
						{shouldShowBackButton ? (
							<button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors inline-flex">
								<ArrowLeft className="w-6 h-6 text-[#05324f]" />
							</button>
						) : (
							!user && (
								<button 
									onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
									className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors inline-flex"
								>
									{mobileMenuOpen ? <X className="w-6 h-6 text-[#05324f]" /> : <Menu className="w-6 h-6 text-[#05324f]" />}
								</button>
							)
						)}
					</div>
					<div className="flex items-center justify-center md:justify-start gap-3 w-full">
						<Logo />
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
										className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
											isActive('/admin') 
												? shouldUseWhiteNavbar 
													? 'text-[#05324f] font-semibold' 
													: 'text-white font-semibold bg-white/25 shadow-md backdrop-blur-sm'
												: shouldUseWhiteNavbar 
													? 'text-gray-600 hover:text-[#05324f] hover:bg-gray-50 hover:shadow-sm' 
													: 'text-white/80 hover:text-white hover:bg-white/10'
										}`}
									>
										<span>Admin <span className="text-[#34C759]">Panel</span></span>
									</Link>
								)}
								{user.role === 'CUSTOMER' && (
									<>
										<Link 
											to="/my-cases" 
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
											className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
									className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg ${
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
									className={`relative whitespace-nowrap transition-all duration-300 px-4 py-2.5 rounded-lg font-medium ${
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

					{/* Mobile Menu Button (Globe Only) */}
					<div className="md:hidden flex items-center justify-end pr-2">
						<LanguageSwitcher isScrolled={shouldUseWhiteNavbar} />
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
											<span>Admin <span className="text-[#34C759]">Panel</span></span>
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
									<Link
										to="/auth/signup"
										className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
											isActive('/auth/signup') 
												? 'text-[#05324f] font-semibold'
												: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<div className={`w-2 h-2 rounded-full ${isActive('/auth/signup') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
										<span>{t('common.register_as_customer') || 'Register as Customer'}</span>
									</Link>
									<Link
										to="/workshop/signup"
										className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
											isActive('/workshop/signup') 
												? 'text-[#05324f] font-semibold'
												: 'text-gray-700 hover:text-[#05324f] hover:bg-gray-50'
										}`}
										onClick={() => setMobileMenuOpen(false)}
									>
										<div className={`w-2 h-2 rounded-full ${isActive('/workshop/signup') ? 'bg-[#05324f]' : 'bg-gray-300'}`}></div>
										<span>{t('common.register_as_workshop') || 'Register as Workshop'}</span>
									</Link>
								</>
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
		</header>
	)
}

export default Navbar

