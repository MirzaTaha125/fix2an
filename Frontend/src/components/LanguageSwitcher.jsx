import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const languages = [
	{ code: 'sv', name: 'Svenska', flag: '🇸🇪' },
	{ code: 'en', name: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher({ isScrolled = false }) {
	const { i18n } = useTranslation()
	const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0]

	const handleLanguageChange = (e) => {
		const newLocale = e.target.value
		i18n.changeLanguage(newLocale)
		localStorage.setItem('language', newLocale)
	}

	return (
		<div className="flex items-center space-x-2">
			<Globe className={`h-4 w-4 transition-colors duration-300 ${
				isScrolled ? 'text-gray-600' : 'text-white/80'
			}`} />
			<select
				value={i18n.language}
				onChange={handleLanguageChange}
				className={`px-2 py-1 rounded-md text-sm transition-all duration-300 border ${
					isScrolled 
						? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50' 
						: 'border-white/30 bg-white/90 backdrop-blur-sm text-gray-900 hover:bg-white'
				}`}
				style={!isScrolled ? { color: '#111827' } : {}}
			>
				{languages.map((language) => (
					<option key={language.code} value={language.code} style={{ color: '#111827', backgroundColor: '#ffffff' }}>
						{language.flag} {language.name}
					</option>
				))}
			</select>
		</div>
	)
}

