import React from 'react'
import { cn } from '../../utils/cn'

export const Input = React.forwardRef(({ className, type, ...props }, ref) => {
	const { fdprocessedid, ...filteredProps } = props

	return (
		<input
			type={type}
			className={cn(
				'flex h-10 w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200 hover:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			ref={ref}
			{...filteredProps}
		/>
	)
})
Input.displayName = 'Input'

