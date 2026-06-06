import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'
import { useAuth } from '../context/AuthContext'
import { getRoleLogoPath } from '../utils/roleHome'
import mainLogo from '../assets/main_logo.png'

const Logo = ({ className, ...props }) => {
	const { user } = useAuth()
	const homePath = getRoleLogoPath(user)

	return (
		<Link
			to={homePath}
			className={cn("flex items-center transition-all duration-300 hover:scale-105", className)}
			{...props}
		>
			<img src={mainLogo} alt="Fix2An" className="h-12 md:h-16 w-auto object-contain" />
		</Link>
	)
}

export default Logo
