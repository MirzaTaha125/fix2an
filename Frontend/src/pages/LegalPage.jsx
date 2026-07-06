import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function LegalPage({ pageKey }) {
	const { t } = useTranslation()
	const prefix = `legal.${pageKey}`
	const sections = t(`${prefix}.sections`, { returnObjects: true })

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="list-page-content pb-28 lg:pb-16">
				<h1 className="text-2xl sm:text-3xl font-black text-[#05324f] mb-2">
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
			</main>

			<Footer />
		</div>
	)
}
