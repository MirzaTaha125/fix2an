import { Link, useLocation } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'

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

export default function GuestBottomNav() {
	const location = useLocation()
	const { t } = useTranslation()

	const getActiveIndex = () => {
		if (location.pathname.includes('signup') || location.pathname.includes('register')) return 1;
		if (location.pathname.includes('signin') || location.pathname.includes('login') || location.pathname.includes('forgot')) return 0;
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
					to="/auth/signin" 
					className="flex-1 w-full h-full relative"
				>
					<NavItemContent 
						active={activeIndex === 0} 
						icon={LogIn} 
						label={t('auth.login_short') || 'Login'} 
					/>
				</Link>
				
				<Link 
					to="/auth/signup" 
					className="flex-1 w-full h-full relative"
				>
					<NavItemContent 
						active={activeIndex === 1} 
						icon={UserPlus} 
						label={t('auth.register_short') || 'Register'} 
					/>
				</Link>
			</div>
		</nav>
	)
}
