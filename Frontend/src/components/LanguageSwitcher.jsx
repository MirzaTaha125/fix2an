import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const languages = [
	{ code: 'sv', name: 'Svenska', flag: '🇸🇪' },
	{ code: 'en', name: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher({ isScrolled = false }) {
	const { i18n } = useTranslation()
	const [isOpen, setIsOpen] = useState(false)
	const dropdownRef = useRef(null)

	useEffect(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false)
			}
		}
		document.addEventListener("mousedown", handleClickOutside)
		return () => {
			document.removeEventListener("mousedown", handleClickOutside)
		}
	}, [dropdownRef])

	const handleLanguageChange = (newLocale) => {
		i18n.changeLanguage(newLocale)
		localStorage.setItem('language', newLocale)
		setIsOpen(false)
	}

	return (
		<div className="relative flex items-center" ref={dropdownRef}>
			<button 
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 transition-colors focus:outline-none"
			>
				<Globe className={`h-5 w-5 transition-colors duration-300 ${
					isScrolled ? 'text-gray-600' : 'text-white/90 shadow-sm drop-shadow-sm'
				}`} />
			</button>

			{isOpen && (
				<div 
					className="absolute right-0 top-full mt-2 w-36 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
				>
					<div className="py-1">
						{languages.map((language) => (
							<button
								key={language.code}
								onClick={() => handleLanguageChange(language.code)}
								className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center space-x-2 ${
									i18n.language === language.code ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'
								}`}
							>
								<span className="text-base">{language.flag}</span>
								<span>{language.name}</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

