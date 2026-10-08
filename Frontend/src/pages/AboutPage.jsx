import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ShieldCheck, Users, Car, Wrench, MapPin, Hand } from 'lucide-react'

function AboutCard({ icon: Icon, title, desc }) {
	return (
		<div className="rounded-2xl border border-[#008037]/25 bg-[#F8FCF9] p-5 flex items-start gap-3 h-full">
			<div className="w-9 h-9 rounded-xl bg-[#E8F8EE] flex items-center justify-center shrink-0">
				<Icon className="w-5 h-5 text-[#008037]" />
			</div>
			<div className="min-w-0">
				<p className="text-sm lg:text-xl font-bold text-[#05324f] leading-[1.4] mb-2">{title}</p>
				<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">{desc}</p>
			</div>
		</div>
	)
}

const CARDS = [
	{ icon: Users, titleKey: 'who_title', descKey: 'who_desc' },
	{ icon: ShieldCheck, titleKey: 'why_title', descKey: 'why_desc' },
	{ icon: Car, titleKey: 'owners_title', descKey: 'owners_desc' },
	{ icon: Wrench, titleKey: 'workshops_title', descKey: 'workshops_desc' },
	{ icon: MapPin, titleKey: 'based_title', descKey: 'based_desc' },
	{ icon: Hand, titleKey: 'choose_title', descKey: 'choose_desc' },
]

export default function AboutPage() {
	const { t } = useTranslation()
	const prefix = 'homepage.about'

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28 pb-10">
				<div className="text-center mb-8 mt-4 sm:mt-5 max-w-3xl mx-auto">
					<h1 className="page-title lg:text-[2.75rem] lg:mb-5">
						{t(`${prefix}.title`)}
					</h1>
					<p className="text-[0.95rem] lg:text-lg text-[#374151] leading-[1.75] mb-4">
						{t(`${prefix}.intro`)}
					</p>
					<p className="text-sm lg:text-base text-gray-500 leading-[1.75]">
						{t(`${prefix}.body`)}
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
					{CARDS.map(({ icon: Icon, titleKey, descKey }) => (
						<AboutCard key={titleKey} icon={Icon} title={t(`${prefix}.${titleKey}`)} desc={t(`${prefix}.${descKey}`)} />
					))}
				</div>
			</main>

			<Footer />
		</div>
	)
}
