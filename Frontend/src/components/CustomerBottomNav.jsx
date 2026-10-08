import { useEffect } from 'react'
import CustomerMobileNav from './CustomerMobileNav'

export default function CustomerBottomNav() {
	useEffect(() => {
		document.documentElement.classList.add('customer-menu-layout')
		return () => document.documentElement.classList.remove('customer-menu-layout')
	}, [])

	return (
		<nav className="mobile-bottom-nav lg:hidden bg-white border-t border-gray-200 safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
			<div className="mx-auto flex w-full max-w-md">
				<CustomerMobileNav />
			</div>
		</nav>
	)
}
