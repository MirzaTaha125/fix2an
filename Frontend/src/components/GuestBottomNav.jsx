import { Link, useLocation } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'

export default function GuestBottomNav() {
	const location = useLocation()
	const { t } = useTranslation()

	const navItems = [
		{
			path: '/auth/signin',
			icon: LogIn,
			label: t('auth.login_short') || 'Login',
		},
		{
			path: '/auth/signup',
			icon: UserPlus,
			label: t('auth.register_short') || 'Register',
		},
	]

	return (
		<div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50">
			<div className="flex justify-around items-center h-16">
				{navItems.map((item) => {
					const isActive = location.pathname === item.path
					const Icon = item.icon

					return (
						<Link
							key={item.path}
							to={item.path}
							className={cn(
								'flex flex-col items-center justify-center flex-1 h-full gap-1',
								isActive ? 'text-[#34C759]' : 'text-gray-500 hover:text-gray-900'
							)}
						>
							<Icon
								className={cn(
									'w-6 h-6 transition-transform duration-200',
									isActive ? 'scale-110 stroke-[2.5px]' : 'stroke-2'
								)}
							/>
							<span
								className={cn(
									'text-[10px] font-medium transition-colors duration-200',
									isActive ? 'text-[#34C759]' : 'text-gray-500'
								)}
							>
								{item.label}
							</span>
						</Link>
					)
				})}
			</div>
		</div>
	)
}
