import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { CheckCircle, Clock, Camera, FileUp, ShieldCheck, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import CertifiedImage from '../assets/certified.png'

export default function HomePage() {
	const { t } = useTranslation()
	const { loading: authLoading } = useAuth()

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

	return (
		<div className="min-h-screen bg-white pb-16 md:pb-0 relative">
			<Navbar />

			{/* Desktop Hero Section */}
			<section className="relative w-full bg-white pt-24 sm:pt-32 md:pt-36 pb-8 sm:pb-12 md:pb-16 hidden md:block">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="font-bold mb-3 sm:mb-4 md:mb-6 leading-tight px-2" style={{ color: '#05324f', fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
							{t('homepage.title')}
						</h1>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2" style={{ color: '#05324f' }}>
							{t('homepage.subtitle')}
						</p>
						<div className="flex justify-center px-2">
							<Link to="/upload">
								<Button
									size="lg"
									className="w-auto text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 h-auto font-semibold rounded-lg shadow-none md:shadow-lg hover:shadow-xl transition-all duration-300"
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									{t('homepage.cta_primary')}
								</Button>
							</Link>
						</div>
						{/* Fix2An Certified trust signal */}
						<div className="flex items-center justify-center gap-2 mt-4 text-xs font-semibold text-gray-400">
							<img src={CertifiedImage} alt="Fix2An Certified" className="w-4 h-4 object-contain" />
							<span>Fix2An Certified Workshops Only</span>
						</div>
					</div>
				</div>
			</section>

			{/* Mobile Hero Section - Matches the provided design */}
			<section className="md:hidden pt-24 pb-10 px-6 bg-white">
				<div className="text-center mb-8">
					<h1 className="text-[2.6rem] font-black text-[#05324f] leading-[1.05] mb-4 tracking-tight">
						{t('homepage.mobile.title')}
					</h1>
					<p className="text-[#05324f]/70 text-[1rem] leading-snug px-2">
						{t('homepage.mobile.subtitle')}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3 mb-7">
					<Link
						to="/upload"
						className="bg-[#38BC54] rounded-[1.5rem] aspect-[1/1.05] text-white flex flex-col items-center justify-center gap-4 px-3 shadow-sm active:scale-95 transition-transform"
					>
						<div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center">
							<Camera size={28} strokeWidth={2} />
						</div>
						<span className="text-center font-black text-[1.05rem] leading-tight">
							{t('homepage.mobile.take_photo')}
						</span>
					</Link>
					<Link
						to="/upload"
						className="bg-white border-2 border-gray-100 rounded-[1.5rem] aspect-[1/1.05] text-[#05324f] flex flex-col items-center justify-center gap-4 px-3 shadow-sm active:scale-95 transition-transform"
					>
						<div className="bg-[#F2F9F4] w-14 h-14 rounded-2xl flex items-center justify-center">
							<FileUp size={28} strokeWidth={2} className="text-[#38BC54]" />
						</div>
						<span className="text-center font-black text-[1.05rem] leading-tight">
							{t('homepage.mobile.upload_pdf')}
						</span>
					</Link>
				</div>

				<div className="flex items-center justify-center gap-4 mb-6">
					<div className="h-[1px] bg-gray-200 flex-1"></div>
					<span className="text-gray-400 font-medium text-sm">{t('common.or')}</span>
					<div className="h-[1px] bg-gray-200 flex-1"></div>
				</div>

				<div className="text-center mb-10">
					<Link to="/upload" className="text-[#05324f] font-bold text-[1rem] underline underline-offset-4 inline-flex items-center gap-2 active:opacity-70 transition-opacity">
						{t('homepage.mobile.no_image')} <ArrowRight size={18} />
					</Link>
				</div>

				<div className="bg-[#F2F9F4] rounded-full py-2.5 px-5 flex items-center justify-center gap-2 mx-auto w-fit border border-[#38BC54]/15">
					<ShieldCheck className="text-[#38BC54]" size={18} fill="#38BC54" fillOpacity={0.15} />
					<span className="text-[#05324f] font-bold text-[0.85rem]">
						{t('homepage.mobile.verified_badge')}
					</span>
				</div>
			</section>

			{/* Benefits Section — hidden on mobile as requested by the simplified design */}
			<section className="py-8 md:py-12 bg-white hidden md:block">
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center items-stretch gap-6 sm:gap-8 max-md:gap-4">
						<Card className="text-center border border-gray-200 bg-white rounded-xl shadow-sm w-full flex flex-col p-6 sm:p-8 hover:shadow-md transition-shadow">
							<div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0 bg-[#34C759]/10">
								<CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-[#34C759]" />
							</div>
							<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#05324f' }}>
								{t('homepage.features.verified.title')}
							</CardTitle>
							<CardContent className="p-0">
								<p className="text-base md:text-lg text-gray-600 leading-relaxed">
									{t('homepage.features.verified.description')}
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border border-gray-200 bg-white rounded-xl shadow-sm w-full flex flex-col p-6 sm:p-8 hover:shadow-md transition-shadow">
							<div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0 bg-[#34C759]/10">
								<CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-[#34C759]" />
							</div>
							<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#05324f' }}>
								{t('homepage.features.free.title')}
							</CardTitle>
							<CardContent className="p-0">
								<p className="text-base md:text-lg text-gray-600 leading-relaxed">
									{t('homepage.features.free.description')}
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border border-gray-200 bg-white rounded-xl shadow-sm w-full flex flex-col p-6 sm:p-8 hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
							<div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 shrink-0 bg-[#34C759]/10">
								<Clock className="w-8 h-8 md:w-10 md:h-10 text-[#34C759]" />
							</div>
							<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#05324f' }}>
								{t('homepage.features.fast.title')}
							</CardTitle>
							<CardContent className="p-0">
								<p className="text-base md:text-lg text-gray-600 leading-relaxed">
									{t('homepage.features.fast.description')}
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}
