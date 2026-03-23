import { useState, useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FolderOpen, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Bottom navigation for customer users. Shown on mobile.
 * Links: My Cases | Profile (with dropdown)
 */

const NavItemContent = ({ active, icon: Icon, label }) => {
	return (
		<div className="flex flex-col items-center w-full h-full relative z-20">
			<div 
				className={`absolute transition-all duration-300 flex items-center justify-center ${
					active ? 'top-[11px] text-white' : 'top-[16px] text-gray-400'
				}`}
			>
				<Icon className="w-[22px] h-[22px]" />
			</div>
			
			<span 
				className={`absolute w-full text-center px-1 transition-all duration-300 ${
					active ? 'bottom-[6px] text-[10px] font-bold text-[#05324f]' : 'bottom-[8px] text-[10px] font-medium text-gray-500'
				}`}
			>
				{label}
			</span>
		</div>
	)
}

export default function CustomerBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const { user, logout } = useAuth()
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

	const isActive = (path) => (path === '/profile' ? pathname === '/profile' : pathname.startsWith(path))

	const getActiveIndex = () => {
		if (profileMenuOpen || isActive('/profile')) return 1;
		if (isActive('/my-cases')) return 0;
		return 0;
	}
	const activeIndex = getActiveIndex();

	return (
		<nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100 z-50 max-md:block md:hidden safe-area-pb shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
			
			{/* Magic Slider Indicator */}
			<div 
				className="absolute top-0 h-full flex flex-col items-center z-10 transition-transform duration-300 ease-in-out"
				style={{ 
					width: '50%', 
					transform: `translateX(${activeIndex * 100}%)` 
				}}
			>
				<div className="absolute top-0 w-[56px] h-[46px] bg-[#34C759] rounded-b-[20px] shadow-sm">
					<svg width="16" height="16" viewBox="0 0 16 16" className="absolute top-0 -left-[15.5px] text-[#34C759]">
						<path d="M 16 0 V 16 Q 16 0 0 0 Z" fill="currentColor" />
					</svg>
					<svg width="16" height="16" viewBox="0 0 16 16" className="absolute top-0 -right-[15.5px] text-[#34C759]">
						<path d="M 0 0 V 16 Q 0 0 16 0 Z" fill="currentColor" />
					</svg>
				</div>
			</div>

			<div className="flex justify-around items-stretch w-full h-full relative z-20">
				<Link 
					to="/my-cases" 
					onClick={() => setProfileMenuOpen(false)}
					className="flex-1 w-full h-full relative"
				>
					<NavItemContent 
						active={activeIndex === 0} 
						icon={FolderOpen} 
						label={t('navigation.my_cases') || 'My Cases'} 
					/>
				</Link>
				
				<div className="flex-1 w-full h-full relative" ref={menuRef}>
					<button 
						onClick={(e) => {
							e.preventDefault();
							setProfileMenuOpen(!profileMenuOpen)
						}} 
						className="w-full h-full relative outline-none"
					>
						<NavItemContent 
							active={activeIndex === 1} 
							icon={User} 
							label={t('navigation.profile') || 'Profile'} 
						/>
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
			</div>
		</nav>
	)
}
