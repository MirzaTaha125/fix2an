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
		<div className="min-h-screen bg-white pb-16 md:pb-0 relative">
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
		<section className="py-20 bg-white max-md:py-12">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center items-stretch gap-6 sm:gap-8 max-md:gap-6">
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

		{/* How it works */}
		<section id="how-it-works-section" className="py-20 bg-gray-50 max-md:py-16 overflow-hidden">
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="text-center mb-16 max-md:mb-12">
					<h2 className="text-3xl md:text-h2 font-bold mb-4" style={{ color: '#05324f' }}>
							{t('homepage.how_it_works.title')}
						</h2>
					</div>

					<div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-12 md:gap-8 lg:gap-12 relative">
						{/* Steps connector line for desktop */}
						<div className="hidden md:block absolute top-[64px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 -z-0 rounded-full"></div>
						
						{/* Steps connector line for mobile (vertical) */}
						<div className="md:hidden absolute top-[10%] bottom-[10%] left-[50%] w-0.5 bg-gray-200 -z-0 transform -translate-x-1/2"></div>

						{/* Step 1 */}
						<div className="flex flex-col items-center text-center flex-1 w-full max-w-sm z-10 bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl">
							<div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-6 bg-white border-4 border-gray-100 shadow-sm relative transition-transform hover:scale-105 duration-300">
								<div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#34C759] text-white flex items-center justify-center font-bold text-sm shadow-md">1</div>
								<Camera className="w-12 h-12 md:w-16 md:h-16" style={{ color: '#05324f' }} />
							</div>
							<h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step1.title')}
							</h3>
						</div>

						{/* Step 2 */}
						<div className="flex flex-col items-center text-center flex-1 w-full max-w-sm z-10 bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl">
							<div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-6 bg-white border-4 border-gray-100 shadow-sm relative transition-transform hover:scale-105 duration-300">
								<div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#34C759] text-white flex items-center justify-center font-bold text-sm shadow-md">2</div>
								<CheckCircle className="w-12 h-12 md:w-16 md:h-16" style={{ color: '#05324f' }} />
							</div>
							<h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step2.title')}
							</h3>
						</div>

						{/* Step 3 */}
						<div className="flex flex-col items-center text-center flex-1 w-full max-w-sm z-10 bg-gray-50/80 backdrop-blur-sm p-4 rounded-xl">
							<div className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mx-auto mb-6 bg-white border-4 border-gray-100 shadow-sm relative transition-transform hover:scale-105 duration-300">
								<div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#34C759] text-white flex items-center justify-center font-bold text-sm shadow-md">3</div>
								<Car className="w-12 h-12 md:w-16 md:h-16" style={{ color: '#05324f' }} />
							</div>
							<h3 className="text-xl md:text-2xl font-bold mb-2" style={{ color: '#05324f' }}>
								{t('homepage.how_it_works.step3.title')}
							</h3>
						</div>
					</div>
				</div>
			</section>













			<Footer />


		</div>
	)
}
