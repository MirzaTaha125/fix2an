import { Link, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { Camera, FileUp, ShieldCheck, ArrowRight, Tag, Clock, Smartphone, Warehouse, ClipboardCheck, Star, ClipboardList, CreditCard, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getRoleHomePath } from '../utils/roleHome'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TRUST_ITEMS = [
	{ key: 'trust_verified', Icon: ShieldCheck },
	{ key: 'trust_free', Icon: Tag },
	{ key: 'trust_fast', Icon: Clock },
]

const HOW_IT_WORKS_STEPS = [
	{ Icon: Smartphone, titleKey: 'step1_title', descKey: 'step1_desc' },
	{ Icon: Warehouse, titleKey: 'step2_title', descKey: 'step2_desc' },
	{ Icon: ClipboardCheck, titleKey: 'step3_title', descKey: 'step3_desc' },
]

const WHY_CHOOSE_FEATURES = [
	{ Icon: Tag, titleKey: 'feature1_title', descKey: 'feature1_desc' },
	{ Icon: Star, titleKey: 'feature2_title', descKey: 'feature2_desc' },
	{ Icon: Clock, titleKey: 'feature3_title', descKey: 'feature3_desc' },
	{ Icon: ShieldCheck, titleKey: 'feature4_title', descKey: 'feature4_desc' },
]

const FAQ_ITEMS = [
	{ Icon: ClipboardList, titleKey: 'q1_title', descKey: 'q1_desc' },
	{ iconVariant: 'free_tag', titleKey: 'q2_title', descKey: 'q2_desc' },
	{ Icon: CreditCard, titleKey: 'q3_title', descKey: 'q3_desc' },
	{ Icon: Clock, titleKey: 'q4_title', descKey: 'q4_desc' },
	{ Icon: UserX, titleKey: 'q5_title', descKey: 'q5_desc' },
	{ Icon: ShieldCheck, titleKey: 'q6_title', descKey: 'q6_desc' },
]

export default function HomePage() {
	const { t } = useTranslation()
	const { user, loading: authLoading } = useAuth()
	const location = useLocation()
	const howItWorksPrefix = 'homepage.section_how_it_works'
	const whyChoosePrefix = 'homepage.section_why_choose'
	const faqPrefix = 'homepage.section_faq'

	useEffect(() => {
		const sectionId = location.hash.replace('#', '')
		if (!sectionId) return

		const scrollToSection = () => {
			document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		const timer = window.setTimeout(scrollToSection, 100)
		return () => window.clearTimeout(timer)
	}, [location.hash])

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-600">{t('common.loading')}</p>
				</div>
			</div>
		)
	}

	const roleHome = getRoleHomePath(user)
	if (user && roleHome !== '/') {
		return <Navigate to={roleHome} replace />
	}

	return (
		<div className="list-page-shell bg-white">
			<Navbar />

			<main className="list-page-content pb-28 lg:pb-16 bg-white">
				<section className="w-full max-w-lg md:max-w-none mx-auto">
					<div id="hero" className="scroll-mt-28 text-left mb-8 md:mb-10">
						<h1 className="text-[2rem] sm:text-[2.25rem] lg:text-[3.25rem] xl:text-[3.5rem] font-black leading-[1.15] tracking-tight mb-5">
							<span className="text-[#05324f] block">{t('homepage.mobile.title_line1')}</span>
							<span className="text-[#38BC54] block">{t('homepage.mobile.title_line2')}</span>
						</h1>
						<p className="text-[#05324f]/80 text-[0.95rem] sm:text-base lg:text-lg leading-loose">
							{t('homepage.mobile.subtitle')}
						</p>
						<p className="text-[#05324f]/80 text-[0.95rem] sm:text-base lg:text-lg leading-loose mt-3">
							{t('homepage.mobile.subtitle_line2')}
						</p>
					</div>

					<div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-8 md:mb-10">
						<Link
							to="/upload"
							className="w-full md:flex-1 flex items-center justify-center gap-3 py-4 px-5 bg-[#38BC54] text-white rounded-xl font-semibold text-[0.9375rem] shadow-sm active:scale-[0.98] transition-transform hover:brightness-105"
						>
							<Camera className="w-[1.125rem] h-[1.125rem] shrink-0" strokeWidth={2} />
							<span>{t('homepage.mobile.take_photo')}</span>
						</Link>

						<Link
							to="/upload?mode=no-image"
							className="relative w-full md:flex-1 flex items-center justify-center py-4 px-10 sm:px-12 bg-white border border-gray-200 rounded-xl text-[#05324f] shadow-sm active:scale-[0.98] transition-transform hover:border-gray-300 hover:bg-gray-50/50"
						>
							<div className="flex items-center gap-3">
								<FileUp className="w-[1.125rem] h-[1.125rem] shrink-0 text-[#38BC54]" strokeWidth={2} />
								<div className="text-left">
									<p className="font-semibold text-[0.9375rem] text-[#05324f] leading-tight">
										{t('homepage.mobile.no_protocol_title')}
									</p>
									<p className="text-[#05324f]/70 text-xs leading-snug mt-0.5">
										{t('homepage.mobile.no_protocol_desc')}
									</p>
								</div>
							</div>
							<ArrowRight className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 shrink-0 text-[#05324f]" strokeWidth={2} />
						</Link>
					</div>

					<div className="mt-10 sm:mt-12 mb-8 md:mb-10">
						<div className="grid grid-cols-3 divide-x divide-gray-200">
							{TRUST_ITEMS.map(({ key, Icon }) => (
								<div
									key={key}
									className="flex flex-col items-center text-center px-3 sm:px-5 py-3"
								>
									<Icon
										className="w-9 h-9 sm:w-10 sm:h-10 text-[#38BC54] mb-3.5 sm:mb-4"
										fill="none"
										stroke="#38BC54"
										strokeWidth={2}
									/>
									<p className="text-xs sm:text-sm md:text-[0.9375rem] font-medium text-[#05324f] leading-snug">
										{t(`homepage.mobile.${key}`)}
									</p>
								</div>
							))}
						</div>
					</div>

					<section id="how-it-works" className="pt-8 md:pt-14 lg:pt-12 scroll-mt-28">
						<div className="text-center mb-8 md:mb-12 lg:mb-10">
							<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold text-[#05324f] mb-2.5 md:mb-4">
								{t(`${howItWorksPrefix}.title`)}
							</h2>
							<p className="text-gray-500 text-sm sm:text-base md:text-lg lg:text-[1.0625rem] leading-loose max-w-md md:max-w-2xl lg:max-w-2xl mx-auto">
								{t(`${howItWorksPrefix}.subtitle`)}
							</p>
						</div>

						<div className="relative md:grid md:grid-cols-3 md:gap-6 lg:gap-5">
							{HOW_IT_WORKS_STEPS.map(({ Icon, titleKey, descKey }, index) => (
								<div key={titleKey} className="relative">
									<div className="relative z-10 bg-white rounded-2xl md:rounded-3xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-3.5 md:px-6 md:pb-6 md:pt-5 lg:px-5 lg:pb-5 lg:pt-4 h-full">
										<div className="flex items-start gap-3 sm:gap-4 md:flex-col md:items-center md:text-center">
											<div className="relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-[5.5rem] lg:h-[5.5rem] shrink-0 md:mt-2">
												<div className="absolute -top-2 -left-0.5 md:-top-4 md:left-1/2 md:-translate-x-1/2 z-30 w-7 h-7 md:w-8 md:h-8 lg:w-8 lg:h-8 rounded-full bg-[#38BC54] text-white text-sm md:text-base font-bold flex items-center justify-center shadow-sm">
													{index + 1}
												</div>
												<div className="relative z-20 w-full h-full rounded-full bg-[#F2F9F4] flex items-center justify-center ring-[3px] ring-white">
													<Icon className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-[3.25rem] lg:h-[3.25rem] text-[#38BC54]" strokeWidth={1.5} />
												</div>
											</div>
											<div className="min-w-0 flex-1 pt-1 md:pt-2">
												<h3 className="font-bold text-[#05324f] text-[0.9375rem] sm:text-base md:text-lg lg:text-[1.0625rem] mb-1 md:mb-2 leading-snug">
													{t(`${howItWorksPrefix}.${titleKey}`)}
												</h3>
												<p className="text-[0.8125rem] sm:text-sm md:text-base lg:text-[0.9375rem] text-gray-500 leading-loose">
													{t(`${howItWorksPrefix}.${descKey}`)}
												</p>
											</div>
										</div>
									</div>

									{index < HOW_IT_WORKS_STEPS.length - 1 && (
										<div className="relative z-30 flex px-4 sm:px-5 -my-1 md:hidden">
											<div className="w-[4.5rem] sm:w-20 flex justify-center">
												<div className="w-0 h-10 sm:h-12 border-l-2 border-dashed border-[#38BC54]" />
											</div>
										</div>
									)}
								</div>
							))}
						</div>

						<div className="mt-5 md:mt-8 lg:mt-7 rounded-xl bg-[#F2F9F4] p-4 sm:p-5 md:p-6 lg:p-5 flex items-center gap-3 md:gap-5">
							<ShieldCheck className="w-6 h-6 md:w-8 md:h-8 lg:w-7 lg:h-7 text-[#38BC54] shrink-0" strokeWidth={2} />
							<div className="min-w-0">
								<p className="font-bold text-[#38BC54] text-[0.9375rem] sm:text-base md:text-lg lg:text-[1.0625rem] leading-snug">
									{t(`${howItWorksPrefix}.verified_title`)}
								</p>
								<p className="text-[0.8125rem] sm:text-sm md:text-base lg:text-[0.9375rem] text-gray-500 leading-loose">
									{t(`${howItWorksPrefix}.verified_desc`)}
								</p>
							</div>
						</div>
					</section>

					<section className="pt-8 md:pt-14 lg:pt-12 mt-8 md:mt-14 lg:mt-12">
						<div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-10">
							<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold text-[#05324f] mb-2.5 md:mb-4">
								{t(`${whyChoosePrefix}.title`)}
							</h2>
							<p className="text-gray-500 text-sm sm:text-base md:text-lg lg:text-[1.0625rem] leading-loose max-w-md md:max-w-2xl lg:max-w-2xl mx-auto">
								{t(`${whyChoosePrefix}.subtitle`)}
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-5 mb-4 sm:mb-5 md:mb-8 lg:mb-6">
							{WHY_CHOOSE_FEATURES.map(({ Icon, titleKey, descKey }) => (
								<div
									key={titleKey}
									className="bg-white rounded-2xl md:rounded-3xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 md:p-6 lg:p-5 flex flex-col items-center text-center"
								>
									<div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-[5.5rem] lg:h-[5.5rem] rounded-full bg-[#F2F9F4] flex items-center justify-center mb-3 sm:mb-4 md:mb-5 lg:mb-4">
										<Icon className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-[3.25rem] lg:h-[3.25rem] text-[#38BC54]" strokeWidth={1.5} />
									</div>
									<h3 className="font-bold text-[#05324f] text-[0.8125rem] sm:text-sm md:text-lg lg:text-[1.0625rem] mb-1.5 md:mb-2 leading-snug">
										{t(`${whyChoosePrefix}.${titleKey}`)}
									</h3>
									<p className="text-[0.75rem] sm:text-xs md:text-base lg:text-[0.9375rem] text-gray-500 leading-loose">
										{t(`${whyChoosePrefix}.${descKey}`)}
									</p>
								</div>
							))}
						</div>

						<div className="rounded-xl bg-[#F2F9F4] p-4 sm:p-5 md:p-6 lg:p-5 flex items-center gap-3 sm:gap-4 md:gap-5">
							<div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 lg:w-[4.5rem] lg:h-[4.5rem] rounded-full bg-white border-2 border-[#38BC54] flex items-center justify-center shrink-0">
								<span className="font-bold text-[#38BC54] text-sm sm:text-base md:text-lg lg:text-base leading-none">
									{t(`${whyChoosePrefix}.free_badge`)}
								</span>
							</div>
							<div className="min-w-0">
								<p className="font-bold text-[#38BC54] text-[0.9375rem] sm:text-base md:text-lg lg:text-[1.0625rem] leading-snug">
									{t(`${whyChoosePrefix}.free_title`)}
								</p>
								<p className="text-[0.8125rem] sm:text-sm md:text-base lg:text-[0.9375rem] text-gray-500 leading-loose mt-0.5">
									{t(`${whyChoosePrefix}.free_desc`)}
								</p>
							</div>
						</div>
					</section>

					<section id="faq" className="pt-8 md:pt-14 lg:pt-12 mt-8 md:mt-14 lg:mt-12 scroll-mt-28">
						<div className="w-full">
							<div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-10">
								<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-[2rem] font-bold text-[#05324f] mb-2.5 md:mb-4">
									{t(`${faqPrefix}.title`)}
								</h2>
								<p className="text-gray-500 text-sm sm:text-base md:text-lg lg:text-[1.0625rem] leading-loose max-w-md md:max-w-2xl lg:max-w-2xl mx-auto">
									{t(`${faqPrefix}.subtitle`)}
								</p>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-5">
								{FAQ_ITEMS.map(({ Icon, iconVariant, titleKey, descKey }) => (
									<div
										key={titleKey}
										className="bg-white rounded-2xl md:rounded-3xl border border-gray-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 md:p-6 lg:p-5 flex items-start gap-3 sm:gap-4 md:gap-5"
									>
										<div className="w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-[5.5rem] lg:h-[5.5rem] rounded-full bg-[#F2F9F4] flex items-center justify-center shrink-0">
											{iconVariant === 'free_tag' ? (
												<span className="font-bold text-[#38BC54] text-sm sm:text-base md:text-lg lg:text-base leading-none">
													0 kr
												</span>
											) : (
												<Icon className="w-9 h-9 sm:w-11 sm:h-11 md:w-14 md:h-14 lg:w-[3.25rem] lg:h-[3.25rem] text-[#38BC54]" strokeWidth={1.5} />
											)}
										</div>
										<div className="min-w-0 flex-1 md:py-1">
											<h3 className="font-bold text-[#05324f] text-[0.9375rem] sm:text-base md:text-lg lg:text-[1.0625rem] mb-1 md:mb-2 leading-snug">
												{t(`${faqPrefix}.${titleKey}`)}
											</h3>
											<p className="text-[0.8125rem] sm:text-sm md:text-base lg:text-[0.9375rem] text-gray-500 leading-loose">
												{t(`${faqPrefix}.${descKey}`)}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</section>
				</section>
			</main>

			<Footer />
		</div>
	)
}
