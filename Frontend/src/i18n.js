import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './locales/en.json'
import svTranslations from './locales/sv.json'
import { DEFAULT_LANGUAGE, isLanguageSelectionEnabled } from './config/language.js'

const savedLanguage = localStorage.getItem('language')
const initialLanguage = isLanguageSelectionEnabled()
	? savedLanguage || DEFAULT_LANGUAGE
	: DEFAULT_LANGUAGE

if (!isLanguageSelectionEnabled()) {
	localStorage.setItem('language', DEFAULT_LANGUAGE)
}

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslations },
			sv: { translation: svTranslations },
		},
		lng: initialLanguage,
		fallbackLng: 'en',
		ns: ['translation'],
		defaultNS: 'translation',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n
