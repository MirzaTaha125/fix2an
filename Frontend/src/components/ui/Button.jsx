import React from 'react'
import { cn } from '../../utils/cn'

const buttonVariants = {
	default: 'bg-[#34C759] text-white hover:bg-[#2aad4a] active:bg-[#239f41]',
	destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
	outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 hover:border-gray-400',
	secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
	ghost: 'hover:bg-gray-100 text-gray-700',
	link: 'text-[#34C759] underline-offset-4 hover:underline',
	success: 'bg-[#34C759] text-white hover:bg-[#2aad4a] active:bg-[#239f41]',
	navy: 'bg-[#05324f] text-white hover:bg-[#042840] active:bg-[#031e30]',
}

const buttonSizes = {
	default: 'px-[22px] py-[14px] text-sm',
	sm: 'px-4 py-2 text-xs rounded-btn',
	lg: 'px-8 py-4 text-base rounded-btn',
	icon: 'h-10 w-10',
}

export const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
	const baseClasses =
		'inline-flex items-center justify-center whitespace-nowrap rounded-btn text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34C759] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer'
	const variantClass = buttonVariants[variant] || buttonVariants.default
	const sizeClass = buttonSizes[size] || buttonSizes.default

	return (
		<button ref={ref} className={cn(baseClasses, variantClass, sizeClass, className)} {...props} />
	)
})
Button.displayName = 'Button'
