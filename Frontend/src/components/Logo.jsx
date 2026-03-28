import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

const Logo = ({ className, size = "text-5xl", ...props }) => {
	return (
		<Link 
			to="/" 
			className={cn("flex items-center transition-all duration-300 hover:scale-105", className)}
			{...props}
		>
			<span className={cn(size, "sm:text-5xl md:text-5xl font-extrabold tracking-tight")}>
				<span className="text-[#05324f]">Fix</span>
				<span className="text-green-500">2an</span>
			</span>
		</Link>
	)
}

export default Logo
