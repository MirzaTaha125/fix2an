import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderOpen, Wallet, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { walletAPI } from '../services/api'

/**
 * Bottom navigation for customer users. Shown on mobile.
 * Links: My Cases | Wallet | Profile (with dropdown)
 */
export default function CustomerBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const { user, logout } = useAuth()
	const [walletBalance, setWalletBalance] = useState(null)
	const [profileMenuOpen, setProfileMenuOpen] = useState(false)
	const menuRef = useRef(null)

	// Close profile menu if clicking outside
	useEffect(() => {
		function handleClickOutside(event) {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setProfileMenuOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [menuRef])

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

	const isActive = (path) => (path === '/profile' ? pathname === '/profile' : pathname.startsWith(path))

	const linkClass = (path) =>
		`flex flex-col items-center gap-0.5 relative rounded-lg px-3 py-1 transition-all ${isActive(path) ? 'text-[#05324f] font-semibold' : 'text-gray-500 hover:text-[#05324f]'}`

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-md:flex md:hidden justify-around items-center py-2 safe-area-pb shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
			<Link to="/my-cases" className={linkClass('/my-cases')} onClick={() => setProfileMenuOpen(false)}>
				<FolderOpen className={`w-6 h-6 ${isActive('/my-cases') ? 'fill-[#05324f]/10' : ''}`} />
				<span className="text-[10px] font-medium mt-0.5">{t('navigation.my_cases') || 'My Cases'}</span>
				{isActive('/my-cases') && <span className="absolute -top-2 w-8 h-1 bg-[#05324f] rounded-b-full"></span>}
			</Link>
			
			<Link to="/wallet" className={linkClass('/wallet')} onClick={() => setProfileMenuOpen(false)}>
				<Wallet className={`w-6 h-6 ${isActive('/wallet') ? 'fill-[#05324f]/10' : ''}`} />
				<span className="text-[10px] font-medium mt-0.5">
					{walletBalance !== null ? `${walletBalance.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} SEK` : t('navigation.wallet') || 'Wallet'}
				</span>
				{isActive('/wallet') && <span className="absolute -top-2 w-8 h-1 bg-[#05324f] rounded-b-full"></span>}
			</Link>

			<div className="relative flex flex-col items-center" ref={menuRef}>
				<button 
					onClick={(e) => {
						e.preventDefault();
						setProfileMenuOpen(!profileMenuOpen)
					}} 
					className={linkClass('/profile')}
				>
					<User className={`w-6 h-6 ${isActive('/profile') || profileMenuOpen ? 'fill-[#05324f]/10 text-[#05324f]' : 'text-gray-500'}`} />
					<span className={`text-[10px] font-medium mt-0.5 ${profileMenuOpen ? 'text-[#05324f]' : ''}`}>{t('navigation.profile') || 'Profile'}</span>
					{(isActive('/profile') || profileMenuOpen) && <span className="absolute -top-2 w-8 h-1 bg-[#05324f] rounded-b-full"></span>}
				</button>
				
				{profileMenuOpen && (
					<div className="absolute bottom-full mb-4 right-0 bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-xl border border-gray-100 py-2 w-48 flex flex-col items-start z-50 animate-in slide-in-from-bottom-2 fade-in">
						<div className="px-4 py-2 border-b border-gray-100 w-full mb-1">
							<p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Account</p>
						</div>
						<Link 
							to="/profile" 
							className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 w-full text-left font-medium transition-colors" 
							onClick={() => setProfileMenuOpen(false)}
						>
							<div className="bg-gray-100 p-1.5 rounded-md">
								<User className="w-4 h-4 text-gray-600" />
							</div>
							{t('profile.title') || 'My Profile'}
						</Link>
						<button 
							onClick={() => { 
								setProfileMenuOpen(false); 
								logout(); 
							}} 
							className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left font-medium transition-colors"
						>
							<div className="bg-red-50 p-1.5 rounded-md">
								<LogOut className="w-4 h-4 text-red-500" />
							</div>
							{t('navigation.logout') || 'Logout'}
						</button>
					</div>
				)}
			</div>
		</nav>
	)
}
