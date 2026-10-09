import React from 'react'
import { cn } from '../../utils/cn'

/** Primary button green — matches product UI */
export const BRAND_BTN_GREEN = '#1B8F3E'

const buttonVariants = {
	default: 'bg-brand-btn text-white border border-transparent',
	destructive: 'bg-[#EF4444] text-white hover:brightness-105 active:brightness-95',
	outline: 'border-[1.5px] border-[#1B8F3E] bg-white text-[#1B8F3E] hover:bg-[#E8F5EC]',
	secondary: 'bg-[#F3F4F6] text-[#0D1B2A] hover:bg-gray-200',
	ghost: 'hover:bg-[#F3F4F6] text-[#0D1B2A]',
	link: 'text-[#1B8F3E] underline-offset-4 hover:underline',
	success: 'bg-brand-btn text-white border border-transparent',
	navy: 'bg-[#0D1B2A] text-white hover:brightness-110 active:brightness-95',
}

const buttonSizes = {
	default: 'min-h-[42px] px-5 py-2.5 text-sm lg:min-h-[52px] lg:px-6 lg:py-3.5 lg:text-base',
	sm: 'min-h-[42px] px-4 py-2 text-sm rounded-lg lg:rounded-xl lg:min-h-[40px]',
	lg: 'min-h-[42px] px-6 py-2.5 text-sm lg:min-h-[56px] lg:px-8 lg:py-4 lg:text-base',
	icon: 'h-10 w-10 rounded-lg lg:rounded-xl',
}

export const Button = React.forwardRef(
	({ className, variant = 'default', size = 'default', asChild = false, arrow, children, ...props }, ref) => {
		// `arrow` kept for backwards compat but ignored — primary UI has no arrow
		const baseClasses =
			'inline-flex items-center justify-center whitespace-nowrap rounded-lg lg:rounded-xl text-sm lg:text-base font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B8F3E] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-gray-300 disabled:opacity-100 cursor-pointer'
		const variantClass = buttonVariants[variant] || buttonVariants.default
		const sizeClass = buttonSizes[size] || buttonSizes.default
		const classes = cn(baseClasses, variantClass, sizeClass, className)

		if (asChild && React.isValidElement(children)) {
			return React.cloneElement(children, {
				...props,
				className: cn(classes, children.props.className),
				ref,
			})
		}

		return (
			<button ref={ref} className={classes} {...props}>
				{children}
			</button>
		)
	}
)
Button.displayName = 'Button'
