import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Send, FileCheck, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

/**
 * Bottom navigation for workshop users. Shown on mobile across all workshop pages.
 * Links: Jobs (requests) | Proposals | Contracts | Profile
 */

const NavItemContent = ({ active, icon: Icon, label }) => {
	return (
		<div className="flex flex-col items-center w-full h-full relative z-20">
			<div 
				className={`absolute transition-all duration-300 flex items-center justify-center top-[14px] ${
					active ? 'text-[#05324f]' : 'text-gray-400'
				}`}
			>
				<Icon className="w-[24px] h-[24px]" />
			</div>
			
			<span 
				className={`absolute w-full text-center px-1 transition-all duration-300 bottom-[8px] text-[10px] ${
					active ? 'font-bold text-[#05324f]' : 'font-medium text-gray-500'
				}`}
			>
				{label}
			</span>
		</div>
	)
}

export default function WorkshopBottomNav() {
	const { pathname } = useLocation()
	const { t } = useTranslation()
	const { user, logout } = useAuth()
	const navigate = useNavigate()
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const dropdownRef = useRef(null)

	const isActive = (path) => pathname.startsWith(path)

	const handleLogout = () => {
		logout()
		navigate('/')
	}

	const getActiveIndex = () => {
		if (dropdownOpen || isActive('/workshop/profile')) return 3;
		if (isActive('/workshop/contracts')) return 2;
		if (isActive('/workshop/proposals')) return 1;
		if (isActive('/workshop/requests')) return 0;
		return 0;
	}
	const activeIndex = getActiveIndex();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setDropdownOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	return (
		<nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100 z-50 max-md:block md:hidden safe-area-pb shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">

			<div className="flex justify-around items-stretch w-full h-full relative z-20">
				<Link to="/workshop/requests" className="flex-1 w-full h-full relative" onClick={() => setDropdownOpen(false)}>
					<NavItemContent active={activeIndex === 0} icon={FileText} label={t('navigation.jobs') || 'Jobs'} />
				</Link>
				<Link to="/workshop/proposals" className="flex-1 w-full h-full relative" onClick={() => setDropdownOpen(false)}>
					<NavItemContent active={activeIndex === 1} icon={Send} label={t('navigation.proposals') || 'Proposals'} />
				</Link>
				<Link to="/workshop/contracts" className="flex-1 w-full h-full relative" onClick={() => setDropdownOpen(false)}>
					<NavItemContent active={activeIndex === 2} icon={FileCheck} label={t('navigation.contracts') || 'Contracts'} />
				</Link>
				<div className="flex-1 w-full h-full relative" ref={dropdownRef}>
					<button 
						onClick={(e) => {
							e.preventDefault();
							setDropdownOpen(!dropdownOpen);
						}} 
						className="w-full h-full relative outline-none"
					>
						<NavItemContent active={activeIndex === 3} icon={User} label={t('navigation.profile') || 'Profile'} />
					</button>
				
				{dropdownOpen && (
					<div className="absolute bottom-full mb-3 right-[-12px] w-48 bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-[60]">
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
			</div>
		</nav>
	)
}
