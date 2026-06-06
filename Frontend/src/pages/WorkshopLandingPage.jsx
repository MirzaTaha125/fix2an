import { Link } from 'react-router-dom'
import { CheckCircle, Building2, DollarSign, ArrowRight, ShieldCheck, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BENEFIT_ITEMS = [
	{ key: 'benefit1', descKey: 'benefit1_desc', Icon: Building2 },
	{ key: 'benefit2', descKey: 'benefit2_desc', Icon: CheckCircle },
	{ key: 'benefit3', descKey: 'benefit3_desc', Icon: DollarSign },
]

export default function WorkshopLandingPage() {
	const { t } = useTranslation()

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="list-page-main w-full max-w-2xl md:max-w-5xl mx-auto px-4 pt-24 md:pt-28 pb-10 md:pb-12 lg:pb-16">
				<section className="w-full">
					<div className="text-center mb-8 md:mb-10">
						<h1 className="text-[2rem] md:text-5xl lg:text-[3.35rem] font-black text-[#05324f] leading-[1.15] md:leading-tight lg:leading-[1.2] mb-5 tracking-tight">
							{t('homepage.workshop.title')}
						</h1>
						<p className="text-[#05324f]/70 text-[1rem] lg:text-xl leading-relaxed px-1 max-w-xl mx-auto">
							{t('homepage.workshop.subtitle')}
						</p>
					</div>

					<div className="flex justify-center mb-10 md:mb-12">
						<Link
							to="/workshop/signup"
							className="w-full max-w-[340px] sm:max-w-[360px] bg-[#38BC54] rounded-xl text-white flex items-center justify-center px-4 py-4 lg:py-5 shadow-sm font-semibold text-sm lg:text-base active:scale-95 transition-transform hover:brightness-105"
						>
							{t('homepage.workshop.cta')}
						</Link>
					</div>

					<div className="w-full space-y-9 md:space-y-11">
						<div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-10 w-full py-2 sm:py-3">
							{BENEFIT_ITEMS.map(({ key, descKey, Icon }) => (
								<div key={key} className="flex flex-col items-center text-center">
									<Icon
										className="w-9 h-9 sm:w-10 sm:h-10 text-[#38BC54] mb-4 sm:mb-5"
										fill="none"
										stroke="#38BC54"
										strokeWidth={2}
									/>
									<p className="text-sm sm:text-base font-semibold text-[#05324f] leading-tight mb-2 sm:mb-2.5">
										{t(`homepage.workshop.${key}`)}
									</p>
									<p className="text-xs sm:text-sm text-[#05324f]/75 leading-snug">
										{t(`homepage.workshop.${descKey}`)}
									</p>
								</div>
							))}
						</div>

						<div className="w-full rounded-xl sm:rounded-2xl border border-[#38BC54]/20 bg-[#F2F9F4] px-4 sm:px-5 py-4 sm:py-5 flex items-start gap-3">
							<ShieldCheck
								className="w-7 h-7 sm:w-8 sm:h-8 text-[#38BC54] shrink-0"
								fill="none"
								stroke="#38BC54"
								strokeWidth={2}
							/>
							<div className="min-w-0">
								<p className="text-[#38BC54] font-semibold text-base sm:text-lg leading-snug">
									{t('homepage.workshop.certified')}
								</p>
								<p className="text-[#05324f] text-xs sm:text-sm leading-relaxed mt-1.5">
									{t('homepage.workshop.certified_desc')}
								</p>
							</div>
						</div>

						<div className="w-full rounded-2xl sm:rounded-3xl border border-gray-200 bg-white px-6 sm:px-8 py-7 sm:py-8 text-center">
							<div className="flex items-center justify-center gap-1.5 mb-4">
								{[...Array(5)].map((_, i) => (
									<Star key={i} className="w-6 h-6 sm:w-7 sm:h-7 text-[#38BC54]" fill="#38BC54" stroke="#38BC54" />
								))}
							</div>
							<p className="text-lg sm:text-xl font-bold text-[#05324f] leading-snug">
								Ready to grow your workshop?
							</p>
							<p className="text-base sm:text-lg text-[#05324f]/75 mt-2.5">
								Join hundreds of other workshops already using Fix2An to grow their business.
							</p>
						</div>

						<div className="text-center pt-2 pb-2">
							<Link
								to="/workshop/signup"
								className="text-[#38BC54] font-bold text-base sm:text-lg inline-flex items-center justify-center gap-2 hover:opacity-80 active:opacity-70 transition-opacity"
							>
								Get started now
								<ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
							</Link>
						</div>
					</div>
				</section>
			</main>

			<Footer />
		</div>
	)
}
