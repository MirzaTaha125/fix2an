import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { CheckCircle, Building2, DollarSign, Award, ArrowRight, Shield, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

import FrameImage from '../assets/Frame.png'
import CertifiedImage from '../assets/certified.png'

export default function WorkshopLandingPage() {
	const { t } = useTranslation()

	return (
		<div className="min-h-screen bg-white pb-16 md:pb-0 relative">
			<Navbar />

			{/* Hero Section */}
			<section className="relative w-full bg-[#05324f] pt-32 sm:pt-40 pb-20 sm:pb-32 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent -skew-x-12 transform translate-x-1/4"></div>
                
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="text-center lg:text-left">
						    <h1 className="font-bold mb-6 leading-tight text-white" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)' }}>
							    {t('homepage.workshop.title')}
						    </h1>
						    <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed text-white/90">
							    {t('homepage.workshop.subtitle')}
						    </p>
						    <div className="flex justify-center lg:justify-start gap-4">
							    <Link to="/workshop/signup">
								    <Button 
									    size="lg" 
									    className="px-8 py-6 h-auto text-xl font-bold rounded-xl shadow-2xl hover:scale-105 transition-all duration-300 bg-[#34C759] text-white"
								    >
									    {t('homepage.workshop.cta')}
                                        <ArrowRight className="ml-2 w-6 h-6" />
								    </Button>
							    </Link>
						    </div>
                        </div>
                        <div className="hidden lg:block relative">
                            <img 
								src={FrameImage} 
								alt="Workshop illustration" 
								className="relative z-10 w-full h-auto rounded-2xl transform hover:rotate-2 transition-transform duration-500"
							/>
                        </div>
					</div>
				</div>
			</section>

            {/* Benefits Grid */}
			<section className="py-24 bg-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-[#05324f] mb-4">Why partner with Fix2An?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">Join the fastest growing network of certified workshops and scale your business with quality leads.</p>
                    </div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<Card className="flex flex-col items-center text-center p-8 rounded-2xl border-none bg-gray-50 hover:shadow-xl transition-all duration-300 group">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-[#05324f] group-hover:scale-110 transition-transform">
								<Building2 className="w-10 h-10 text-white" />
							</div>
							<h3 className="text-2xl font-bold mb-4 text-[#05324f]">
								{t('homepage.workshop.benefit1')}
							</h3>
                            <p className="text-gray-600">Access a steady stream of car owners actively looking for repair services in your area.</p>
						</Card>

						<Card className="flex flex-col items-center text-center p-8 rounded-2xl border-none bg-gray-50 hover:shadow-xl transition-all duration-300 group">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-[#05324f] group-hover:scale-110 transition-transform">
								<CheckCircle className="w-10 h-10 text-white" />
							</div>
							<h3 className="text-2xl font-bold mb-4 text-[#05324f]">
								{t('homepage.workshop.benefit2')}
							</h3>
                            <p className="text-gray-600">Our platform ensures all requests are verified and includes detailed repair protocols.</p>
						</Card>

						<Card className="flex flex-col items-center text-center p-8 rounded-2xl border-none bg-gray-50 hover:shadow-xl transition-all duration-300 group">
							<div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg bg-[#05324f] group-hover:scale-110 transition-transform">
								<DollarSign className="w-10 h-10 text-white" />
							</div>
							<h3 className="text-2xl font-bold mb-4 text-[#05324f]">
								{t('homepage.workshop.benefit3')}
							</h3>
                            <p className="text-gray-600">Reduce marketing costs and focus on what you do best: fixing cars. We handle the lead generation.</p>
						</Card>
					</div>
				</div>
			</section>

			{/* Certified Section */}
			<section className="py-24 bg-gray-50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                
				<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex flex-col md:flex-row items-center justify-center gap-16">
						<div className="flex-shrink-0 relative">
                            <div className="absolute inset-0 bg-[#34C759]/20 blur-2xl rounded-full scale-150"></div>
							<div 
								className="w-48 h-48 sm:w-64 sm:h-64 drop-shadow-2xl mx-auto relative z-10"
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
                            <Badge className="mb-4 bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">Quality Assured</Badge>
					        <h2 className="text-4xl font-bold mb-6 text-[#05324f]">
							    {t('homepage.workshop.certified')}
						    </h2>
						    <p className="text-xl text-gray-600 leading-relaxed">
								{t('homepage.workshop.certified_desc')}
							</p>
                            <div className="mt-8 flex flex-col sm:flex-row gap-6">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-6 h-6 text-[#34C759]" />
                                    <span className="font-semibold text-[#05324f]">Trusted Records</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Award className="w-6 h-6 text-[#34C759]" />
                                    <span className="font-semibold text-[#05324f]">Premium Quality</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Clock className="w-6 h-6 text-[#34C759]" />
                                    <span className="font-semibold text-[#05324f]">Efficient Flow</span>
                                </div>
                            </div>
						</div>
					</div>
				</div>
			</section>

            {/* Final CTA */}
            <section className="py-24 bg-[#05324f] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl font-bold text-white mb-6">Ready to grow your workshop?</h2>
                    <p className="text-xl text-white/80 mb-10 leading-relaxed">Join hundreds of other workshops already using Fix2An to grow their business. It takes less than 5 minutes to get started.</p>
                    <Link to="/workshop/signup">
                        <Button 
                            size="lg" 
                            className="px-12 py-7 h-auto text-2xl font-bold rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300 bg-[#34C759] text-white"
                        >
                            Get Started Now
                        </Button>
                    </Link>
                </div>
            </section>

			<Footer />
		</div>
	)
}
