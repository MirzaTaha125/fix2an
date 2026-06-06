import { Link, Navigate } from 'react-router-dom'
import { Camera, FileUp, ShieldCheck, ArrowRight, Tag, Clock, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { getRoleHomePath } from '../utils/roleHome'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TRUST_ITEMS = [
	{ key: 'trust_prices', descKey: 'trust_prices_desc', Icon: Tag },
	{ key: 'trust_fast', descKey: 'trust_fast_desc', Icon: Clock },
	{ key: 'trust_secure', descKey: 'trust_secure_desc', Icon: ShieldCheck },
]

export default function HomePage() {
	const { t } = useTranslation()
	const { user, loading: authLoading } = useAuth()

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

			<main className="list-page-content pb-28 lg:pb-16">
				<section className="w-full">
					<div className="text-center mb-8 md:mb-10">
						<h1 className="text-[2rem] lg:text-[3.35rem] font-black text-[#05324f] leading-[1.15] lg:leading-[1.2] mb-5 tracking-tight">
							{t('homepage.mobile.title')}
						</h1>
						<p className="text-[#05324f]/70 text-[1rem] lg:text-xl leading-relaxed px-1 max-w-xl mx-auto">
							{t('homepage.mobile.subtitle')}
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3 lg:gap-4 mb-5 lg:mb-7 max-w-[340px] sm:max-w-[360px] lg:max-w-[440px] mx-auto">
						<Link
							to="/upload"
							className="bg-[#38BC54] rounded-2xl lg:rounded-3xl aspect-[5/4] text-white flex flex-col items-center justify-center gap-1.5 lg:gap-2.5 px-3 py-2.5 lg:px-4 lg:py-3.5 shadow-sm active:scale-95 transition-transform hover:brightness-105"
						>
							<div className="bg-white/20 w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0">
								<Camera className="w-[22px] h-[22px] lg:w-7 lg:h-7" strokeWidth={2} />
							</div>
							<span className="text-center font-normal text-sm lg:text-base leading-tight px-1">
								{t('homepage.mobile.take_photo')}
							</span>
						</Link>
						<Link
							to="/upload"
							className="bg-white border-2 border-gray-100 rounded-2xl lg:rounded-3xl aspect-[5/4] text-[#05324f] flex flex-col items-center justify-center gap-1.5 lg:gap-2.5 px-3 py-2.5 lg:px-4 lg:py-3.5 shadow-sm active:scale-95 transition-transform hover:border-gray-200"
						>
							<div className="bg-[#F2F9F4] w-11 h-11 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0">
								<FileUp className="w-[22px] h-[22px] lg:w-7 lg:h-7 text-[#38BC54]" strokeWidth={2} />
							</div>
							<span className="text-center font-normal text-sm lg:text-base leading-tight px-1">
								{t('homepage.mobile.upload_pdf')}
							</span>
						</Link>
					</div>

					<div className="flex items-center justify-center gap-4 lg:gap-5 mb-5 lg:mb-7 max-w-sm lg:max-w-md mx-auto">
						<div className="h-px bg-gray-200 flex-1" />
						<span className="text-gray-400 font-medium text-sm lg:text-base">{t('common.or')}</span>
						<div className="h-px bg-gray-200 flex-1" />
					</div>

					<div className="text-center mb-10">
						<Link
							to="/upload?mode=no-image"
							className="text-[#05324f] font-semibold text-[1rem] lg:text-lg underline underline-offset-4 inline-flex items-center gap-2 active:opacity-70 transition-opacity hover:opacity-80"
						>
							{t('homepage.mobile.no_image')} <ArrowRight className="w-[18px] h-[18px] lg:w-5 lg:h-5" />
						</Link>
					</div>

					<div className="w-full space-y-9 md:space-y-11">
						<div className="w-full rounded-xl sm:rounded-2xl border border-[#38BC54]/20 bg-[#F2F9F4] px-4 sm:px-5 py-4 sm:py-5 flex items-start gap-3">
							<ShieldCheck
								className="w-7 h-7 sm:w-8 sm:h-8 text-[#38BC54] shrink-0"
								fill="none"
								stroke="#38BC54"
								strokeWidth={2}
							/>
							<div className="min-w-0">
								<p className="text-[#38BC54] font-semibold text-base sm:text-lg leading-snug">
									{t('homepage.mobile.verified_badge')}
								</p>
								<p className="text-[#05324f] text-xs sm:text-sm leading-relaxed mt-1.5">
									{t('homepage.mobile.verified_desc')}
								</p>
							</div>
						</div>

						<div className="grid grid-cols-3 gap-4 sm:gap-8 md:gap-10 w-full py-2 sm:py-3">
							{TRUST_ITEMS.map(({ key, descKey, Icon }) => (
								<div key={key} className="flex flex-col items-center text-center">
									<Icon
										className="w-9 h-9 sm:w-10 sm:h-10 text-[#38BC54] mb-4 sm:mb-5"
										fill="none"
										stroke="#38BC54"
										strokeWidth={2}
									/>
									<p className="text-sm sm:text-base font-semibold text-[#05324f] leading-tight mb-2 sm:mb-2.5">
										{t(`homepage.mobile.${key}`)}
									</p>
									<p className="text-xs sm:text-sm text-[#05324f]/75 leading-snug">
										{t(`homepage.mobile.${descKey}`)}
									</p>
								</div>
							))}
						</div>

						<div className="w-full rounded-2xl sm:rounded-3xl border border-gray-200 bg-white px-6 sm:px-8 py-7 sm:py-8 text-center">
							<div className="flex items-center justify-center gap-1.5 mb-4">
								{[...Array(5)].map((_, i) => (
									<Star key={i} className="w-6 h-6 sm:w-7 sm:h-7 text-[#38BC54]" fill="#38BC54" stroke="#38BC54" />
								))}
							</div>
							<p className="text-lg sm:text-xl font-bold text-[#05324f] leading-snug">
								{t('homepage.mobile.rating_customers')}
							</p>
							<p className="text-base sm:text-lg text-[#05324f]/75 mt-2.5">
								{t('homepage.mobile.rating_score')}
							</p>
						</div>

						<div className="text-center pt-2 pb-2">
							<Link
								to="/how-it-works"
								className="text-[#38BC54] font-medium text-base sm:text-lg inline-flex items-center justify-center gap-2 hover:opacity-80 active:opacity-70 transition-opacity"
							>
								{t('homepage.mobile.how_it_works_link')}
								<ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
							</Link>
						</div>
					</div>
				</section>
			</main>

			<Footer className="hidden lg:block" />
		</div>
	)
}
