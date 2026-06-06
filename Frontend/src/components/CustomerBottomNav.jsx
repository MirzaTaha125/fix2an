import CustomerMobileNav from './CustomerMobileNav'

export default function CustomerBottomNav() {
	return (
		<nav className="mobile-bottom-nav lg:hidden bg-white border-t border-gray-200 safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
			<CustomerMobileNav />
		</nav>
	)
}
