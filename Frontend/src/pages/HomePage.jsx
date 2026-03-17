import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { CheckCircle, Shield, Clock, Star, ArrowRight, Timer, Heart, Award, Camera, Receipt, Calendar, Car, Building2, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { HeroCarousel } from '../components/HeroCarousel'
import Footer from '../components/Footer'
import FrameImage from '../assets/Frame.png'
import CertifiedImage from '../assets/certified.png'

export default function HomePage() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { user, loading: authLoading } = useAuth()
	const [parallaxOffset, setParallaxOffset] = useState(0)
	const [ctaSectionTop, setCtaSectionTop] = useState(0)

	// Redirect authenticated users to their respective dashboards
	// Commented out to allow homepage to be visible even when logged in
	// Uncomment if you want automatic redirect for logged-in users
	/*
	useEffect(() => {
		if (authLoading) return
		
		if (user) {
			const role = user.role?.toUpperCase()
			
			// Small delay to allow page to render first
			const timer = setTimeout(() => {
			if (role === 'ADMIN') {
				navigate('/admin', { replace: true })
			} else if (role === 'WORKSHOP') {
				navigate('/workshop/requests', { replace: true })
			} else if (role === 'CUSTOMER' || user.role) {
				navigate('/my-cases', { replace: true })
			}
			}, 100)
			
			return () => clearTimeout(timer)
		}
	}, [user, authLoading, navigate])
	*/

	// Store CTA section position on mount and resize
	useEffect(() => {
		const updateCtaPosition = () => {
			const ctaSection = document.getElementById('cta-section')
			if (ctaSection) {
				const rect = ctaSection.getBoundingClientRect()
				setCtaSectionTop(rect.top + window.scrollY)
			}
		}
		
		updateCtaPosition()
		window.addEventListener('resize', updateCtaPosition)
		return () => window.removeEventListener('resize', updateCtaPosition)
	}, [])

	useEffect(() => {
		let ticking = false
		
		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					const currentScrollY = window.scrollY
					const ctaSection = document.getElementById('cta-section')
					
					// Calculate parallax offset for CTA section
					if (ctaSection && ctaSectionTop > 0) {
						const rect = ctaSection.getBoundingClientRect()
						const viewportHeight = window.innerHeight
						const sectionStart = ctaSectionTop - viewportHeight
						
						// Calculate parallax when section is in viewport
						if (currentScrollY >= sectionStart && rect.bottom > 0) {
							const scrollProgress = currentScrollY - sectionStart
							const offset = Math.max(-100, Math.min(100, -scrollProgress * 0.3))
							setParallaxOffset(offset)
						} else if (currentScrollY < sectionStart) {
							setParallaxOffset(0)
						} else {
							setParallaxOffset(-100)
						}
					}
					
					ticking = false
				})
				ticking = true
			}
		}

		window.addEventListener('scroll', handleScroll, { passive: true })
		
		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [ctaSectionTop])

	// Show loading state while checking auth
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
		<div className="min-h-screen bg-white">
			<Navbar />

			{/* Hero Section */}
			<section className="relative w-full bg-white pt-24 sm:pt-32 md:pt-36 pb-8 sm:pb-12 md:pb-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<h1 className="font-bold mb-3 sm:mb-4 md:mb-6 leading-tight px-2 max-md:text-2xl" style={{ color: '#05324f', fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
							{t('homepage.title')}
						</h1>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 max-w-3xl mx-auto leading-relaxed px-2 max-md:text-base max-md:mb-6" style={{ color: '#05324f' }}>
							{t('homepage.subtitle')}
						</p>
						<div className="flex justify-center px-2 max-md:px-0">
							<Link to="/upload" className="max-md:w-full max-md:block">
								<Button 
									size="lg" 
									className="w-auto text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 h-auto font-semibold rounded-xl md:rounded-lg shadow-none md:shadow-lg hover:shadow-xl transition-all duration-300 max-md:w-full max-md:flex max-md:items-center max-md:justify-center max-md:gap-2 max-md:py-4" 
									style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
								>
									<Camera className="w-5 h-5 max-md:block md:hidden shrink-0" />
									{t('homepage.cta_primary')}
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</section>

		{/* Benefits Section */}
		<section className="py-20 bg-white max-md:py-10">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center items-stretch gap-6 sm:gap-8 max-md:gap-4">
						<Card className="text-center border border-gray-200 bg-white rounded-xl md:rounded-lg shadow-none md:shadow-sm w-full sm:w-auto h-auto min-h-[200px] sm:min-h-[240px] flex flex-col max-md:min-h-0 max-md:flex-row max-md:items-center max-md:text-left max-md:gap-3 max-md:py-4 max-md:px-4">
							<CardHeader className="pb-3 pt-6 sm:pt-8 px-4 sm:px-6 flex-grow max-md:py-0 max-md:px-0 max-md:flex-grow-0">
								<div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 max-md:mx-0 max-md:mb-0 max-md:w-10 max-md:h-10 shrink-0" style={{ backgroundColor: '#34C759' }}>
									<CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white max-md:w-5 max-md:h-5" />
								</div>
								<CardTitle className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 max-md:mb-0" style={{ color: '#05324f' }}>
									{t('homepage.features.verified.title')}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-6 sm:pb-8 px-4 sm:px-6 max-md:py-0 max-md:px-0 max-md:pt-0">
								<p className="text-sm sm:text-base md:text-lg max-md:text-sm text-gray-600 max-md:text-gray-600" style={{ color: 'inherit' }}>
									{t('homepage.features.verified.description')}
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border border-gray-200 bg-white rounded-xl md:rounded-lg shadow-none md:shadow-sm w-full sm:w-auto h-auto min-h-[200px] sm:min-h-[240px] flex flex-col max-md:min-h-0 max-md:flex-row max-md:items-center max-md:text-left max-md:gap-3 max-md:py-4 max-md:px-4">
							<CardHeader className="pb-3 pt-6 sm:pt-8 px-4 sm:px-6 flex-grow max-md:py-0 max-md:px-0 max-md:flex-grow-0">
								<div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 max-md:mx-0 max-md:mb-0 max-md:w-10 max-md:h-10 shrink-0" style={{ backgroundColor: '#34C759' }}>
									<CheckCircle className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white max-md:w-5 max-md:h-5" />
								</div>
								<CardTitle className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 max-md:mb-0" style={{ color: '#05324f' }}>
									{t('homepage.features.free.title')}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-6 sm:pb-8 px-4 sm:px-6 max-md:py-0 max-md:px-0 max-md:pt-0">
								<p className="text-sm sm:text-base md:text-lg max-md:text-sm text-gray-600" style={{ color: 'inherit' }}>
									{t('homepage.features.free.description')}
								</p>
							</CardContent>
						</Card>

						<Card className="text-center border border-gray-200 bg-white rounded-xl md:rounded-lg shadow-none md:shadow-sm w-full sm:w-auto h-auto min-h-[200px] sm:min-h-[240px] flex flex-col sm:col-span-2 lg:col-span-1 max-md:min-h-0 max-md:flex-row max-md:items-center max-md:text-left max-md:gap-3 max-md:py-4 max-md:px-4">
							<CardHeader className="pb-3 pt-6 sm:pt-8 px-4 sm:px-6 flex-grow max-md:py-0 max-md:px-0 max-md:flex-grow-0">
								<div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 max-md:mx-0 max-md:mb-0 max-md:w-10 max-md:h-10 shrink-0" style={{ backgroundColor: '#34C759' }}>
									<Clock className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white max-md:w-5 max-md:h-5" />
								</div>
								<CardTitle className="text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 max-md:mb-0" style={{ color: '#05324f' }}>
									{t('homepage.features.fast.title')}
								</CardTitle>
							</CardHeader>
							<CardContent className="pb-6 sm:pb-8 px-4 sm:px-6 max-md:py-0 max-md:px-0 max-md:pt-0">
								<p className="text-sm sm:text-base md:text-lg max-md:text-sm text-gray-600" style={{ color: 'inherit' }}>
									{t('homepage.features.fast.description')}
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

		{/* How it works */}
		<section id="how-it-works-section" className="py-20 bg-gray-50 max-md:py-10">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-12 max-md:mb-6 max-md:text-left">
					<h2 className="text-h2 font-bold mb-3 max-md:text-xl" style={{ color: '#05324f' }}>
							{t('homepage.how_it_works.title')}
						</h2>
					</div>

					{/* Mobile: numbered list */}
					<div className="md:hidden space-y-4">
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#05324f]">1</div>
							<div className="flex-1 flex items-center gap-2">
								<span className="text-[#05324f] font-medium text-sm">{t('homepage.how_it_works.step1.title')}</span>
								<Camera className="w-4 h-4 text-[#05324f] shrink-0" />
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#05324f]">2</div>
							<div className="flex-1 flex items-center gap-2">
								<span className="text-[#05324f] font-medium text-sm">{t('homepage.how_it_works.step2.title')}</span>
								<CheckCircle className="w-4 h-4 text-[#34C759] shrink-0" />
							</div>
						</div>
						<div className="flex items-start gap-3">
							<div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#05324f]">3</div>
							<span className="text-[#05324f] font-medium text-sm">{t('homepage.how_it_works.step3.title')}</span>
						</div>
					</div>

					<div className="hidden md:flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12">
						{/* Step 1 */}
						<div className="flex flex-col items-center text-center flex-1 w-full sm:w-auto max-w-[280px] sm:max-w-[320px]">
							<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 bg-gray-100">
								<Camera className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" style={{ color: '#05324f' }} />
							</div>
							<h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step1.title')}
							</h3>
						</div>

						<div className="hidden md:block w-24 md:w-32 h-0.5 bg-gray-100 self-center flex-shrink-0 mx-4 md:mx-8"></div>

						{/* Step 2 */}
						<div className="flex flex-col items-center text-center flex-1 w-full sm:w-auto max-w-[280px] sm:max-w-[320px]">
							<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 bg-gray-100">
								<CheckCircle className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" style={{ color: '#34C759' }} />
							</div>
							<h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step2.title')}
							</h3>
						</div>

						<div className="hidden md:block w-24 md:w-32 h-0.5 bg-gray-100 self-center flex-shrink-0 mx-4 md:mx-8"></div>

						{/* Step 3 */}
						<div className="flex flex-col items-center text-center flex-1 w-full sm:w-auto max-w-[280px] sm:max-w-[320px]">
							<div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 bg-gray-100">
								<Car className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16" style={{ color: '#34C759' }} />
							</div>
							<h3 className="text-base sm:text-lg font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step3.title')}
							</h3>
						</div>
					</div>
				</div>
			</section>

		{/* Workshop Registration Section */}
		<section className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
						{/* Left: Content */}
						<div className="order-2 lg:order-1 text-center lg:text-left">
					<h2 className="text-h2 font-bold mb-4" style={{ color: '#05324f' }}>
							{t('homepage.workshop.title')}
						</h2>
						<p className="text-base md:text-lg mb-8" style={{ color: '#05324f' }}>
								{t('homepage.workshop.subtitle')}
							</p>

							{/* Button */}
							<div className="flex justify-center lg:justify-start">
								<Link to="/workshop/signup">
									<Button 
										size="lg" 
										className="w-auto text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 h-auto font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300" 
										style={{ backgroundColor: '#34C759', color: '#FFFFFF' }}
									>
										{t('homepage.workshop.cta')}
									</Button>
								</Link>
							</div>
						</div>

						{/* Right: Image */}
						<div className="order-1 lg:order-2 flex justify-center lg:justify-end">
							<img 
								src={FrameImage} 
								alt="Workshop illustration showing mechanics working on a car" 
								className="w-full max-w-xs sm:max-w-sm md:max-w-md h-auto rounded-lg object-cover"
							/>
						</div>
					</div>
				</div>
			</section>

		{/* Workshop Benefits Section */}
		<section className="py-20 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
						<div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300">
							<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-md" style={{ backgroundColor: '#05324f' }}>
								<Building2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							</div>
							<h3 className="text-base sm:text-lg md:text-xl font-semibold leading-tight px-2" style={{ color: '#05324f' }}>
								{t('homepage.workshop.benefit1')}
							</h3>
						</div>

						<div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300">
							<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-md" style={{ backgroundColor: '#05324f' }}>
								<CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							</div>
							<h3 className="text-base sm:text-lg md:text-xl font-semibold leading-tight px-2" style={{ color: '#05324f' }}>
								{t('homepage.workshop.benefit2')}
							</h3>
						</div>

						<div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-lg hover:bg-gray-50 transition-colors duration-300 sm:col-span-2 md:col-span-1">
							<div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-md" style={{ backgroundColor: '#05324f' }}>
								<DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
							</div>
							<h3 className="text-base sm:text-lg md:text-xl font-semibold leading-tight px-2" style={{ color: '#05324f' }}>
								{t('homepage.workshop.benefit3')}
							</h3>
						</div>
					</div>
				</div>
			</section>

		{/* Certified Section */}
		<section className="py-20 bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-16">
						<div className="flex-shrink-0">
							<div 
								className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 drop-shadow-lg mx-auto"
								style={{ 
									backgroundColor: '#34C759',
									maskImage: `url(${CertifiedImage})`,
									WebkitMaskImage: `url(${CertifiedImage})`,
									maskSize: 'contain',
									WebkitMaskSize: 'contain',
									maskRepeat: 'no-repeat',
									WebkitMaskRepeat: 'no-repeat',
									maskPosition: 'center',
									WebkitMaskPosition: 'center'
								}}
							></div>
						</div>
						<div className="text-center md:text-left flex-1 max-w-2xl">
					<h2 className="text-h2 font-bold mb-4" style={{ color: '#05324f' }}>
							{t('homepage.workshop.certified')}
						</h2>
						<p className="text-base md:text-lg text-gray-600 leading-relaxed">
								{t('homepage.workshop.certified_desc')}
							</p>
						</div>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	)
}
