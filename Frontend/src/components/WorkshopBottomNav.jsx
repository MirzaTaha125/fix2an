import { useEffect } from 'react'
import WorkshopMobileNav from './WorkshopMobileNav'

export default function WorkshopBottomNav() {
	useEffect(() => {
		document.documentElement.classList.add('workshop-menu-layout')
		return () => document.documentElement.classList.remove('workshop-menu-layout')
	}, [])

	return (
		<nav className="mobile-bottom-nav lg:hidden bg-white border-t border-gray-200 safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
			<div className="mx-auto flex w-full max-w-md">
				<WorkshopMobileNav />
			</div>
		</nav>
	)
}
