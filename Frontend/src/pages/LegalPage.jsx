import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useRegisterMobileBack } from '../context/MobileBackContext'

export function LegalContent({ pageKey }) {
	const { t } = useTranslation()
	const prefix = `legal.${pageKey}`
	const sections = t(`${prefix}.sections`, { returnObjects: true })

	return (
		<>
			<h1 className="page-title !mb-2">
				{t(`${prefix}.title`)}
			</h1>
			<p className="text-sm text-gray-500 mb-8">{t(`${prefix}.updated`)}</p>

			<div className="space-y-8">
				{Array.isArray(sections) &&
					sections.map((section, index) => (
						<section key={section.title || index}>
							<h2 className="text-lg font-bold text-[#05324f] mb-2">{section.title}</h2>
							<p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
								{section.body}
							</p>
						</section>
					))}
			</div>
		</>
	)
}

export default function LegalPage({ pageKey }) {
	const navigate = useNavigate()
	useRegisterMobileBack(() => navigate(-1), true)

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="list-page-content pb-28 lg:pb-16">
				<LegalContent pageKey={pageKey} />
			</main>

			<Footer />
		</div>
	)
}
