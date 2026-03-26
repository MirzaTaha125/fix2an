import * as React from 'react'
import { cn } from '../../utils/cn'

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				'flex min-h-[80px] w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3 text-sm ring-offset-white placeholder:text-gray-400 focus:outline-none focus:ring-0 focus:border-gray-200 hover:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-50',
				className,
			)}
			ref={ref}
			{...props}
		/>
	)
})
Textarea.displayName = 'Textarea'

export { Textarea }

