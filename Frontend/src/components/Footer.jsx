import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
	const { t } = useTranslation()

	return (
		<footer className="bg-white py-6 sm:py-8 border-t border-gray-200 mt-auto">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
					<p className="text-xs sm:text-sm text-center sm:text-left" style={{ color: '#05324f' }}>
						{t('homepage.footer.email')}
					</p>
					<div className="flex items-center gap-3 sm:gap-4">
						<Link to="/terms" className="text-xs sm:text-sm hover:underline" style={{ color: '#05324f' }}>
							{t('homepage.footer.terms')}
						</Link>
						<Link to="/privacy" className="text-xs sm:text-sm hover:underline" style={{ color: '#05324f' }}>
							{t('homepage.footer.privacy')}
						</Link>
					</div>
				</div>
			</div>
		</footer>
	)
}

