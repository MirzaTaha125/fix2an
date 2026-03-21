import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Send, FileCheck, User, LogOut, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { walletAPI } from '../services/api'

/**
 * Bottom navigation for workshop users. Shown on mobile across all workshop pages.
 * Links: Jobs (requests) | Proposals | Contracts | Profile
 */
export default function WorkshopBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const dropdownRef = useRef(null)
	const [walletBalance, setWalletBalance] = useState(null)

	const isActive = (path) => pathname.startsWith(path)

	const linkClass = (path) =>
		`flex flex-col items-center gap-0.5 ${isActive(path) ? 'text-[#05324f] font-medium' : 'text-gray-500'}`

	const handleLogout = () => {
		logout()
		navigate('/')
	}

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

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

	return (
		<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 max-md:flex md:hidden justify-around items-center py-2 safe-area-pb">
			<Link to="/workshop/requests" className={linkClass('/workshop/requests')}>
				<FileText className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.jobs') || 'Jobs'}</span>
			</Link>
			<Link to="/workshop/proposals" className={linkClass('/workshop/proposals')}>
				<Send className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.proposals') || 'Proposals'}</span>
			</Link>
			<Link to="/workshop/contracts" className={linkClass('/workshop/contracts')}>
				<FileCheck className="w-5 h-5" />
				<span className="text-xs font-medium">{t('navigation.contracts') || 'Contracts'}</span>
			</Link>
			<div className="relative" ref={dropdownRef}>
				<button onClick={() => setDropdownOpen(!dropdownOpen)} className={linkClass('/workshop/profile')}>
					{user?.image && user.image.trim() !== '' ? (
						<img 
							src={user.image} 
							alt={user?.name || 'User'} 
							className="w-6 h-6 rounded-full object-cover border border-gray-200"
							onError={(e) => {
								e.target.style.display = 'none'
								const fallback = e.target.nextElementSibling
								if (fallback) fallback.style.display = 'block'
							}}
						/>
					) : null}
					<User className={`w-6 h-6 p-0.5 ${user?.image && user.image.trim() !== '' ? 'hidden' : 'block'}`} />
					<span className="text-xs font-medium">{t('navigation.profile') || 'Profile'}</span>
				</button>
				
				{dropdownOpen && (
					<div className="absolute bottom-full mb-3 right-[-12px] w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-50">
						<div className="absolute -bottom-2 right-8 w-4 h-4 bg-white border-b border-r border-gray-200 transform rotate-45 pointer-events-none"></div>
						<div className="relative z-50 flex flex-col bg-white rounded-xl">
							<Link 
								to="/workshop/profile" 
								onClick={() => setDropdownOpen(false)}
								className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-50"
							>
								<User className="w-4 h-4 text-[#05324f]" />
								<span className="font-medium">{t('navigation.profile') || 'My Profile'}</span>
							</Link>
							<Link 
								to="/wallet" 
								onClick={() => setDropdownOpen(false)}
								className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 w-full"
							>
								<div className="flex items-center gap-3">
									<Wallet className="w-4 h-4 text-[#05324f]" />
									<span className="font-medium">{t('navigation.wallet') || 'Wallet'}</span>
								</div>
								<span className="font-bold text-[#34C759]">
									{walletBalance !== null ? `${walletBalance.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} SEK` : '...'}
								</span>
							</Link>
							<button 
								onClick={() => {
									setDropdownOpen(false)
									handleLogout()
								}} 
								className="flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 text-left w-full"
							>
								<LogOut className="w-4 h-4 text-red-600" />
								<span className="font-medium">{t('navigation.logout') || 'Logout'}</span>
							</button>
						</div>
					</div>
				)}
			</div>
		</nav>
	)
}
