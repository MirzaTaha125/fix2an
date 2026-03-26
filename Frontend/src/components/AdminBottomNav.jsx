import { Link, useLocation } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const NavItemContent = ({ active, icon: Icon, label }) => {
	return (
		<div className="flex flex-col items-center w-full h-full relative z-20">
			<div 
				className={`absolute transition-all duration-300 flex items-center justify-center top-[14px] ${
					active ? 'text-[#34C759]' : 'text-gray-400'
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

export default function AdminBottomNav() {
	const location = useLocation()
	const { t } = useTranslation()

	const activeIndex = 0;

	return (
		<nav className="fixed bottom-0 left-0 right-0 h-[70px] bg-white border-t border-gray-100 z-50 max-md:block md:hidden safe-area-pb shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">

			<div className="flex justify-around items-stretch w-full h-full relative z-20">
				<Link 
					to="/admin" 
					className="flex-1 w-full h-full relative"
				>
					<NavItemContent 
						active={true} 
						icon={Shield} 
						label="Admin Panel"
					/>
				</Link>
			</div>
		</nav>
	)
}
