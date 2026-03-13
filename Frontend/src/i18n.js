import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enTranslations from './locales/en.json'
import svTranslations from './locales/sv.json'

i18n
	.use(initReactI18next)
	.init({
		resources: {
			en: { translation: enTranslations },
			sv: { translation: svTranslations },
		},
		lng: localStorage.getItem('language') || 'en',
		fallbackLng: 'en',
		ns: ['translation'],
		defaultNS: 'translation',
		interpolation: {
			escapeValue: false,
		},
	})

export default i18n
