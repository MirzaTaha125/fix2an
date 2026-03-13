import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Camera, Receipt, Calendar } from 'lucide-react'
import { Button } from '../components/ui/Button'

export default function HowItWorksPage() {
	const { t } = useTranslation()

	return (
		<div className="min-h-screen bg-white">
			<Navbar />
			<div className="pt-20 pb-16">
				{/* Header Section */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
					<div className="text-center">
						<h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6" style={{ color: '#34C759' }}>
							{t('homepage.how_it_works.title')}
						</h1>
						<p className="text-base md:text-lg max-w-3xl mx-auto leading-relaxed text-gray-600">
							{t('homepage.how_it_works.subtitle')}
						</p>
					</div>
				</div>

				{/* Steps Section */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="space-y-16 md:space-y-24">
						{/* Step 1 */}
						<div className="flex flex-col md:flex-row items-center gap-8">
							<Card className="w-full md:w-1/2 text-left border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-visible bg-white group" style={{ borderRadius: '20px' }}>
								<div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#34C759' }}></div>
								<CardHeader className="relative z-10 pb-4 pt-6">
									<div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#34C759' }}>
										<Camera className="w-10 h-10 text-white" />
									</div>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-semibold text-gray-500">STEP 1</span>
									</div>
									<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#333333' }}>
										{t('homepage.how_it_works.step1.title')}
									</CardTitle>
								</CardHeader>
								<CardContent className="relative z-10 pb-6 px-6">
									<CardDescription className="text-sm md:text-base leading-relaxed" style={{ color: '#666666', lineHeight: '1.8' }}>
										{t('homepage.how_it_works.step1.description')}
									</CardDescription>
								</CardContent>
							</Card>
							<div className="w-full md:w-1/2 flex justify-center md:justify-end">
								<div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center opacity-50">
									<Camera className="w-32 h-32 text-green-400" />
								</div>
							</div>
						</div>

						{/* Step 2 */}
						<div className="flex flex-col md:flex-row-reverse items-center gap-8">
							<Card className="w-full md:w-1/2 text-left border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-visible bg-white group" style={{ borderRadius: '20px' }}>
								<div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#34C759' }}></div>
								<CardHeader className="relative z-10 pb-4 pt-6">
									<div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#34C759' }}>
										<Receipt className="w-10 h-10 text-white" />
									</div>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-semibold text-gray-500">STEP 2</span>
									</div>
									<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#333333' }}>
										{t('homepage.how_it_works.step2.title')}
									</CardTitle>
								</CardHeader>
								<CardContent className="relative z-10 pb-6 px-6">
									<CardDescription className="text-sm md:text-base leading-relaxed" style={{ color: '#666666', lineHeight: '1.8' }}>
										{t('homepage.how_it_works.step2.description')}
									</CardDescription>
								</CardContent>
							</Card>
							<div className="w-full md:w-1/2 flex justify-center md:justify-start">
								<div className="w-64 h-64 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center opacity-50">
									<Receipt className="w-32 h-32 text-green-400" />
								</div>
							</div>
						</div>

						{/* Step 3 */}
						<div className="flex flex-col md:flex-row items-center gap-8">
							<Card className="w-full md:w-1/2 text-left border-0 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-visible bg-white group" style={{ borderRadius: '20px' }}>
								<div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" style={{ backgroundColor: '#34C759' }}></div>
								<CardHeader className="relative z-10 pb-4 pt-6">
									<div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 shadow-2xl group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: '#34C759' }}>
										<Calendar className="w-10 h-10 text-white" />
									</div>
									<div className="flex items-center gap-2 mb-2">
										<span className="text-sm font-semibold text-gray-500">STEP 3</span>
									</div>
									<CardTitle className="text-xl md:text-2xl font-bold mb-3" style={{ color: '#333333' }}>
										{t('homepage.how_it_works.step3.title')}
									</CardTitle>
								</CardHeader>
								<CardContent className="relative z-10 pb-6 px-6">
									<CardDescription className="text-sm md:text-base leading-relaxed" style={{ color: '#666666', lineHeight: '1.8' }}>
										{t('homepage.how_it_works.step3.description')}
									</CardDescription>
								</CardContent>
							</Card>
							<div className="w-full md:w-1/2 flex justify-center md:justify-end">
								<div className="w-64 h-64 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center opacity-50">
									<Calendar className="w-32 h-32 text-emerald-400" />
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
					<div className="bg-gradient-to-r from-green-600 to-green-800 rounded-2xl p-8 md:p-12 text-center text-white">
						<h2 className="text-2xl md:text-3xl font-bold mb-4 text-center">
							{t('homepage.cta.title') || 'Ready to find your workshop?'}
						</h2>
						<p className="text-lg mb-8 opacity-90 text-center">
							{t('homepage.cta.subtitle') || 'Upload your inspection report and get offers today'}
						</p>
						<div className="flex justify-center">
							<Link to="/upload">
								<Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-6 text-lg">
									{t('homepage.cta.button') || 'Start now - It\'s free'}
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</div>
	)
}
